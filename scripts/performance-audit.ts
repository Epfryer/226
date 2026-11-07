import express from "express";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { serveStatic } from "../server/vite";

// Measure built assets, not Vite's development server. This isolated audit server
// has no checkout routes, payment initialization, or order reconciliation.
const app = express();
serveStatic(app, path.resolve("dist/public"));
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Audit server failed to bind");
const label = process.argv[2] || "current";
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error("Use an alphanumeric report label");
await mkdir("generated-artifacts/performance", { recursive: true });
try {
  for (const preset of ["mobile", "desktop"]) {
    const cli = process.env.LIGHTHOUSE_CLI || "node_modules/lighthouse/cli/index.js";
    const child = spawn(process.execPath, [
      cli, `http://127.0.0.1:${address.port}/`,
      "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--no-enable-error-reporting",
      "--output=json", "--output=html",
      `--output-path=generated-artifacts/performance/${label}-${preset}`,
      ...(preset === "desktop" ? ["--preset=desktop"] : []),
      "--quiet",
    ], { stdio: "inherit", env: process.env });
    const [code] = await once(child, "exit");
    if (code !== 0) throw new Error(`Lighthouse ${preset} exited with ${code}`);
  }
} finally {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
