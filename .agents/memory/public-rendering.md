---
name: Public rendering boundary
description: Why the initial public document and interactive portfolio have separate rendering boundaries.
---

Keep public content readable without executing the browser-only reader, animation, carousel, and checkout code. Use the same public catalog data for the first response and its client enhancement.

**Why:** Search discovery must not depend on JavaScript execution, while the existing flipbook and portfolio interactions must retain their behavior. A semantic first document avoids forcing browser-dependent libraries into server rendering.

**How to apply:** When changing public content, keep the initial document and enhanced page consistent in meaning and working destinations. Do not replace the initial document with a loading shell or introduce crawler-specific content. Validate both ordinary HTTP responses and the enhanced browser page.
