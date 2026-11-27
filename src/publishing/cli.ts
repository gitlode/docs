import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { acquire, loadSources, stage } from "./pipeline.ts";
import { transferTranslations } from "./translation-transfer.ts";

try {
  const root = resolve(import.meta.dirname, "../..");
  switch (process.argv[2]) {
    case "transfer": {
      const usage =
        "Replace all Japanese translations in the destination edition.\n\n" +
        "npm run translations:transfer -- --from <edition> --to <edition>";
      const { values } = parseArgs({
        args: process.argv.slice(3),
        options: { from: { type: "string" }, to: { type: "string" }, help: { type: "boolean" } },
      });
      if (values.help) {
        console.log(usage);
        break;
      }
      if (!values.from || !values.to) throw new Error(usage);
      const result = transferTranslations(root, values.from, values.to);
      console.log(`Replaced all Japanese translations in ${result.to} using ${result.from}.`);
      console.log(result);
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
