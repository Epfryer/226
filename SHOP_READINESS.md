# Shop launch readiness

Checked 2026-11-16. **Not ready for live sales. This verification is incomplete.**
No publish, real card charge, physical order creation/confirmation, or marketing
subscription was performed in this verification.

## Verified evidence

- Development was missing all additions from migrations `0003_shop_email.sql`
  and `0004_shop_order_status.sql`. The authorized development SQL operation
  succeeded in one transaction, applying exactly those reviewed additions.
  Catalog inspection confirmed types, nullability, defaults, primary keys,
  unique unsubscribe/status-token constraints, and the receipt-to-order foreign
  key with cascading deletion. No migration-history edits or broad schema push
  were used. Existing account, project, and order counts were zero before and
  immediately after this transaction; no existing records were changed.
- The workspace workflow was restarted. Its running process has
  `SHOP_FROM_EMAIL=D.EF Studio <support@ethanfryer.com>`. The running readiness
  endpoint now reports ready in test mode, rather than a missing-schema/sender error.
- Both the development Stripe connection and the application's own Stripe
  client returned `balance.livemode=false`. No connection replacement was
  necessary. Development Tax initially returned `pending`, missing `head_office`;
  after the owner completed sandbox Tax setup, direct API reads returned `active`.
- Independent production Stripe API reads returned live mode, charges enabled,
  payouts enabled, details submitted, and active live Tax settings. These are
  account configuration checks, not evidence of a successful live payment or
  payout. Enabled live business and synchronization webhook endpoints exist on
  the deployment's replit.app domain; delivery has not been exercised here.
- Resend's separate management connection reports `ethanfryer.com` verified,
  with sending and receiving enabled. The application's Resend API request was
  authenticated but domain-list access returned `401 restricted_api_key`,
  explicitly limited to sending. An actual test receipt subsequently succeeded;
  management inspection confirmed provider status `delivered`, the intended
  support sender/reply address, test labeling and correct totals. Actual inbox
  appearance and reply deliverability still need owner confirmation.
- Printful store retrieval succeeded. Both products were inspected: all 122
  variants were synced, had positive USD retail prices, and had a non-preview
  print file with status `ok`. This does not certify artwork quality.
- A representative US destination, not a customer address, returned two shipping
  options ($8.79 standard and $8.88 with offsetting). A one-item cost estimate
  returned $30.72 fulfillment total for the selected $27.69 retail variant.
  Standard retail shipping plus item was $36.48 before customer tax. This is
  an estimate only, not an approved purchase or a guarantee for other variants,
  destinations, taxes, discounts, or processor fees. The Printful order-list
  total remained one before and after read/estimate checks; no order was created.
- `npm run check` passed.
- `npm run test:shop` passed all 17 tests with simulated payment/fulfillment
  providers and development fixtures/temporary tables.
- `node --import tsx --test scripts/shop-status.test.ts` passed both tests.
- `CHROMIUM_PATH=/repl/tools/bin/chromium npm run test:shop:browser` passed at
  390px and 1440px with mocked provider responses. Default downloaded Chromium
  could not launch because a host library was missing; the installed Chromium
  ran successfully. This is not real-device or other-browser certification.
- A development screenshot loaded the Studio entrance animation. Interactive
  browser tests, rather than that entrance frame, verified the checkout UI.
- Direct read-only production database inspection found the email/subscriber/
  receipt schema additions absent. The public production readiness endpoint
  returned `ready=false` and incomplete setup. No production schema was changed.
- Two genuine website-created sandbox checkouts completed with Stripe's
  documented test card, each for one item: $27.69 subtotal, $8.79 shipping,
  $0.00 calculated tax, $36.48 total. These were test payments, not real charges.
  The first run exposed a production-only receipt-link bug. The second exercised
  the correction and verified the paid return UI, durable `test_paid` state and
  a working private status page from the exact origin/token stored in its receipt.
  An unused earlier hosted session was left unpaid; no payment was retried.
- The second run logged successful processing by the signature-verified business
  webhook. Old test webhook endpoints still have pending deliveries, so account-wide
  pending-webhook counts do not establish delivery to the current endpoint.
- No physical Printful order was created: its list total stayed one. The
  subscriber count stayed zero, and paid test orders recorded no marketing consent.
- The corrected receipt initially deferred one attempt, then succeeded on its
  normal five-minute retry (`sent`, two attempts). No manual retry/reset or
  idempotency bypass was performed. Resend independently reported `delivered`;
  the provider's actual message contained the support sender/reply address,
  explicit test label, correct $36.48 total and development status link.
  The initial deferral's cause was not established. The owner confirmed the first
  test receipt arrived in their inbox. Inbox appearance of the corrected receipt
  and actual reply deliverability have not been separately confirmed.

## Blockers and owner actions

1. **Development Tax resolved:** Sandbox Tax is active. Do not disable automatic
   Tax or substitute live payments for further test verification.
2. **Controlled inbox:** The owner confirmed the first test receipt arrived.
   The corrected receipt's normal retry and provider delivery succeeded;
   corrected-message inbox appearance and a reply round trip remain unconfirmed.
   Do not put inbox/customer details or private status URLs in this record.
3. **Printful billing:** The owner explicitly confirmed billing is funded and
   ready. This is owner-attested, not an independent API inspection of a billing
   method or proof that a fulfillment charge will succeed. Review supported selling
   destinations, print appearance and return policy; one US estimate does not
   certify all destinations.
4. **Published sender/connection:** Shared sender configuration and a working
   workspace process do not establish the deployed process's effective sender
   or ability to send. Check those directly after an approved publish.

## Remaining verification and approval gates

- Confirm the corrected message appeared in the inbox and any desired reply
  round trip. First-message inbox arrival is owner-confirmed. Corrected receipt provider delivery,
  genuine test checkout, signed webhook processing, paid state,
  totals, private status UI and no-fulfillment/no-subscription safeguards have
  been exercised; do not replace the remaining evidence with simulated tests.
- Before any publish, present the current code/config diff and the exact
  development-to-production schema diff for fresh owner approval. Intended
  application additions are only migrations 0003/0004; any unrelated drift
  needs separate review. The narrow application-code correction snapshots the
  development origin for test receipt status links, validates the allowed HTTPS
  origin, and preserves canonical production links for live receipts. A regression
  test covers environment selection and unsafe origins. A privacy-safe business
  webhook success log records the event type without customer data.
- Production was rechecked after the owner's receipt/billing confirmations;
  the additions below are still absent. The platform's full publish-diff helper
  is unavailable in this task workspace. Therefore the following is the exact
  **intended additive application change**, not a claim that the full platform
  diff contains nothing else:
  - Add `shop_orders.marketing_consent_recorded boolean NOT NULL DEFAULT false`.
  - Create `shop_subscribers` exactly as in `migrations/0003_shop_email.sql`,
    including its email primary key, unique non-null unsubscribe token,
    consent text and timezone-aware consent/unsubscribe timestamps.
  - Create `shop_receipts` exactly as in that migration, including its order
    primary/foreign key with cascade, JSON payload, status/attempt defaults,
    timezone-aware queue/created/sent timestamps.
  - Add nullable unique `shop_receipts.status_token_hash text`, as in
    `migrations/0004_shop_order_status.sql`.
  - No account/content deletion, reset, data overwrite, migration-history edit,
    unrelated schema push, or production DDL was performed or approved.
- This task workspace cannot publish. After the reviewed task is merged, the
  owner must explicitly approve and initiate the normal Publish code/schema
  flow, without overwriting production data. Verify the running published
  schema, sender, provider environments, business webhook delivery and public
  browsing directly afterward. Do not infer production success from development.
- Only after that, obtain fresh approval of the exact real item/variant,
  quantity, full customer total, shipping destination and expected separate
  Printful charge. Customer funds settle through Stripe; Printful separately
  bills fulfillment. Payment details must be entered securely by the owner.
  Verify the payment, single fulfillment order/confirmation, receipt and status
  link; later production/tracking/delivery may remain pending.
