---
name: Security version compatibility
description: Why UUID security remediation retains the dual CommonJS/ESM release line.
---

Use the patched UUID 11 release line for existing Google storage HTTP dependencies rather than overriding them to an ESM-only release.

**Why:** These consumers load UUID through CommonJS. A newer major being secure does not make its module format compatible; UUID 11 provides the required security fix while retaining both module formats.

**How to apply:** If changing the storage dependency chain or its UUID override, check the consumers' module-loading requirements and exercise their resolved UUID copy before selecting a newer major.
