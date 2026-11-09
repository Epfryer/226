---
name: Publishing readiness
description: Root-page response requirements when Projects is the site landing page.
---

Keep the public root route returning HTTP 200 with Projects content, even though the browser normalizes its address to /projects.

**Why:** Replit's startup probe checks the root URL for a successful response. An HTTP redirect at that path is not a safe substitute for serving the page.

**How to apply:** Preserve production GET and HEAD readiness coverage at the root when changing landing-page routing. Use browser-side URL normalization without restoring a separate Home screen.
