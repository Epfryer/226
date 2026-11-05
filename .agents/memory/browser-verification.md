---
name: Browser verification constraints
description: Browser installation alone is not proof that cross-browser tests can run in this Nix environment.
---

Distinguish successful browser downloads from usable browser runtimes and real-device coverage.

**Why:** Firefox and WebKit downloads succeeded here but both failed to launch because required Linux shared libraries were missing. System Chromium worked; phone viewport emulation does not certify iOS Safari or multi-touch behavior.

**How to apply:** Check browser launch results explicitly, fail missing-engine checks visibly, and report unverified engines/devices rather than treating an installation or Chromium run as cross-browser coverage.
