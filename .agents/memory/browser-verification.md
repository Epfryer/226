---
name: Browser verification constraints
description: Browser installation alone is not proof that cross-browser tests can run in this Nix environment.
---

Distinguish successful browser downloads from usable browser runtimes and real-device coverage.

**Why:** Firefox and WebKit initially failed to launch despite successful downloads. Host-library resolution later enabled both; phone viewport emulation and Linux WebKit still do not certify physical iOS Safari.

**How to apply:** Check browser launch results explicitly, fail missing-engine checks visibly, and report unverified engines/devices rather than treating an installation or Chromium run as cross-browser coverage.

Browser-specific Nix library paths can unblock Firefox without changing application code. Avoid adding every Nix library directory: the environment can exceed argument limits or select an incompatible C++ runtime.

**Why:** Targeted library resolution allowed Firefox's desktop and touch-viewport checks to pass after its initial missing-library failure. An older C++ runtime broke Node when selected first.

**How to apply:** Select compatible host libraries deliberately. The downloaded Linux WebKit launcher replaces inherited library paths; invoking its bundled binary with the bundle environment and a working GIO TLS module enabled HTTPS tests. Installing libraries alone does not establish a usable session. Keep any development-certificate exception explicit and confined to test contexts.
