import { Client } from '@replit/object-storage';import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { registerCrawlerRoutes, renderPublicResponse, publicContentServices } from "./public-render";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  registerCrawlerRoutes(app);
  app.get("/index.html", (_req, res) => res.redirect(301, "/"));
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      host: '0.0.0.0',
      allowedHosts: ['.replit.dev'],
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`)
      const pathname = new URL(url, "http://public.invalid").pathname;
      if (!["GET", "HEAD"].includes(req.method) || pathname === "/api" || pathname.startsWith("/api/") || pathname.startsWith("/assets/") || /\.[a-z0-9]+$/i.test(pathname)) {
        res.status(404).type("text/plain").send("Resource not found");
        return;
      }
      const rendered = await renderPublicResponse(template, url);
      const page = await vite.transformIndexHtml(url, rendered.html);
      res.status(rendered.status).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express, distPath = path.resolve(__dirname, "public"), services = publicContentServices) {
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Do not let express.static bypass route metadata for "/" or "/index.html".
  const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
  registerCrawlerRoutes(app);
  app.get("/index.html", (_req, res) => res.redirect(301, "/"));
  app.use(express.static(distPath, { index: false }));

  app.use("*", async (req, res, next) => {
    try {
      const pathname = new URL(req.originalUrl, "http://public.invalid").pathname;
      if (!["GET", "HEAD"].includes(req.method) || pathname === "/api" || pathname.startsWith("/api/") || pathname.startsWith("/assets/") || /\.[a-z0-9]+$/i.test(pathname)) {
        res.status(404).type("text/plain").send("Resource not found");
        return;
      }
      const rendered = await renderPublicResponse(template, req.originalUrl, services);
      res.status(rendered.status).type("html").send(rendered.html);
    } catch (error) { next(error); }
  });
}
