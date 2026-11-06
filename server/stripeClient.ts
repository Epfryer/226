import Stripe from 'stripe';
import { ReplitConnectors } from "@replit/connectors-sdk";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Stripe connection unavailable");
  const data = await response.json();
  
  connectionSettings = data.items?.[0];

  const settings = connectionSettings?.settings;
  if (!(settings?.secret_key || settings?.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: settings.publishable_key || settings.publishable,
    secretKey: settings.secret_key || settings.secret,
  };
}

export async function getUncachableStripeClient() {
  // Provider authentication stays at the connector proxy. The key below is not a credential.
  const connectors = new ReplitConnectors();
  return new Stripe("connector-authenticated", {
    apiVersion: '2025-08-27.basil',
    maxNetworkRetries: 2,
    timeout: 20000,
    httpClient: Stripe.createFetchHttpClient(async (url: RequestInfo | URL, init?: RequestInit) => {
      const target = new URL(String(url));
      const headers: Record<string, string> = {};
      new Headers(init?.headers).forEach((value, name) => {
        if (!["authorization", "host", "content-length"].includes(name)) headers[name] = value;
      });
      return connectors.proxy("stripe", `${target.pathname}${target.search}`, {
        method: init?.method, headers, body: init?.body, signal: init?.signal,
      });
    }),
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
      stripeApiVersion: "2025-08-27.basil",
    });
    stripeSync.stripe = await getUncachableStripeClient();
  }
  return stripeSync;
}
