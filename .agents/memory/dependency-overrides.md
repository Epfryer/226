---
name: Dependency override verification
description: Why successful npm installs are insufficient proof that a security override took effect.
---

Verify both the installed dependency tree and every locked copy after changing security overrides.

**Why:** npm 11 reported successful installation while retaining an old nested dependency that violated its newly configured override. Only the dependency-tree check and audit exposed it.

**How to apply:** Treat a successful install as inconclusive. Check for invalid dependency resolutions and vulnerable nested versions before declaring a remediation complete.
