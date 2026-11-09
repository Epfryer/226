# SEO Strategy

## In scope
- Public D.EF / Designs by Ethan Fryer architectural portfolio: `/`, `/about`, `/projects`, `/publications`.
- Public Studio storefront `/studio`, including product discovery and checkout accessibility.

## Out of scope
- Internal diagnostics (`/diagnostics`), API implementation except where it affects public crawling or content delivery, unused component copies.

## Target audience
- Prospective architecture employers, collaborators, clients, readers of Ethan Fryer's publications, and Studio print/art customers.

## Primary topics
- Ethan Fryer, D.EF, architectural design portfolio, architecture projects, selected works and architectural publications, Studio prints.

## Content and crawler assumptions
- Public portfolio and shop pages should be discoverable and shareable.
- Google may render JavaScript; social preview and AI retrieval crawlers generally require initial HTML.
- Use the deployment origin as canonical; no production domain is assumed from development hostnames.
- Current implementation is a React/Vite client-rendered SPA served by Express.

## Dismissed categories
- None recorded.
