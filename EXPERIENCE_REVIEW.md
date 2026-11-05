# Desktop and mobile experience review

## Preserved
Routes, portfolio content and identity, publication deep links, two-page flipbook,
zoom/pan, PDF downloads, contact destinations, studio categories, and payment
provider/fulfillment remain in place. No optional new experiences were added.

## Improvements
- Desktop navigation has reserved space; mobile menus have explicit labels,
  current-route state, Escape dismissal and focus handling.
- Invalid nested homepage links are removed. Non-home routes and the PDF viewer
  load on demand. Images below the fold use lazy loading.
- Flipbook reading position survives close/reopen. Next-page toolbar navigation,
  current PDF.js text-layer rendering, canceled-render cleanup, canvas disposal,
  iPad desktop-mode detection and reduced-motion page turns are supported.
- Zoom and native page-turn events are separated when zoomed/pinching.
  Native fullscreen has an in-page fallback instead of relying on a missing viewer HTML.
- PDF auxiliary assets are served locally and regenerated from the installed
  PDF.js package before every production build.
- Cart contents persist locally. Current availability and authoritative prices
  are checked before checkout and again on the server. Price changes require
  review; verified purchase clears the saved cart. Cart/product dialogs have
  keyboard focus handling.
- Range requests coalesce downloads into a bounded disk cache, rather than
  retaining full PDF buffers in RAM. Suffix/open-ended ranges and invalid ranges
  are handled explicitly. Disconnected response streams are destroyed.

## Dependency decisions
- React PDF 10.2.0 → 10.5.0, retaining its exact PDF.js dependency, 5.4.296.
- React Query 5.64.2 → 5.106.1.
- React 19, Vite 8, Tailwind 4, Motion 14, Swiper 14 and Express 5 were not
  adopted: these are major compatibility migrations without a demonstrated
  benefit sufficient to justify risk to this maintenance request.
- Existing security overrides and CommonJS-compatible UUID selection remain.

## Measurements and verification
- Previous recorded production main JS: 594.12 KB, gzip 184.13 KB.
- Current production main JS: 384.44 KB, gzip 122.72 KB (about 35% / 33% less).
  This measures the main bundle, not all route chunks or end-to-end page speed.
  The PDF chunk remains around 521 KB and is deferred until requested.
- A real 78,405,936-byte, 48-page publication loaded and rendered in Chromium
  without page errors. Live range checks returned 206 for the first 1,024 bytes
  (2.44 seconds cold) and suffix 128 bytes (0.126 seconds warm); a reversed
  range returned 416. These are individual development measurements, not
  a before/after latency benchmark or production guarantee.
- TypeScript and production build pass. Dependency-version regression tests pass.
- Four focused tests cover range parsing, concurrent download coalescing,
  oversize rejection, and authoritative cart price/availability validation.
- Automated Chromium tests pass at 390px touch-enabled and 1440px widths:
  six public routes, horizontal overflow, valid links, canceled-return cart
  recovery, price-change review, mocked verified-purchase clearing, PDF deep
  links, next-page advancement, zoom/reset, viewport changes, reading-position
  restoration, later-page boundaries and Escape dismissal. PDF interaction
  tests use a deterministic 30-page fixture; payment responses are mocked.

## Explicit limitations
- Firefox and WebKit binaries were downloaded but cannot launch here because
  required Linux shared libraries are missing. Real Safari/iOS/Android devices,
  genuine multi-touch pinch arbitration and prolonged low-memory use are not
  certified by Chromium viewport emulation.
- No live purchase or fulfillment was triggered. Live Stripe/provider availability
  and complete transaction outcomes were not verified.
- Full slow-network/error-injection, exhaustive keyboard and browser-zoom audits,
  sustained concurrent-load tests, and browser/server memory profiling remain.
- The storage SDK exposes neither byte-range downloads nor file-size metadata.
  A cold range still downloads the whole file to disk first. Cache limits are
  four files, 256 MiB per file, two simultaneous downloads and a five-minute
  reuse window. Oversize files or a busy cache fall back to a standard full-file
  HTTP 200 stream, preserving access rather than increasing cache limits.
  Full-file streaming is unchanged and does not use this cache.

## Running checks
- `npm run check`
- `npm run build`
- `npm run test:dependency-security`
- `npm run test:experience`
- `npm run test:experience:browser` requires Playwright and browser binaries.
  Optional environment settings: `PLAYWRIGHT_MODULE` (module path),
  `CHROMIUM_PATH` (system Chromium), `TEST_BASE_URL` (development URL),
  and `TEST_BROWSER=chromium` (otherwise all three engines are attempted).
  Missing engines fail visibly; they are not counted as passing.

## Optional ideas — not implemented
Publication thumbnail navigation/search, page-specific share links, curated
presentation mode, and selective interactive architectural models remain separate
feature proposals. Page-specific sharing and thumbnails are the most practical
next additions.
