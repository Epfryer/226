# Shop checkout and Printful fulfillment

## Current launch blocker

Stripe is connected in **test mode**. Its Tax settings do not yet have an active
business origin address. Checkout deliberately stays unavailable rather than
silently disabling taxes. In your Stripe account/sandbox, finish **Tax → Settings**
with your actual business origin, review the tax category and registrations
appropriate to your business, and consult a tax professional if needed.

Availability is rechecked about once a minute while the application runs.
The checkout dialog displays the current setup status.

## What happens after setup

1. Shoppers select your Printful product variants on `/studio`.
2. Your website collects the delivery address and requests Printful shipping rates.
3. A 15-minute quote stores authoritative product prices and shipping choices.
4. Before payment, availability and prices are revalidated and Printful's estimated
   fulfillment cost is checked against the pre-tax customer payment.
5. Stripe-hosted checkout collects card payment and calculates applicable tax.
   The delivery address is fixed to the quote, not changed after shipping pricing.
6. A **separate signed payment webhook** verifies the payment server-side and
   submits and confirms the Printful order, whether or not the shopper returns.
7. The returning shopper sees read-only payment/production/tracking status.
   Only verified payment removes the submitted quantities from the cart.

Customer payments go to your payment account; **Printful separately bills your
saved Printful billing method**. This is automatic fulfillment, not a profit-only
payout arrangement. Processor fees and applicable taxes affect your actual margin.

## Safety and recovery

- Test Stripe payments never create or confirm physical Printful orders.
- Live physical fulfillment is disabled in the development workspace.
- Database locks, unique checkout IDs and deterministic Printful external IDs
  protect against duplicate notifications, concurrent workers and lost responses.
- Fulfillment failures persist as `needs_attention`; the shopper is told not to
  pay again and can contact you with their reference.
- Stripe retries failed business webhooks; a background reconciliation pass also
  checks outstanding orders while the process is running. It is not relied on to
  wake a sleeping deployment—payment webhooks perform that work.
- Unknown provider responses fail closed. A failed external-ID lookup is not
  treated as permission to create a new Printful order.
- Public order listing, creation and confirmation routes are disabled.
- Delivery addresses and provider response bodies are not written to shop logs.
- Owner support actions are handled through Stripe/Printful dashboards, not an
  unprotected custom admin route. Once an order is in production, refunds or
  cancellation require coordinated action in those dashboards.
- Browser ownership uses an opaque per-tab token, with a cookie fallback, so
  embedded previews do not depend on third-party cookies. Check order status in
  the same browser/tab that initiated checkout.

## Before accepting live purchases

1. Finish Stripe's Tax setup and verify an actual test-card checkout completes.
2. Complete Stripe live-payment/payout activation and live Tax settings.
3. In Printful, verify your fulfillment billing method or Wallet funding,
   print files, product sync, return policy and shipping destinations.
4. Publish the code and development schema using the normal Publish flow.
   Application startup does not create or migrate the app's order table.
5. Explicitly approve and run one small real purchase, including Printful's charge,
   before opening the store to customers. No real purchase or physical production
   has been performed as part of this implementation.

Managed Stripe synchronization and business webhooks register at runtime for the
current environment's domain. They are separate so synchronization acknowledgments
cannot hide fulfillment failures.

## Verification performed

- `npm run test:shop`: database-backed route/fulfillment tests with simulated
  provider responses, covering ownership, signatures, duplicate/concurrent
  delivery, lost create/confirm responses, unpaid/refunded orders, cost mismatch,
  and the test-payment physical-order safeguard.
- `npm run test:shop:browser`: Chromium at 390px and 1440px using mocked provider
  responses, covering address entry, shipping rates, payment errors, unpaid/paid
  return, cart preservation and repeated return visits.
- Real Printful product/variant retrieval, shipping quote and cost estimation
  succeeded without creating any order.
- The real registered development business webhook accepted a synthetic signed
  callback and rejected a forged signature. This is not a completed Stripe payment.
- Real Stripe card checkout remains unverified until the Tax setup blocker is
  resolved. No claim of physical iPhone/Android testing or live sales certification.
