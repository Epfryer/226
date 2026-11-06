import { runMigrations } from "stripe-replit-sync";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { shopPool } from "./shop-store";
import { getPrintfulClient } from "./printful";

export const shopRuntime = {
  ready: false, testMode: true,
  message: "Checkout is initializing. Please try again shortly.",
};
let infrastructureReady = false;
let initializing = false;
let lastChecked = 0;

export async function initializeShop() {
  if (initializing || Date.now() - lastChecked < 60000) return;
  initializing = true;
  lastChecked = Date.now();
  try {
    if (!process.env.PRINTFUL_API_KEY) throw new Error("Printful is not configured");
    await shopPool.query("SELECT id FROM shop_orders LIMIT 0");
    // Stripe owns its schema migrations; application schema is applied through Publish.
    if (!infrastructureReady) await runMigrations({ databaseUrl: process.env.DATABASE_URL! });
    const sync = await getStripeSync();
    const stripe = await getUncachableStripeClient();
    const balance = await stripe.balance.retrieve();
    shopRuntime.testMode = !balance.livemode;
    // Never allow a development deployment to place physical orders.
    if (process.env.REPLIT_DEPLOYMENT !== "1" && balance.livemode) {
      throw new Error("Development checkout requires a Stripe test connection");
    }
    if (balance.livemode) {
      const account = await stripe.accounts.retrieve();
      if (!account.charges_enabled) throw new Error("Stripe payment activation is incomplete");
      const info = await getPrintfulClient().getStoreInfo();
      if (!info.result) throw new Error("Printful store is unavailable");
    }
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
    if (!domain) throw new Error("A public webhook domain is required");
    if (!infrastructureReady) {
      await sync.findOrCreateManagedWebhook(`https://${domain}/api/stripe/webhook`, { enabled_events: ["*"] });
      await sync.findOrCreateManagedWebhook(`https://${domain}/api/shop/payment-events`, {
        enabled_events: ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"],
      });
      await sync.syncBackfill({ object: "all" });
      infrastructureReady = true;
    }
    const tax = await stripe.tax.settings.retrieve();
    if (tax.status !== "active") throw new Error("Stripe Tax needs a business origin address before checkout can open");
    shopRuntime.ready = true;
    shopRuntime.message = balance.livemode ? "Secure checkout is available." : "Test checkout only. No physical products will be ordered.";
    console.log(`[Shop] Checkout ready (${balance.livemode ? "live" : "test"} mode)`);
  } catch (error: any) {
    shopRuntime.ready = false;
    // Do not log provider responses, keys, addresses, or database URLs.
    const known = [
      "Printful is not configured", "Stripe Tax needs a business origin address before checkout can open",
      "Stripe payment activation is incomplete", "Development checkout requires a Stripe test connection",
    ];
    shopRuntime.message = known.includes(error.message) ? error.message : "Checkout setup is incomplete. Please contact the store owner.";
    console.error("[Shop] Initialization incomplete:", shopRuntime.message, error.code || error.type || "");
  } finally {
    initializing = false;
  }
}
