# D.EF UI Theme Design Spec

**Date:** 2026-11-23  
**Project:** D.EF Portfolio Site (`226` repo, branch `ui-revolutionize`)  
**Goal:** Immaculate on-brand architectural theming — bold, dark, motion-rich, client/collaborator/social ready.  
**Reference:** BIG.dk aesthetic (dark charcoal shadow base, warm ink typography, Dusty Rose / Pale Teal / Mustard / Timber accents).  
**Scope:** 3 hours. No rewrite of existing functionality — layer modern motion + theming on top.

---

## Design System

### Colors (HSL)
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `0 0% 6%` | Page background (near-black charcoal) |
| `--foreground` | `0 0% 96%` | Primary text (warm off-white) |
| `--card` | `0 0% 10%` | Card surfaces (slightly lighter than bg) |
| `--card-foreground` | `0 0% 96%` | Card text |
| `--popover` | `0 0% 10%` | Popover/dialog backgrounds |
| `--primary` | `350 25% 55%` | Dusty Rose — CTAs, active states, brand |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--secondary` | `0 0% 15%` | Secondary surfaces |
| `--secondary-foreground` | `0 0% 85%` | Secondary text |
| `--muted` | `0 0% 15%` | Muted surfaces |
| `--muted-foreground` | `0 0% 55%` | Muted text |
| `--accent` | `170 40% 55%` | Pale Teal — highlights, hover states |
| `--accent-foreground` | `0 0% 100%` | Text on accent |
| `--destructive` | `0 62% 50%` | Destructive actions |
| `--border` | `0 0% 20%` | Borders |
| `--input` | `0 0% 20%` | Input borders |
| `--ring` | `350 25% 55%` | Focus rings (Dusty Rose) |
| `--chart-1` | `350 25% 55%` | Dusty Rose |
| `--chart-2` | `170 40% 55%` | Pale Teal |
| `--chart-3` | `45 80% 50%` | Mustard |
| `--chart-4` | `30 50% 40%` | Timber |
| `--chart-5` | `0 0% 70%` | Warm gray |

### Typography
- **Heading:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` (clean architectural sans)
- **Body:** Same stack, slightly looser tracking
- **Mono:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace` (for labels, metadata, coordinates)

### Layout & Radius
- **Radius:** `0` (sharp, architectural edges — matches current theme.json intent)
- **Border:** 1px, subtle charcoal-gray
- **Grid gap:** 2rem
- **Header height:** 4rem

---

## Motion System (framer-motion)

### Page transitions
- Fade + slight y-slide on route change (duration 0.4s, easeOut)
- AnimatePresence `mode="wait"` on project grid switches

### Reveal animations (scroll-triggered)
- Elements fade in from `y: 20` as they enter viewport
- Stagger children with 0.1s delay
- Use `whileInView` + `viewport` once

### Hover effects
- Project cards: `scale: 1.02` + border-color shift to Dusty Rose
- Buttons: background shift Dusty Rose → darker Dusty Rose
- Links: underline + slight translateY(-2px)

### Scroll effects
- **Parallax hero images:** `y` moves at 0.3x scroll speed
- **Sticky project headers:** title stays pinned while carousel scrolls
- **3D file scroll section:** horizontal scroll on vertical scroll (scroll-jacking lite) for architectural models/apps

---

## Component Changes

### Header
- Dark background, translucent with backdrop-blur
- D.EF logomark: bold letterspacing, Dusty Rose accent dot on the "E"
- Nav links: uppercase, tracking-wide, hover underline Dusty Rose
- Mobile menu: full-screen dark overlay with fade-in

### Footer
- Dark background, warm ink text
- Social links: icon hover state with Dusty Rose glow
- Copyright: muted gray, small

### Project Grid / Cards
- Card: dark surface, 1px border, hover border Dusty Rose
- Image: object-cover, scale-up on hover (1.05x), overflow-hidden
- Title: warm off-white, hover color Dusty Rose
- Metadata: muted gray, mono font
- Expand: full-screen overlay with Dusty Rose accent, framer-motion layout="position" shared-axis

### Project Detail
- Left column: image with parallax scroll
- Right column: sticky metadata + description
- Image carousel: swipe-friendly, Dusty Rose navigation dots

### 3D / App Showcase Section (new)
- Horizontal scroll container triggered by vertical scroll
- Each item: model thumbnail + title + "View in 3D" button
- Placeholder structure for Three.js model viewer (no Three.js install in 3-hour scope — structural only)

---

## Anti-Goals (out of 3-hour scope)
- No Three.js installation or real 3D rendering
- No backend changes
- No new pages (except structural section on existing pages)
- No full redesign of About/Contact content — theming only
- No dark/light mode toggle (dark only, on-brand)

---

## Success Criteria
- Site loads on dark theme with Dusty Rose / Pale Teal / Mustard / Timber accents
- Every page has scroll-triggered reveal animations
- Project cards have hover motion + image scale
- Header/Footer fully themed
- Horizontal 3D/app showcase section structurally in place
- `npm run check` passes (TypeScript clean)
- `npm run build` succeeds