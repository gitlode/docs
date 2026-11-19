import { handlePreviewSignals } from "../publishing/preview-server.ts";
import { buildSite, prepareSite, preview, verifySite } from "../ssg/vitepress/build.ts";
try {
  switch (process.argv[2]) {
    case "prepare":
      console.log(prepareSite(process.argv[3]).output);
      break;
    case "build":
      buildSite(process.argv[3]);
      break;
    case "preview":
      handlePreviewSignals(await preview());
      break;
    case "verify":
      await verifySite();
      break;
    default:
      throw new Error("Expected prepare, build, preview, or verify command.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
