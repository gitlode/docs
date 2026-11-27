import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";

export interface Source {
  path: string;
  label: string;
  ref: string;
  commit: string;
}
export interface Sources {
  repository: string;
  defaultEdition?: string;
  editions: Record<string, Source>;
}
export interface Publication {
  files: string[];
}

export function validateEdition(id: string) {
  if (
    typeof id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
    ["all", "constructor", "prototype"].includes(id)
  )
    throw new Error("Invalid editions registry identifier.");
  validatePath(id);
}

export function loadSources(root: string): Sources {
  const registry = JSON.parse(readFileSync(join(root, "config/editions.json"), "utf8")) as {
    repository: string;
    defaultEdition?: string;
    editions: Record<string, Pick<Source, "path" | "label">>;
  };
  const editions = Object.fromEntries(
    Object.entries(registry.editions).map(([id, display]) => {
      validateEdition(id);
      const { ref, commit } = JSON.parse(
        readFileSync(join(root, "config", id, "source.json"), "utf8"),
      ) as Source;
      return [id, { path: display.path, label: display.label, ref, commit }];
    }),
  );
  const sources = {
    repository: registry.repository,
    defaultEdition: registry.defaultEdition,
    editions,
  };
  validateSources(sources);
  return sources;
}

export function git(repository: string, args: string[]): Buffer {
  // Trust only this explicitly chosen repository, without changing global Git settings.
  return execFileSync(
    "git",
    [
      "-c",
      `safe.directory=${resolve(repository).replaceAll("\\", "/")}`,
      "-C",
      repository,
      ...args,
    ],
    { maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
}

export function validatePath(path: string): string {
  if (
    !/^[A-Za-z0-9_./-]+$/.test(path) ||
    isAbsolute(path) ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    path.split("/").some((part) => /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(part))
  ) {
    throw new Error(`Unsafe repository-relative path: ${path}`);
  }
  return path;
}

export function validatePublication(publication: Publication): void {
  const files = publication.files;
  if (!Array.isArray(files) || !files.length) throw new Error("Publication must select files.");
  const seen = new Set<string>();
  for (const file of files) {
    validatePath(file);
    if (
      (!/^packages\/(?:gitlode|plugin-[a-z0-9-]+)\/README\.md$/.test(file) &&
        !/^packages\/gitlode\/docs\/(usage\.md|profiling\.md|(?:design|contributing)\/.+\.md)$/.test(
          file,
        )) ||
      /(^|\/)(agents|handoff|AGENTS\.md)(\/|$)/i.test(file)
    ) {
      throw new Error(`File outside durable publication policy: ${file}`);
    }
    if (seen.has(file.toLowerCase())) throw new Error(`Duplicate publication path: ${file}`);
    seen.add(file.toLowerCase());
  }
}

export function validateSources(sources: Sources): void {
  if (sources.repository !== "https://github.com/gitlode/gitlode.git")
    throw new Error("Unexpected upstream repository.");
  if (!Object.keys(sources.editions).length) throw new Error("Empty editions registry.");
  if (
    sources.defaultEdition !== undefined &&
    !Object.hasOwn(sources.editions, sources.defaultEdition)
  )
    throw new Error("Unknown default edition.");
  const paths = new Set<string>();
  for (const [id, source] of Object.entries(sources.editions)) {
    validateEdition(id);
    if (typeof source.path !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.path))
      throw new Error("Edition path must be a lowercase URL segment.");
    validatePath(source.path);
    if (["agents", "handoff"].includes(source.path) || paths.has(source.path))
      throw new Error("Reserved or duplicate edition path.");
    paths.add(source.path);
    if (
      typeof source.label !== "string" ||
      !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .()-]*$/u.test(source.label) ||
      source.label.trim() !== source.label
    )
      throw new Error("Invalid edition display label.");
    if (!/^[a-f0-9]{40}$/.test(source.commit))
      throw new Error("Source must be pinned to a full commit SHA.");
    if (!/^refs\/(heads|tags)\/[A-Za-z0-9_@./-]+$/.test(source.ref) || source.ref.includes("..")) {
      throw new Error(`Invalid requested ref: ${source.ref}`);
    }
  }
}

// Reject symlinks/junctions before traversing generated output directories.
export function safeDirectory(root: string, path: string): string {
  const destination = resolve(root, path);
  const rel = relative(resolve(root), destination);
  if (!rel || rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel))
    throw new Error("Write must stay under generated root.");
  let cursor = resolve(root);
  while (true) {
    if (lstatSync(cursor).isSymbolicLink())
      throw new Error(`Symlink directory is forbidden: ${cursor}`);
    const ancestor = resolve(cursor, "..");
    if (ancestor === cursor) break;
    cursor = ancestor;
  }
  cursor = resolve(root);
  for (const part of rel.split(sep)) {
    cursor = join(cursor, part);
    try {
      mkdirSync(cursor);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const stat = lstatSync(cursor);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error(`Unsafe output directory: ${cursor}`);
  }
  return destination;
}

export function resolveCommit(repository: string, revision: string): string {
  try {
    return git(repository, ["rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`])
      .toString()
      .trim();
  } catch {
    throw new Error(
      `Cannot resolve commit ${revision}. Run npm run source:acquire and check the edition source configuration.`,
    );
  }
}

export function acquire(root: string, sources: Sources): void {
  validateSources(sources);
  const generated = safeDirectory(root, ".generated");
  const repository = safeDirectory(generated, "source");
  // Test the exact Git directory: rev-parse in an empty directory would find the parent repository.
  try {
    lstatSync(join(repository, ".git"));
  } catch {
    execFileSync("git", ["init", repository], { stdio: "pipe" });
  }
  for (const [edition, source] of Object.entries(sources.editions)) {
    try {
      git(repository, ["fetch", "--no-tags", "--depth=1", sources.repository, source.ref]);
      const observed = resolveCommit(repository, "FETCH_HEAD");
      if (observed !== source.commit) {
        console.warn(
          `${edition}: ${source.ref} now resolves to ${observed}; retaining configured pin ${source.commit}.`,
        );
        git(repository, ["fetch", "--no-tags", "--depth=1", sources.repository, source.commit]);
      }
      if (resolveCommit(repository, source.commit) !== source.commit)
        throw new Error("Commit mismatch.");
      console.log(`${edition}: ${source.ref} -> pinned ${source.commit}`);
    } catch (error) {
      throw new Error(
        `Failed acquiring ${edition} (${source.ref}). Check network access, ref, and commit pin.`,
        { cause: error },
      );
    }
  }
}

export function readDocument(repository: string, commit: string, file: string) {
  validatePath(file);
  const entry = git(repository, ["ls-tree", commit, "--", file]).toString().trim();
  const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(entry);
  if (!match || match[3] !== file)
    throw new Error(`Missing or non-regular selected file at ${commit}: ${file}`);
  const content = git(repository, ["cat-file", "blob", match[2]]);
  return { content, blob: match[2], sha256: createHash("sha256").update(content).digest("hex") };
}

export function stage(root: string, sources: Sources = loadSources(root)): string {
  validateSources(sources);

  const repository = join(root, ".generated", "source");
  // Validate all inputs before creating a run; previous runs remain intact.
  const editions = Object.entries(sources.editions).map(([name, source]) => {
    const publication: Publication = JSON.parse(
      readFileSync(join(root, "config", name, "publication.json"), "utf8"),
    );
    validatePublication(publication);
    const commit = resolveCommit(repository, source.commit);
    return {
      name,
      ...source,
      commit,
      documents: publication.files.map((path) => ({
        path,
        ...readDocument(repository, commit, path),
      })),
    };
  });
  const generated = safeDirectory(root, ".generated");
  const staging = safeDirectory(generated, "staging");
  const output = mkdtempSync(join(staging, "run-"));
  let docsRevision: string | null = null;
  let docsDirty: boolean | null = null;
  try {
    docsRevision = resolveCommit(root, "HEAD");
    docsDirty = Boolean(
      git(root, ["status", "--porcelain", "--untracked-files=normal"]).toString().trim(),
    );
  } catch {
    /* An exported source archive has no Git revision. */
  }
  const manifest = {
    schemaVersion: 1,
    repository: sources.repository,
    docsRevision,
    docsDirty,
    configSha256: createHash("sha256")
      .update(
        JSON.stringify({
          sources,
          selections: editions.map((e) => e.documents.map((d) => d.path)),
        }),
      )
      .digest("hex"),
    editions: editions.map((edition) => ({
      name: edition.name,
      path: edition.path,
      label: edition.label,
      requestedRef: edition.ref,
      resolvedCommit: edition.commit,
      documents: edition.documents.map((document) => {
        const outputPath = `${edition.name}/en/${document.path}`;
        const parent = safeDirectory(output, outputPath.slice(0, outputPath.lastIndexOf("/")));
        writeFileSync(join(parent, basename(document.path)), document.content, { flag: "wx" });
        return {
          sourcePath: document.path,
          stagedPath: outputPath,
          blob: document.blob,
          sha256: document.sha256,
          sourceUrl: `https://github.com/gitlode/gitlode/blob/${edition.commit}/${document.path}`,
        };
      }),
    })),
  };
  // A run is complete only when its manifest exists.
  writeFileSync(join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", {
    flag: "wx",
  });
  return output;
}
