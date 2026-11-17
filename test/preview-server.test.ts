import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { safeDirectory } from "../src/publishing/pipeline.ts";
import { startPreview, withPreviews } from "../src/publishing/preview-server.ts";

const directory = mkdtempSync(join(safeDirectory(resolve("."), ".generated/tests"), "preview-"));
writeFileSync(join(directory, "index.html"), "<h1>Preview fixture</h1>");
const config = { directory, base: "/docs/", port: 0 };

async function assertReleased(ports: number[]) {
  for (const port of ports) {
    const replacement = await startPreview(directory, config.base, port);
    await replacement.close();
  }
}

test("successful QA closes both listeners and keep-alive connections; ports can be rebound", async () => {
  const ports: number[] = [];
  await withPreviews([config, config], async (previews) => {
    for (const preview of previews) {
      ports.push(preview.port);
      const response = await fetch(preview.url, { signal: AbortSignal.timeout(5000) });
      assert.equal(response.status, 200);
      await response.text();
    }
  });
  await assertReleased(ports);
});

test("failed QA still releases every listener", async () => {
  const ports: number[] = [];
  await assert.rejects(
    withPreviews([config, config], async (previews) => {
      ports.push(...previews.map((preview) => preview.port));
      throw new Error("Simulated failed check");
    }),
    /Simulated failed check/,
  );
  await assertReleased(ports);
});

test("partial startup failure closes owned server without stopping unrelated listener", async () => {
  const unrelated = await startPreview(directory, config.base, 0);
  const reserved = await startPreview(directory, config.base, 0);
  const ownedPort = reserved.port;
  await reserved.close();
  try {
    await assert.rejects(
      withPreviews(
        [
          { ...config, port: ownedPort },
          { ...config, port: unrelated.port },
        ],
        async () => {
          assert.fail("Checks must not run after startup failure");
        },
      ),
      { code: "EADDRINUSE" },
    );
    await assertReleased([ownedPort]);
    assert.equal(unrelated.server.listening, true);
  } finally {
    await unrelated.close();
  }
});

test("close is idempotent and waits for actual server close", async () => {
  const preview = await startPreview(directory, config.base, 0);
  await Promise.all([preview.close(), preview.close()]);
  assert.equal(preview.server.listening, false);
  await assertReleased([preview.port]);
});
