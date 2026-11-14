# Performance Strategy

## Hot paths
- Public portfolio documents are React server-rendered from static project content, followed by client hydration/interactive replacement. Production HTML template is read once at startup; development template reads are asynchronous.
- `/projects` loads the publication catalog; `/publications` uses server-seeded catalog data on direct document loads. Publication PDF delivery supports full and range requests through App Storage.
- Studio document loads seed a cached product list; in-site navigation and product selections use `/api/shop/products` and `/api/shop/products/:id`.
- Cart validation, shipping quotes and checkout call Printful; checkout additionally resolves Stripe products/prices and creates a payment session. Cart size is bounded to 30 variants.
- Authentication is scoped to auth/owner routes, uses async scrypt with concurrency limits and PostgreSQL-backed sessions. Public browsing does not load sessions globally.
- Traffic volume and request latency budgets are unknown.

## Large / growing tables
- `shop_orders` retains quote snapshots and fulfillment history; no application quote cleanup was found. Actual cardinality is unknown.
- Order reconciliation selects up to 10 due orders on a 30-second timer and shares the five-connection shop pool with checkout/webhooks.
- Auth sessions have primary-key lookup and an expiry index. Username normalization has a matching expression index in schema/setup. Rate-limit records are periodically pruned; actual volume is unknown.
- Projects are static TypeScript content rather than a live project-table query path.

## Measured and documented context
- Available deployment logs show server listening at 2026-11-12T22:32:05.824Z and checkout ready at 22:33:05.294Z, with a broad Stripe backfill between them. This is cold-start readiness evidence, not endpoint timing.
- No request-duration samples appeared in the available workflow/deployment logs. No live database queries or query plans were available.
- `replit.md` documents 84/91 MB publications; current object sizes were not measured. Range delivery uses a per-process four-file disk cache with a five-minute idle TTL and waits for full spooling on misses.
- `PERFORMANCE.md` contains historical local Lighthouse results, not current production measurements. Preserve readable server HTML, full-resolution interactive media and payment/fulfillment safety when optimizing.

## Dismissed categories
- None recorded.

## Scan constraints
- Read-only source and log review; no application scripts/tests executed, no database execution, service restart or deployment.
- Task 31 findings: four Latency issues and one Data layer issue. No seeded performance issues were present.
