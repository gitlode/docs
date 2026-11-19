import { resolve } from "node:path";

import { acquire, loadSources, stage } from "./pipeline.ts";

try {
  const root = resolve(import.meta.dirname, "../..");
  switch (process.argv[2]) {
    case "acquire":
      acquire(root, loadSources(root));
      break;
    case "stage": {
      console.log(stage(root));
      break;
    }
    default:
      throw new Error("Usage: npm run source:acquire | npm run content:stage");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
