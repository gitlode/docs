import { buildPreviews, preparePreviews, preview } from "./previews.ts";

try {
  switch (process.argv[2]) {
    case "prepare":
      console.log(preparePreviews(process.argv[3]).output);
      break;
    case "build":
      buildPreviews(process.argv[3]);
      break;
    case "preview":
      preview(process.argv[3]);
      break;
    default:
      throw new Error("Expected prepare, build, or preview command.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
