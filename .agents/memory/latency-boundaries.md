---
name: Latency safety boundaries
description: Preserve payment safety and true upstream partial reads when optimizing provider latency.
---

Cache public browsing data, not the live price/availability checks that authorize
a quote or payment. Preserve ownership and per-order locking when parallelizing
independent provider work.

**Why:** Browsing may tolerate short-lived stale data; accepting payment or
creating duplicate physical orders may not. This performance work was explicitly
scoped to preserve all payment and fulfillment safeguards.

**How to apply:** Use bounded concurrency for independent item lookups, retaining
per-variant operation ordering and idempotency. Keep catalog caches out of
purchase validation.

A PDF's first requested range must not wait for a complete object download.
Use authoritative size/version metadata and a range-capable upstream adapter.

**Why:** Publications can be hundreds of megabytes; spooling to disk before
responding defeats partial-download latency even if memory use is bounded.

**How to apply:** Verify cold as well as warm requests against a large object.
Pin reads to the metadata version, propagate cancellation, and never silently
substitute a full PDF because a local cache is busy.
