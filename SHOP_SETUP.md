# Shop checkout and Printful fulfillment

## Stripe Tax setup

Checkout deliberately stays unavailable if Stripe Tax is not active rather
than silently disabling taxes. Configure **Tax → Settings** separately for
each Stripe environment with your actual business origin, review the tax category
and registrations appropriate to your business, and consult a tax professional
if needed. The sandbox previously lacked an active business origin.

Availability is rechecked about once a minute while the application runs.
The checkout dialog displays the current setup status.

## What happens after setup

1. Shoppers select your Printful product variants on `/studio`.
2. Your website locally standardizes address spacing and US state names, then asks
   the shopper to confirm the displayed address before requesting Printful shipping
   rates. This no-cost step is not authoritative postal-address verification; the
   shopper must confirm the address is deliverable.
3. A 15-minute quote stores authoritative product prices and shipping choices.
4. Before payment, availability and prices are revalidated and Printful's estimated
   fulfillment cost is checked against the pre-tax customer payment.
5. Stripe-hosted checkout dynamically offers payment methods enabled for the
   connected Stripe account and eligible for the transaction. This can include
   cards, Link, Cash App Pay, and wallets such as Apple Pay or Google Pay when
   Stripe, the shopper's device/location, and domain/account settings support them.
   Manage methods in Stripe's Dashboard; availability is not guaranteed for every
   shopper. Zelle is not part of this automated checkout.
   The delivery address is fixed to the quote, not changed after shipping pricing.
   It is saved on the Stripe customer for automatic tax calculation; fulfillment
   uses the address saved with the quote.
6. A **separate signed payment webhook** verifies the payment server-side and
   submits and confirms the Printful order, whether or not the shopper returns.
7. The returning shopper sees read-only payment/production/tracking status.
   Only verified payment removes the submitted quantities from the cart.

## Order receipts and email updates

- After verified payment, an application-owned receipt is queued independently of
  Printful production and sent through the connected Resend integration using
  `INQUIRY_FROM_EMAIL`, the same sender as inquiry responses. Replies go to the
  inquiry reply address. The receipt includes items, tax, shipping, total paid
  and the order reference; it does not claim that the order has shipped.
- Test-mode payments send a clearly labeled test receipt to the entered email but
  never add subscribers or create a Printful order. Use an inbox you control.
- Delivery is attempted on the payment webhook and retried while the application
  is running. Provider idempotency keys reduce duplicate sends; a receipt still
  unresolved after 23 hours is marked `needs_attention` rather than retried past
  the provider's idempotency window. A receipt with incomplete payment totals is
  also marked `needs_attention` rather than presenting guessed amounts. Review the Resend dashboard and server logs
  before deciding whether to resend manually. A sleeping deployment cannot run
  background retries by itself.
- Checkout offers a separate, unchecked opt-in for updates, releases and offers,
  promising fewer than two emails per week. Consent is recorded when the shopper
  continues to Stripe, even if they do not complete payment. A declined checkbox
  does not unsubscribe an existing subscriber. Repeat consent after unsubscribing
  creates a new unsubscribe link.
- Sign in as the site owner and use **Download email subscribers (CSV)** on the
  account page. The export contains active subscribers, consent wording and
  timestamp, and a unique unsubscribe URL. Keep it private. This feature collects
  addresses; it does not send marketing campaigns. For each campaign, export a
  fresh list and include each recipient's own unsubscribe URL; honor direct
  unsubscribe requests too. The URL opens a confirmation page, then removes the
  subscriber from future exports. For a direct request, open that subscriber's
  URL from the current export and confirm it. Fields that start with spreadsheet formula
  characters are prefixed with an apostrophe for safety; remove that prefix from
  an email address when importing into a trusted email platform.
- Stripe or Printful may also send their own emails. Review their dashboard
  settings to avoid unexpected duplicate receipts; their emails are not controlled
  by the custom template.

To find receipts that need attention without displaying addresses, inspect
`SELECT order_id, status, attempts, created_at FROM shop_receipts WHERE status <> 'sent';`
in the appropriate database. Do not reset a receipt for retry until its delivery
status has been checked in Resend.

Before a real purchase, apply the schema changes through the reviewed development
and Publish schema flows (`migrations/0003_shop_email.sql` documents the additive
change; do not run a whole-schema baseline), configure the verified sender and
Resend connection, and publish the code. Checkout stays unavailable if the new
schema or sender setting is missing, but that check does not prove that Resend can
deliver. Complete a Stripe test payment and check the actual inbox and reply address.
Review the draft privacy policy and marketing requirements before sending campaigns.
No live delivery or purchase has been verified by this code change.

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
- Same-origin requests, per-process rate limits and Stripe's payment protections
  reduce abuse; the rate limits are not shared across instances. No CAPTCHA
  is required for browser-based shopping agents. This is not a dedicated
  shopping-agent protocol or a public server-to-server checkout API.
- Delivery addresses and provider response bodies are not written to shop logs.
- Stripe checkout errors log the checkout stage, a known top-level parameter name,
  and Stripe request ID when available. Use that ID in Stripe's API logs to
  investigate; do not share customer details or full provider responses.
- Owner support actions are handled through Stripe/Printful dashboards, not an
  unprotected custom admin route. Once an order is in production, refunds or
  cancellation require coordinated action in those dashboards.
- Browser ownership uses an opaque per-tab token, with a cookie fallback, so
  embedded previews do not depend on third-party cookies. Check order status in
  the same browser/tab that initiated checkout.

## Before accepting live purchases

1. Finish Stripe's Tax setup and verify test checkout with each desired method.
   Enable desired payment methods in Stripe's Dashboard and test their availability;
   they may vary by device, region and account.
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

## Product colors and images

Swatches use the Printful catalog's color codes for each selected variant.
If those codes are unavailable, the shop shows that variant's preview instead.
Product images come from the selected variant's preview/mockup; print-file
artwork is not presented as a product photo. If a mockup itself is incorrect,
correct and resync it in Printful.
