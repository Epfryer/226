import { runMigrations } from "stripe-replit-sync";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { shopPool } from "./shop-store";
import { getPrintfulClient } from "./printful";

export const shopRuntime = {
  ready: false, testMode: true,
  message: "Checkout is initializing. Please try again shortly.",
};

export function createShopInitializer(services = {
  pool: shopPool, migrate: runMigrations, getSync: getStripeSync,
  getStripe: getUncachableStripeClient, getPrintful: getPrintfulClient,
}, runtime = shopRuntime, config = {
  printfulConfigured: Boolean(process.env.PRINTFUL_API_KEY),
  databaseUrl: process.env.DATABASE_URL!,
  deployment: process.env.REPLIT_DEPLOYMENT === "1",
  domain: process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN,
  receiptSenderConfigured: Boolean(process.env.INQUIRY_FROM_EMAIL),
}) {
 let infrastructureReady = false;
 let initializing = false;
 let lastChecked = 0;
 return async function initializeShop() {
  if (initializing || Date.now() - lastChecked < 60000) return;
  initializing = true;
  lastChecked = Date.now();
  try {
    if (!config.printfulConfigured) throw new Error("Printful is not configured");
    await services.pool.query(`SELECT id,marketing_consent_recorded,
      (SELECT count(*) FROM shop_receipts WHERE false),
      (SELECT count(*) FROM shop_subscribers WHERE false) FROM shop_orders LIMIT 0`);
    if (config.receiptSenderConfigured === false) throw new Error("Order receipt email sender is not configured");
    // Stripe owns its schema migrations; application schema is applied through Publish.
    if (!infrastructureReady) await services.migrate({ databaseUrl: config.databaseUrl });
    const sync = await services.getSync();
    const stripe = await services.getStripe();
    const balance = await stripe.balance.retrieve();
    runtime.testMode = !balance.livemode;
    // Never allow a development deployment to place physical orders.
    if (!config.deployment && balance.livemode) {
      throw new Error("Development checkout requires a Stripe test connection");
    }
    if (balance.livemode) {
      const account = await stripe.accounts.retrieve();
      if (!account.charges_enabled) throw new Error("Stripe payment activation is incomplete");
      const info = await services.getPrintful().getStoreInfo();
      if (!info.result) throw new Error("Printful store is unavailable");
    }
    const domain = config.domain;
    if (!domain) throw new Error("A public webhook domain is required");
    if (!infrastructureReady) {
      await sync.findOrCreateManagedWebhook(`https://${domain}/api/stripe/webhook`, { enabled_events: ["*"] });
      await sync.findOrCreateManagedWebhook(`https://${domain}/api/shop/payment-events`, {
        enabled_events: ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"],
      });
      infrastructureReady = true;
    }
    const tax = await stripe.tax.settings.retrieve();
    if (tax.status !== "active") throw new Error("Stripe Tax needs a business origin address before checkout can open");
    runtime.ready = true;
    runtime.message = balance.livemode ? "Secure checkout is available." : "Test checkout only. No physical products will be ordered.";
    console.log(`[Shop] Checkout ready (${balance.livemode ? "live" : "test"} mode), prerequisites checked in ${Date.now() - lastChecked}ms; process age ${Math.round(process.uptime() * 1000)}ms`);
  } catch (error: any) {
    runtime.ready = false;
    // Do not log provider responses, keys, addresses, or database URLs.
    const known = [
      "Printful is not configured", "Stripe Tax needs a business origin address before checkout can open",
      "Stripe payment activation is incomplete", "Development checkout requires a Stripe test connection",
      "Order receipt email sender is not configured",
    ];
    runtime.message = known.includes(error.message) ? error.message : "Checkout setup is incomplete. Please contact the store owner.";
    console.error("[Shop] Initialization incomplete:", runtime.message, error.code || error.type || "");
  } finally {
    initializing = false;
  }
 };
}
export const initializeShop = createShopInitializer();
