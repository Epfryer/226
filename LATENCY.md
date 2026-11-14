# Request latency changes

## Catalog and checkout

- Server documents and `/api/shop/products` share one successful raw catalog
  envelope cached for 60 seconds per process, including in-flight coalescing.
  Document rendering still projects only its public fields. Product details
  have a separate 60-second cache bounded to 100 product IDs. Pending entries
  cannot be evicted to create duplicate refreshes; saturation fails explicitly.
- Successful public catalog responses use `public, max-age=30`; errors, status,
  checkout, quotes, and personal responses remain `no-store`. There is no
  distributed cache: separate server instances refresh independently.
- Local cart errors and duplicate IDs fail before provider I/O. Variant
  validation and Stripe price resolution use four workers per request, preserve
  item order, stop scheduling on error, and drain already-started calls.
  Each variant's Stripe product/price operations remain ordered and idempotent.
- Printful price/availability validation still runs live for both quotes and
  checkout; no browsing cache is used to accept payment. Order locks, ownership,
  expiry, cost checks, automatic tax, replay safety, and fulfillment checks remain.
  Checkout still holds its advisory-lock connection while doing provider work;
  parallel lookup reduces that time without weakening its locking guarantees.

## PDF delivery

The range path now uses the supported GCS client for App Storage with the same
Replit sidecar authentication as the storage SDK. Metadata supplies the object
size and generation; both cold and warm reads request only the specified byte
range from that generation. Metadata is coalesced and bounded to 100 names with
a 60-second TTL. No per-chunk existence check or whole-file cache fill is needed.

The bounded disk cache remains available as an optional utility but is not on
the HTTP request path. Cache saturation no longer falls back to a full 200 PDF.
Full requests stream normally. HEAD, suffix/open ranges, 206/416, stale If-Range,
stream cancellation, mobile-variant selection, and metadata failures are tested.
Compressed storage objects are rejected rather than serving inconsistent byte
offsets. Content replacement may briefly fail if the pinned generation has
already been removed; refreshed metadata discovers the new version.

### Development measurement, 2026-11-14

Against the restarted development app through its HTTPS proxy, using the real
`EthanFryer_ChicagoStudio_FinalBook.pdf` object:

| Request | Object bytes | Delivered bytes | Status | First byte | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cold metadata, bytes 0–65535 | 253,551,400 | 65,536 | 206 | 0.567 s | 0.605 s |
| Warm metadata, bytes 0–65535 | 253,551,400 | 65,536 | 206 | 0.122 s | 0.164 s |

Both responses included the correct Content-Range, Content-Length, and generation
ETag. An out-of-bounds request returned 416. The adapter passes explicit start/end
offsets to upstream storage; it does not read/discard the remaining book.
These are single development samples, not production latency guarantees.

## Checkout readiness and historical synchronization

Essential initialization still checks the application schema, runs Stripe's
own migrations, verifies environment/payment account constraints, registers
managed webhooks, and checks active Stripe Tax. It no longer awaits history.
Readiness logs include prerequisite duration and process age, separate from
the listener-start log.

Reconciliation starts independently, not after initialization. Historical
Stripe synchronization runs after essential readiness in a separate background
worker and retries every five minutes on failure. A dedicated database
connection takes a cross-instance advisory lock keyed by Stripe account and
mode. Successful object-type checkpoints persist in `shop_sync_progress`;
StripeSync also maintains its own internal incremental cursors. Interrupted
types retry idempotently, completed types do not repeat after restarts, and
webhooks keep the mirror updated. The initial history remains broad for
compatibility; it is no longer relevant to the checkout critical path.

The table is application job state, not a second Stripe product source.
`migrations/0002_shop_sync_progress.sql` matches `db/schema.ts`.
The post-merge setup applies only this reviewed additive **development** schema
through `scripts/setup-shop-sync-progress.ts`; it verifies existing definitions
and refuses production. No startup or deployment-build DDL was added.
Managed production receives schema changes through the normal platform schema
diff, not this script.

## Verification

- `npm run check`, `npm run build`
- `npm run test:latency`: cache coalescing/expiry/failure recovery and bounds,
  one/30-item mocked provider waterfalls, four-worker limit, order and
  idempotency, real quote/checkout handlers with 12 items and mocked providers,
  changed-price rejection, cancellation, cold/warm 91 MiB synthetic PDF ranges,
  readiness prerequisites, historical-job restart and worker coordination.
- Existing experience, shop/payment/reconciliation, and HTTP performance suites.
- Real large-object range measurements above; no physical order or real
  checkout session was created.

The connected Stripe account reports live mode in this development workspace,
so the existing safety gate correctly keeps real development checkout closed.
Readiness and checkout behavior were exercised using injected test providers;
no new production readiness duration is claimed.

The public Studio route loaded in the preview capture without browser errors,
but the capture caught the startup animation rather than the final catalog.
`npm run test:shop:browser` could not launch this workspace's downloaded Chromium:
host libraries were missing, and a targeted library-path attempt encountered a
glibc version mismatch. Automated interactive browser coverage was not completed;
the HTTP handlers and checkout safeguards were tested directly as described above.
