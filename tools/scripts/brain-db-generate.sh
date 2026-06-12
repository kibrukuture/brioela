#!/usr/bin/env bash
# Unlocks drizzle migration files, runs brain:db:generate, re-locks everything.
# Two factors required: brioela lock password + macOS sudo password.
# read -rs blocks non-interactive shells — AI tools cannot satisfy this prompt.
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_LOCAL="$WORKSPACE_ROOT/.env.local"
SALT="brioela-lock-v1"
MIGRATION_TS="$WORKSPACE_ROOT/backend/src/agents/brain/_migrations/brain.migration.ts"
DRIZZLE_DIR="$WORKSPACE_ROOT/backend/src/agents/brain/drizzle"

# ── factor 1: brioela lock password ───────────────────────────────────────────
if ! grep -q "^BRIOELA_LOCK_HASH=" "$ENV_LOCAL" 2>/dev/null; then
  echo "lock not set up. run: bun run lock:setup"
  exit 1
fi

stored_hash=$(grep "^BRIOELA_LOCK_HASH=" "$ENV_LOCAL" | cut -d= -f2)

printf "🔒 password: "
read -rs pw
echo ""

input_hash=$(printf '%s:%s' "$SALT" "$pw" | shasum -a 256 | awk '{print $1}')

if [ "$input_hash" != "$stored_hash" ]; then
  echo "wrong password"
  exit 1
fi

# ── always re-lock on exit, success or failure ─────────────────────────────────
cleanup() {
  echo ""
  echo "re-locking migration files..."
  sudo chflags -R schg,uchg "$DRIZZLE_DIR"
  sudo chflags schg,uchg "$MIGRATION_TS"
  echo "locked."
}
trap cleanup EXIT

# ── factor 2: sudo (macOS password or Touch ID) ───────────────────────────────
echo ""
sudo -k
sudo chflags -R noschg,nouchg "$DRIZZLE_DIR"
sudo chflags noschg,nouchg "$MIGRATION_TS"

# ── generate ───────────────────────────────────────────────────────────────────
cd "$WORKSPACE_ROOT"
bun --cwd backend run brain:db:generate
