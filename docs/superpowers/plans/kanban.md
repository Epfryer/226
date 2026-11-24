# D.EF UI Revolutionize — Kanban Board

## Backlog
| # | Task | Notes |
|---|------|-------|
| - | (empty) | All tasks complete |

## In Progress
| # | Task | Notes |
|---|------|-------|
| - | - | - |

## Done
| # | Task | Est. |
|---|------|------|
| 1 | ~~Update Theme System & CSS Variables~~ ✓ Done | 20 min |
| 2 | ~~Add Global Motion Utilities~~ ✓ Done | 10 min |
| 3 | ~~Theme the Header~~ ✓ Done | 20 min |
| 4 | ~~Theme the Footer~~ ✓ Done | 15 min |
| 5 | ~~Overhaul ProjectCard with Motion & Dark Theme~~ ✓ Done | 30 min |
| 6 | ~~Add Scroll-Triggered Reveal to ProjectGrid~~ ✓ Done | 20 min |
| 7 | ~~Enhance ProjectCarousel with Dark Theme & Nav Dots~~ ✓ Done | 25 min |
| 8 | ~~Add 3D/App Showcase Section (Structural)~~ ✓ Done | 30 min |
| 9 | ~~Theme About & Contact Pages with Dark Styling~~ ✓ Done | 20 min |
| 10 | ~~Final Build & Type Check~~ ✓ Done | 30 min |

## Review
| # | Task | Notes |
|---|------|-------|
| - | All tasks | Run `npm run check` + `npm run build` before merge |

---

## Quick Reference

**Spec:** `docs/superpowers/specs/2026-11-23-ui-theme-design.md`  
**Plan:** `docs/superpowers/plans/2026-11-23-ui-revolutionize-plan.md`  
**Branch:** `ui-revolutionize`  
**Total scope:** ~3 hours (tasks 1-9) + build verification (task 10)

**Theme colors:**
- Background: `hsl(0 0% 6%)` — near-black charcoal
- Foreground: `hsl(0 0% 96%)` — warm off-white
- Primary: `hsl(350 25% 55%)` — Dusty Rose
- Accent: `hsl(170 40% 55%)` — Pale Teal
- Tertiary: `hsl(45 80% 50%)` — Mustard, `hsl(30 50% 40%)` — Timber

**Motion library:** `client/src/lib/motion.ts` — `fadeInUp`, `fadeIn`, `staggerContainer`, `slideInRight`, `slideInLeft`

---

## Execution Notes for Coder

1. Work on branch `ui-revolutionize` (already created).
2. Complete tasks 1-9 in order.
3. Run `npm run check` after each task before committing.
4. After task 9, run task 10 (build + visual smoke).
5. Do NOT install new dependencies.
6. Do NOT change existing functionality — only theme + motion layering.
7. If a task fails twice, stop and report.
8. Commit after each task with the exact message from the plan.
9. Total budget: 3 hours. Prioritize tasks 1-5 (core theming) if time runs short.
10. Tasks 8 (3D showcase) is structural only — no Three.js install.