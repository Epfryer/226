#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Match the merged lockfile without changing dependency versions.
npm ci --no-audit --no-fund

# Apply only the reviewed additive development-side job checkpoint schema.
# This refuses production and verifies existing definitions instead of pushing
# unrelated schema differences. Publish owns production schema changes.
node --import tsx scripts/setup-shop-sync-progress.ts

# Recreate production assets before workflow reconciliation restarts the app.
npm run build
