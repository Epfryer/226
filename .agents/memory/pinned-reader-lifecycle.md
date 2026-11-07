---
name: Pinned publication reader lifecycle
description: Preserve live book gestures and reading state when moving between inline and floating layouts.
---

Keep one active publication reader and move its stable DOM host between inline and floating slots; do not change the React portal container to implement pinning.

**Why:** Changing a portal container remounts the PDF reader and loses live reading state. The user specifically requires spread, zoom, and pan to survive pinning, filters, and returning inline.

**How to apply:** Keep the portal container stable, preserve normalized zoom/pan when fitting a resized book, and retain per-publication snapshots during the visit. Closing a reader must not close or reset projects.

Reader readiness checks must wait for both visible spread canvases to finish painting, not merely for canvases with allocated dimensions.

**Why:** A reader can expose page numbers and positive canvas dimensions while the actual pages are still blank during PDF rendering.

**How to apply:** Verify painted pages before visual acceptance or screenshots; a loaded reader shell alone is insufficient evidence.
