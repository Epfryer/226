import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerShopRoutes } from "./shop-routes";
import { setupVite, serveStatic, log } from "./vite";
import { registerPaymentWebhooks } from "./shop-webhooks";
import { initializeShop, shopRuntime } from "./shop-runtime";
import { reconcileOrders } from "./shop-fulfillment";

const app = express();
app.set('trust proxy', 1);
registerPaymentWebhooks(app);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && !path.startsWith("/api/shop")) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);
  registerShopRoutes(app);
  void initializeShop().then(() => {
    void reconcileOrders().catch(() => console.error("[Shop] Reconciliation unavailable"));
    let running = false;
    const timer = setInterval(async () => {
      if (running) return;
      running = true;
      try { await initializeShop(); await reconcileOrders(); } catch { console.error("[Shop] Reconciliation unavailable"); }
      finally { running = false; }
    }, 30000);
    timer.unref();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // Serve static files from public directory in development
  // This needs to be before Vite's catch-all route
  if (app.get("env") === "development") {
    app.use(express.static("public"));
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT from environment (for deployment) or default to 5000 (for development)
  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();