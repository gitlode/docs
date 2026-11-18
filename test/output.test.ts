import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

import { safeDirectory } from "../src/publishing/pipeline.ts";
import { validateOutput } from "../src/publishing/validate-output.ts";
import { validateRendering } from "../src/ssg/vitepress/validate-rendering.ts";

const scratch = safeDirectory(resolve("."), ".generated/tests");
const base = "/docs/next/en/";

function fixture(extra = "") {
  const root = mkdtempSync(join(scratch, "output-"));
  function write(path: string, content: string) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  write("index.html", `<h1>Home</h1><a href="${base}guide/#example">Guide</a>${extra}`);
  write(
    "guide/index.html",
    '<h1>Guide</h1><h2 id="example">Example</h2><a href="../">Home</a><script src="../assets/main.js"></script>',
  );
  write("assets/main.js", "console.log('static fixture');");
  return { root, write };
}

test("validates nested-base pages, anchors, static assets and records output statistics", () => {
  const { root } = fixture('<a href="https://example.com/external">External</a>');
  const result = validateOutput(root, base, ["guide/"]);
  assert.equal(result.htmlFiles, 2);
  assert.equal(result.expectedPages, 2);
  assert.equal(result.localLinks, 3);
  assert.ok(result.bytes > 100);
});

test("missing local page and static asset references fail", () => {
  for (const extra of ['<a href="missing/">Missing</a>', '<img src="assets/missing.png">']) {
    const { root } = fixture(extra);
    assert.throws(() => validateOutput(root, base, ["guide/"]), /Missing local target/);
  }
});

test("missing cross-page fragments fail even when the page exists", () => {
  const { root } = fixture('<a href="guide/#unknown">Bad fragment</a>');
  assert.throws(() => validateOutput(root, base, ["guide/"]), /Missing fragment #unknown/);
});

test("root-relative links cannot escape a nested deployment base", () => {
  const { root } = fixture('<a href="/guide/">Outside base</a>');
  assert.throws(() => validateOutput(root, base, ["guide/"]), /escapes site base/);
});

test("excluded content fails even when it is not linked", () => {
  const { root, write } = fixture();
  write("handoff/index.html", "<h1>Excluded</h1>");
  assert.throws(() => validateOutput(root, base, ["guide/"]), /Excluded content/);
});

test("expected pages require one H1 and a generated landing page", () => {
  const { root, write } = fixture();
  assert.throws(() => validateOutput(root, base, ["missing/"]), /Missing expected page/);
  write("guide/index.html", "<h1>First</h1><h1>Duplicate</h1>");
  assert.throws(() => validateOutput(root, base, ["guide/"]), /exactly one H1/);
});

test("encoded fragments resolve and executable URL schemes fail", () => {
  const { root, write } = fixture('<a href="guide/?query=1#%E4%BE%8B">Unicode fragment</a>');
  write("guide/index.html", '<h1>Guide</h1><h2 id="example">Example</h2><h2 id="例">Example</h2>');
  assert.equal(validateOutput(root, base, ["guide/"]).htmlFiles, 2);
  write(
    "guide/index.html",
    '<h1>Guide</h1><h2 id="example">Example</h2><h2 id="例">Example</h2><a href="javascript:alert(1)">Bad</a>',
  );
  assert.throws(() => validateOutput(root, base, ["guide/"]), /Unsafe URL/);
});

test("rendering assertions distinguish sidebar, TOC, code and table regressions", () => {
  const source =
    "# Page\n\n## Example\n\n```ts\nconst x: Array<string> = [];\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n";
  const sidebar = '<aside class="VPSidebar"><a href="/docs/guide/">Guide</a></aside>';
  const toc = '<nav class="VPDocAsideOutline"></nav>';
  const code = "<pre><code><span>const x: Array&lt;string&gt; = [];</span>\n</code></pre>";
  const table = "<table><tr><td>1</td><td>2</td></tr></table>";
  const render = (html: string) => validateRendering(html, source, ["/docs/guide/"]);
  assert.deepEqual(render(sidebar + toc + code + table), {
    sidebarLinks: 1,
    tocHeadings: 1,
    codeBlocks: 1,
    tables: 1,
  });
  assert.throws(
    () => render(toc + code + table + '<a href="/docs/guide/">Outside sidebar</a>'),
    /missing sidebar/,
  );
  assert.throws(() => render(sidebar + code + table), /missing per-page TOC/);
  assert.throws(
    () => render(sidebar + toc + code.replace("const x", "const y") + table),
    /code block missing or changed/,
  );
  assert.throws(() => render(sidebar + toc + code), /missing GFM tables/);
});

test("VitePress code blocks preserve blank lines and indentation", () => {
  const source = "# Example\n\n```js\n// example.js\n\n  const x = 1;\n```\n";
  const html = "<pre><code>// example.js\n\n  const x = 1;\n</code></pre>";
  assert.equal(validateRendering(html, source, []).codeBlocks, 1);
  assert.throws(
    () => validateRendering(html.replace("// example.js", ""), source, []),
    /code block missing or changed/,
  );
  assert.throws(
    () => validateRendering(html.replace("\n\n", "\n"), source, []),
    /code block missing or changed/,
  );
});
