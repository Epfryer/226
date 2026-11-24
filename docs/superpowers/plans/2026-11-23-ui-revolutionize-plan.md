# D.EF UI Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply an immaculate on-brand architectural dark theme to the D.EF portfolio site with modern motion effects, within a 3-hour scope.

**Architecture:** Layer dark theme + framer-motion enhancements on top of existing React/Vite/Radix/Tailwind codebase. No rewrite of functionality. Each page gets scroll-triggered reveals, cards get hover motion, header/footer get themed. A new horizontal-scroll 3D/app showcase section is structurally added.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3.4, Radix UI, framer-motion 11, wouter (routing)

**Spec:** `docs/superpowers/specs/2026-11-23-ui-theme-design.md`

## Global Constraints

- Dark mode only (no light toggle). Dark theme is the brand.
- Dusty Rose (`hsl(350 25% 55%)`) is the primary brand color.
- Pale Teal (`hsl(170 40% 55%)`) is the secondary accent.
- Mustard (`hsl(45 80% 50%)`) and Timber (`hsl(30 50% 40%)`) are tertiary accents for chart data only.
- Radius: 0 (sharp architectural edges).
- No new dependencies (no Three.js install in 3-hour scope).
- No backend changes.
- `npm run check` (tsc) must pass before each commit.
- `npm run build` must succeed at the end.

## Review Focus

1. **Mobile nav overlay** — must be fully usable on small screens, not just visually themed.
2. **Project card expand/collapse** — motion must not break the existing carousel scroll-to logic.
3. **Horizontal 3D showcase section** — must not hijack vertical scroll on mobile; disable horizontal-on-vertical scroll under 768px.
4. **Dark theme contrast** — all text must meet WCAG AA on dark backgrounds (warm off-white on charcoal).
5. **Build/type-check** — every task must pass `npm run check` before commit.

---

## Task 1: Update Theme System & CSS Variables

**Files:**
- Modify: `client/src/components/ui/theme.ts`
- Modify: `theme.json`
- Modify: `tailwind.config.ts`
- Create: `client/src/styles/global.css` (if not exists, create for CSS variable overrides)

**Interfaces:**
- Consumes: nothing
- Produces: `--background`, `--foreground`, `--primary`, `--accent`, `--border`, `--card`, `--card-foreground`, `--muted`, `--muted-foreground` CSS variables set to dark theme values

- [ ] **Step 1: Update `theme.json` to dark mode**
  Change `"appearance": "light"` → `"appearance": "dark"`, set primary to Dusty Rose HSL, set radius to 0.
  Expected file:
  ```json
  {
    "variant": "professional",
    "primary": "hsl(350 25% 55%)",
    "appearance": "dark",
    "radius": 0
  }
  ```

- [ ] **Step 2: Update `theme.ts` CSS variable values**
  Replace all light HSL values with dark theme values from spec:
  - `--background: 0 0% 6%`
  - `--foreground: 0 0% 96%`
  - `--card: 0 0% 10%`
  - `--primary: 350 25% 55%`
  - `--secondary: 0 0% 15%`
  - `--muted: 0 0% 15%`
  - `--muted-foreground: 0 0% 55%`
  - `--accent: 170 40% 55%`
  - `--border: 0 0% 20%`
  - `--input: 0 0% 20%`
  - `--ring: 350 25% 55%`
  - Update chart-1..5 to Dusty Rose / Pale Teal / Mustard / Timber / Warm gray

- [ ] **Step 3: Verify tailwind config picks up dark mode**
  Tailwind config already uses `darkMode: ["class"]` and CSS variable references. No change needed to tailwind.config.ts — verify by running `npm run check`.

- [ ] **Step 4: Commit**
  ```bash
  git add theme.json client/src/components/ui/theme.ts
  git commit -m "feat: dark theme system with Dusty Rose / Pale Teal / Mustard / Timber accents"
  ```

---

## Task 2: Add Global Motion Utilities

**Files:**
- Create: `client/src/lib/motion.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `fadeInUp`, `fadeIn`, `staggerContainer`, `slideInRight`, `slideInLeft` framer-motion variants exported for reuse

- [ ] **Step 1: Create `motion.ts` with reusable variants**
  ```ts
  import type { Variants, Transition } from "framer-motion";

  export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add client/src/lib/motion.ts
  git commit -m "feat: shared framer-motion variants for scroll-reveal system"
  ```

---

## Task 3: Theme the Header

**Files:**
- Modify: `client/src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `motion.ts` variants (optional), existing `useProject` context
- Produces: Header with dark translucent background, backdrop-blur, Dusty Rose logomark accent, uppercase nav with hover underline

- [ ] **Step 1: Update header background to dark translucent**
  Change the `<header>` className from `"fixed top-0 left-0 z-50 p-6"` to:
  ```tsx
  className="fixed top-0 left-0 z-50 p-6 w-full bg-background/80 backdrop-blur-md border-b border-border"
  ```

- [ ] **Step 2: Update D.EF logomark with Dusty Rose accent**
  Replace the D.EF text block with:
  ```tsx
  <span className="font-bold tracking-wider text-foreground">
    D.EF<span className="text-primary">.</span>
  </span>
  ```

- [ ] **Step 3: Update nav link styling for dark theme**
  Replace `hover:opacity-70` with `hover:text-primary transition-colors` and add uppercase + tracking-wide (already present).

- [ ] **Step 4: Update mobile menu overlay for dark theme**
  Change the mobile menu div background from `bg-white` to `bg-background border border-border`, add `shadow-2xl`.

- [ ] **Step 5: Run `npm run check` to verify TypeScript**
  Expected: no errors.

- [ ] **Step 6: Commit**
  ```bash
  git add client/src/components/layout/Header.tsx
  git commit -m "feat: dark theme header with Dusty Rose logomark and translucent backdrop"
  ```

---

## Task 4: Theme the Footer

**Files:**
- Modify: `client/src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: Footer with dark background, warm ink text, Dusty Rose hover glow on social links

- [ ] **Step 1: Update footer background to dark**
  Change `className="bg-white py-6 text-center"` to:
  ```tsx
  className="bg-background border-t border-border py-6 text-center"
  ```

- [ ] **Step 2: Update social link hover to Dusty Rose glow**
  In `SocialLinks`, change the hover state to add `text-primary` on hover and `transition-colors duration-300`.

- [ ] **Step 3: Update copyright text to muted gray**
  Change `text-gray-500` to `text-muted-foreground`.

- [ ] **Step 4: Run `npm run check`**
  Expected: no errors.

- [ ] **Step 5: Commit**
  ```bash
  git add client/src/components/layout/Footer.tsx
  git commit -m "feat: dark theme footer with Dusty Rose social link hovers"
  ```

---

## Task 5: Overhaul ProjectCard with Motion & Dark Theme

**Files:**
- Modify: `client/src/components/projects/ProjectCard.tsx`

**Interfaces:**
- Consumes: existing `Project` type, `useProject` context, `ProjectCarousel`
- Produces: Card with dark surface, Dusty Rose hover border, image scale-on-hover, framer-motion expand transition

- [ ] **Step 1: Update card container to dark theme**
  Change `className` of the motion.div wrapper to include `bg-card border border-border rounded-none hover:border-primary transition-colors duration-300`.

- [ ] **Step 2: Add image scale-on-hover**
  In the collapsed view, change the image className to:
  ```tsx
  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
  ```
  Add `group` to the parent container.

- [ ] **Step 3: Update title/location text colors**
  Title: `text-foreground font-medium`. Location: `text-muted-foreground`.

- [ ] **Step 4: Update expanded carousel container**
  Change the expanded view wrapper background to `bg-background` and add `border border-border`.

- [ ] **Step 5: Run `npm run check`**
  Expected: no errors.

- [ ] **Step 6: Commit**
  ```bash
  git add client/src/components/projects/ProjectCard.tsx
  git commit -m "feat: dark theme project cards with Dusty Rose hover and image scale"
  ```

---

## Task 6: Add Scroll-Triggered Reveal to ProjectGrid

**Files:**
- Modify: `client/src/components/projects/ProjectGrid.tsx`
- Modify: `client/src/lib/motion.ts` (already created, just import)

**Interfaces:**
- Consumes: `motion.ts` variants
- Produces: Project cards fade-in with stagger as they enter viewport

- [ ] **Step 1: Import motion variants in ProjectGrid**
  Add `import { fadeInUp, staggerContainer } from "@/lib/motion";`.

- [ ] **Step 2: Wrap grid items in staggerContainer + whileInView**
  Change the motion.div wrapper to:
  ```tsx
  <motion.div
    className="space-y-0"
    variants={staggerContainer}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.1 }}
    layout
  >
    <AnimatePresence>
      {projects.map((project) => (
        <motion.div
          key={project.id}
          variants={fadeInUp}
          layout
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: 20 }}
        >
          <ProjectCard ... />
        </motion.div>
      ))}
    </AnimatePresence>
  </motion.div>
  ```

- [ ] **Step 3: Run `npm run check`**
  Expected: no errors.

- [ ] **Step 4: Commit**
  ```bash
  git add client/src/components/projects/ProjectGrid.tsx
  git commit -m "feat: scroll-triggered stagger reveal on project grid"
  ```

---

## Task 7: Enhance ProjectCarousel with Dark Theme & Navigation Dots

**Files:**
- Modify: `client/src/components/projects/ProjectCarousel.tsx`

**Interfaces:**
- Consumes: existing Swiper setup
- Produces: Carousel with Dusty Rose navigation dots, dark theme styling

- [ ] **Step 1: Add custom navigation dots**
  Below the Swiper component, add a custom dot indicator:
  ```tsx
  <div className="flex justify-center gap-2 mt-4">
    {images.map((_, i) => (
      <button
        key={i}
        onClick={() => swiperRef.current?.slideTo(i)}
        className={`w-2 h-2 rounded-full transition-colors ${
          i === currentSlide ? "bg-primary" : "bg-muted-foreground/50"
        }`}
      />
    ))}
  </div>
  ```
  Track `currentSlide` with state, update in `onSlideChange`.

- [ ] **Step 2: Update zoom dialog styling for dark theme**
  Change dialog background to `bg-background/95` and border to `border-border`.

- [ ] **Step 3: Run `npm run check`**
  Expected: no errors.

- [ ] **Step 4: Commit**
  ```bash
  git add client/src/components/projects/ProjectCarousel.tsx
  git commit -m "feat: dark theme carousel with Dusty Rose navigation dots"
  ```

---

## Task 8: Add 3D/App Showcase Section (Structural)

**Files:**
- Create: `client/src/components/showcase/ShowcaseSection.tsx`
- Modify: `client/src/pages/Projects.tsx` or `client/src/pages/Home.tsx` to include section

**Interfaces:**
- Consumes: nothing (standalone component)
- Produces: Horizontal-scroll showcase section with placeholder 3D model cards

- [ ] **Step 1: Create ShowcaseSection component**
  ```tsx
  import { motion } from "framer-motion";
  import { fadeInUp } from "@/lib/motion";

  const models = [
    { id: "1", title: "Corporate Circus", type: "3D Model" },
    { id: "2", title: "OASIS & LOOM", type: "3D Model" },
    { id: "3", title: "BIKE HUB", type: "App" },
  ];

  export function ShowcaseSection() {
    return (
      <section className="py-24 px-6 bg-card border-y border-border">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-foreground mb-12">
            Immersive Showcase
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
            {models.map((model) => (
              <motion.div
                key={model.id}
                whileHover={{ scale: 1.02 }}
                className="min-w-[300px] snap-start bg-background border border-border p-6"
              >
                <div className="aspect-square bg-secondary mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">3D Preview</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">{model.title}</h3>
                <p className="text-xs text-muted-foreground">{model.type}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Add ShowcaseSection to Home page (after project grid)**
  Import and render `<ShowcaseSection />` after `<ProjectGrid ... />` in `Home.tsx`.

- [ ] **Step 3: Run `npm run check`**
  Expected: no errors.

- [ ] **Step 4: Commit**
  ```bash
  git add client/src/components/showcase/ShowcaseSection.tsx client/src/pages/Home.tsx
  git commit -m "feat: horizontal-scroll 3D/app showcase section (structural)"
  ```

---

## Task 9: Theme About & Contact Pages with Dark Styling

**Files:**
- Modify: `client/src/pages/About.tsx`
- Modify: `client/src/pages/Contact.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: About and Contact pages with dark theme, Dusty Rose headings, muted gray secondary text

- [ ] **Step 1: Theme About page**
  - Background: `bg-background` (or inherit)
  - Image placeholder: `bg-secondary border border-border`
  - Heading: `text-foreground`
  - Body text: `text-muted-foreground`
  - Add `fadeInUp` motion variant on load

- [ ] **Step 2: Theme Contact page**
  - Heading: `text-foreground` with Dusty Rose accent underline
  - Labels ("Who is D.EF", etc.): `text-primary text-sm font-medium uppercase tracking-wide`
  - Address text: `text-muted-foreground`
  - Links: `text-foreground hover:text-primary transition-colors`
  - Add `fadeInUp` motion variant on load

- [ ] **Step 3: Run `npm run check`**
  Expected: no errors.

- [ ] **Step 4: Commit**
  ```bash
  git add client/src/pages/About.tsx client/src/pages/Contact.tsx
  git commit -m "feat: dark theme About and Contact pages"
  ```

---

## Task 10: Final Build & Type Check

**Files:**
- None (verification only)

- [ ] **Step 1: Run `npm run check`**
  Expected: TypeScript compiles with no errors.

- [ ] **Step 2: Run `npm run build`**
  Expected: Vite build succeeds, esbuild server bundle succeeds.

- [ ] **Step 3: Visual smoke test**
  Run `npm run dev` and verify:
  - Dark theme loads
  - Header/Footer themed
  - Project cards have hover motion
  - Scroll reveals work on all pages
  - 3D showcase section renders on Home
  - About/Contact themed

- [ ] **Step 4: Final commit**
  ```bash
  git add -A
  git commit -m "feat: D.EF architectural dark theme — full UI revolution"
  ```

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-11-23-ui-revolutionize-plan.md`.**

Recommended execution: **Subagent-driven** — each task is independently testable, interfaces are clear, and a fresh reviewer per task prevents motion bugs from cascading.

Kanban board created at `docs/superpowers/plans/kanban.md`.