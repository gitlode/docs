import { handlePreviewSignals } from "./preview-server.ts";
import { buildPreviews, preparePreviews, preview, verifyPreviews } from "./previews.ts";

try {
  switch (process.argv[2]) {
    case "prepare":
      console.log(preparePreviews(process.argv[3]).output);
      break;
    case "build":
      buildPreviews(process.argv[3]);
      break;
    case "preview":
      handlePreviewSignals(await preview(process.argv[3]));
      break;
    case "verify":
      await verifyPreviews();
      break;
    default:
      throw new Error("Expected prepare, build, preview, or verify command.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
