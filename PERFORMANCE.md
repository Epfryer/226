# Performance verification

## Scope

This pass addresses the homepage PageSpeed findings: oversized Cloudinary
images, uncompressed text responses, delayed heading visibility, and the
Studio-note label's contrast. It also reduces animation startup code.
Original project image files, full-resolution interactive project views,
PDF readers, and payment behavior are retained.

## Measurements

These are Lighthouse 12.8.2 lab runs against an isolated local production
build, not PageSpeed measurements of the published domain or field data.
Local CPU contention, browser versions, throttling, hosting latency, and
cache conditions affect scores. One before/after run per device is reported;
these are not medians or guarantees.

| Metric | Before | Final |
| --- | ---: | ---: |
| Mobile performance | 64 | 80 |
| Mobile LCP | 4.3 s | 2.4 s |
| Mobile first contentful paint | 4.0 s | 2.4 s |
| Mobile transferred data | 9,955 KiB | 482 KiB |
| Mobile total blocking time | 430 ms | 560 ms |
| Desktop performance | 97 | 97 |
| Desktop LCP | 0.9 s | 0.6 s |
| Desktop transferred data | 9,955 KiB | 312 KiB |
| Desktop total blocking time | 60 ms | 130 ms |
| Layout shift, both devices | 0 | 0 |
| Accessibility, both devices | 95–96 | 100 |
| Best Practices / SEO, both devices | 100 / 100 | 100 / 100 |

Loading improved materially, but blocking time did not improve in the final
run. A consistent 90+ mobile performance score has **not** been achieved.
The remaining priority is profiling and breaking up client startup work,
including the semantic-document-to-interactive-page transition. Do not hide
content, delay all interaction until after the audit, or remove the readable
initial HTML to improve a score.

## Reproduce

Build first, then run `npm run audit:performance -- <label>`.
The script uses Lighthouse from `node_modules/lighthouse/cli/index.js`;
alternatively set `LIGHTHOUSE_CLI` to an available Lighthouse CLI and
`CHROME_PATH` to the Chromium executable. Lighthouse is not a production
dependency. Results are saved under ignored `generated-artifacts/performance/`.
The isolated audit server does not register checkout routes or fulfillment.

Additional checks passed:

- `npm run check` and `npm run build`
- `npm run test:performance`, `npm run test:discovery`, `npm run test:experience`
- Portfolio accessibility browser checks at desktop and phone widths
- Chromium flipbook checks at 390px and 1440px, using a synthetic PDF:
  full-window rendering, zoom/pan, page turning, pinch emulation, focus,
  resize, reading-position recovery, and failed-PDF retry

These checks do not certify physical iOS/Android devices or all WCAG criteria.

## Publish verification

The public PageSpeed report will not reflect workspace edits until the site
is republished. After publishing, rerun PageSpeed on the same URL and confirm
gzip delivery of HTML/JS/CSS, immutable caching of fingerprinted assets,
responsive image delivery, and working navigation, readers, and checkout.
Do not place a live payment or physical Printful order as an automatic test.
