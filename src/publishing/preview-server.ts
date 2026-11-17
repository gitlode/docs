import { createServer } from "node:http";
import type { Server } from "node:http";

import sirv from "sirv";

export interface PreviewServer {
  server: Server;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export async function startPreview(
  directory: string,
  base: string,
  port: number,
): Promise<PreviewServer> {
  const serve = sirv(directory, { dev: true, single: false });
  const server = createServer((request, response) => {
    const address = server.address();
    const actualPort = address && typeof address !== "string" ? address.port : port;
    if (
      request.headers.host !== `127.0.0.1:${actualPort}` &&
      request.headers.host !== `localhost:${actualPort}`
    ) {
      response.writeHead(403).end();
      return;
    }
    if (!request.url?.startsWith(base)) {
      response.writeHead(404).end();
      return;
    }
    request.url = "/" + request.url.slice(base.length);
    serve(request, response, () => {
      response.writeHead(404).end();
    });
  });
  await new Promise<void>((resolve, reject) => {
    const failed = (error: Error) => reject(error);
    server.once("error", failed);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", failed);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP preview address.");
  let closing: Promise<void> | undefined;
  return {
    server,
    port: address.port,
    url: `http://127.0.0.1:${address.port}${base}`,
    close() {
      closing ??= new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
        // QA must also release keep-alive or active HTTP connections.
        server.closeAllConnections();
      });
      return closing;
    },
  };
}

/** Own server lifetimes in this process; partial startup and failed checks also clean up. */
export async function withPreviews<T>(
  configurations: { directory: string; base: string; port: number }[],
  check: (previews: PreviewServer[]) => Promise<T>,
): Promise<T> {
  const previews: PreviewServer[] = [];
  try {
    for (const config of configurations)
      previews.push(await startPreview(config.directory, config.base, config.port));
    return await check(previews);
  } finally {
    await Promise.all(previews.map((preview) => preview.close()));
  }
}

export function handlePreviewSignals(preview: PreviewServer): void {
  const stop = () => {
    void preview.close().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  preview.server.once("close", () => {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    console.log(`Stopped preview on 127.0.0.1:${preview.port}`);
  });
}
