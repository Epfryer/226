#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Match the merged lockfile without changing dependency versions.
npm ci --no-audit --no-fund

# Recreate production assets before workflow reconciliation restarts the app.
npm run build

# Database changes require a separate, reviewed migration.
