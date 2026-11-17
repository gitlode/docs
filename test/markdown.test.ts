import assert from "node:assert/strict";
import test from "node:test";

import {
  parseSafeMarkdown,
  prepareMarkdown,
  rewriteLink,
  routeFor,
} from "../src/publishing/markdown.ts";
import type { LinkContext } from "../src/publishing/markdown.ts";

const context: LinkContext = {
  sourcePath: "packages/gitlode/docs/usage.md",
  commit: "a".repeat(40),
  base: "/docs/example/next/en/",
  routes: new Map([
    ["packages/gitlode/docs/design/README.md", "design/"],
    ["packages/gitlode/docs/profiling.md", "profiling/"],
  ]),
  tree: new Map([
    ["packages/gitlode/docs/design", { mode: "040000", type: "tree" }],
    ["packages/gitlode/docs/profiling.md", { mode: "100644", type: "blob" }],
    ["packages/gitlode/docs/handoff", { mode: "040000", type: "tree" }],
    ["packages/gitlode/docs/design/metrics.yaml", { mode: "100644", type: "blob" }],
    ["packages/gitlode/docs/link.md", { mode: "120000", type: "blob" }],
  ]),
};

test("published README directories and page fragments use internal nested routes", () => {
  assert.equal(routeFor("packages/gitlode/docs/design/README.md"), "design/");
  assert.equal(routeFor("packages/gitlode/docs/usage.md"), "usage/");
  assert.equal(routeFor("packages/gitlode/docs/design/myREADME.md"), "design/myREADME/");
  assert.equal(rewriteLink("design/", context), "/docs/example/next/en/design/");
  assert.equal(
    rewriteLink("profiling.md#example", context),
    "/docs/example/next/en/profiling/#example",
  );
});

test("unselected existing directories and blobs stay upstream at the exact commit", () => {
  assert.equal(
    rewriteLink("handoff/", context),
    `https://github.com/gitlode/gitlode/tree/${context.commit}/packages/gitlode/docs/handoff`,
  );
  assert.equal(
    rewriteLink("design/metrics.yaml#metric", context),
    `https://github.com/gitlode/gitlode/blob/${context.commit}/packages/gitlode/docs/design/metrics.yaml#metric`,
  );
});

test("unsafe, absent, symlink and escaping targets fail closed", () => {
  for (const url of [
    "missing.md",
    "link.md",
    "../../../../outside",
    "%2fetc/passwd",
    "a%5Cb",
    "javascript:alert(1)",
    "data:text/html,x",
    "//host/x",
  ]) {
    assert.throws(() => rewriteLink(url, context));
  }
});

test("reference links are rewritten; code values and literal TypeScript angles survive", () => {
  const source =
    "# Guide\n\n[Profile][p]\n\n[p]: profiling.md#example\n\n```ts\nconst x: Array<T> = [];\n```\n\nUse `<repo>` and `{{ example }}`.\n";
  const prepared = prepareMarkdown(source, context);
  assert.equal(prepared.title, "Guide");
  assert.ok(prepared.markdown.includes("/docs/example/next/en/profiling/#example"));
  const originalCode = parseSafeMarkdown(source).children.find((n) => n.type === "code");
  const preparedCode = parseSafeMarkdown(prepared.markdown).children.find((n) => n.type === "code");
  assert.deepEqual(
    preparedCode && { ...preparedCode, position: undefined },
    originalCode && { ...originalCode, position: undefined },
  );
  assert.ok(!prepared.body.startsWith("# Guide"));
});

test("active HTML, Vue, includes inside fences, snippets, metadata and unselected assets are rejected", () => {
  assert.throws(() => prepareMarkdown("# `{{ dangerous() }}`\n", context), /Unsafe title/);
  for (const body of [
    "<script>alert(1)</script>",
    "<Widget />",
    "{{ dangerous() }}",
    "<<< @/secret",
    "::: custom",
    "![asset](a.png)",
    "```ts twoslash\nlet x=1;\n```",
    "```md\n<!-- @include: /secret -->\n```",
    "[x](javascript:alert)",
  ]) {
    assert.throws(() => prepareMarkdown(`# Guide\n\n${body}\n`, context));
  }
  assert.throws(() => parseSafeMarkdown("---\ntitle: untrusted\n---\n# Guide"));
});
