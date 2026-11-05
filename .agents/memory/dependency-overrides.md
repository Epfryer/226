---
name: Dependency override verification
description: Why successful npm installs are insufficient proof that a security override took effect.
---

Verify both the installed dependency tree and every locked copy after changing security overrides.

**Why:** npm 11 reported successful installation while retaining an old nested dependency that violated its newly configured override. Only the dependency-tree check and audit exposed it.

**How to apply:** Treat a successful install as inconclusive. Check for invalid dependency resolutions and vulnerable nested versions before declaring a remediation complete.

When a clean install is blocked by the package firewall, a compatible parent update may still retain the blocked transitive version from the lockfile. Check the resolved tree rather than assuming the parent update refreshes it; use a patched compatible override when needed, never bypass the firewall.

**Why:** A same-major parent update retained a blocked locked dependency even though a patched version satisfied its dependency range.

**How to apply:** Validate recovery with a clean lockfile-based install, not only an incremental installation.
