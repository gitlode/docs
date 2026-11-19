import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { acquire, loadSources, stage } from "./pipeline.ts";
import { transferTranslations } from "./translation-transfer.ts";

try {
  const root = resolve(import.meta.dirname, "../..");
  switch (process.argv[2]) {
    case "transfer": {
      const { values } = parseArgs({
        args: process.argv.slice(3),
        options: { from: { type: "string" }, to: { type: "string" } },
      });
      if (!values.from || !values.to) throw new Error("Specify --from and --to edition IDs.");
      console.log(transferTranslations(root, values.from, values.to));
      break;
    }
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
