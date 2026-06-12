#!/usr/bin/env bash
# Locks all protected files with sudo chflags schg (system immutable).
# Requires sudo — macOS password or Touch ID.
# To unlock a category: bun run unlock <category>
set -euo pipefail

# invalidate any cached sudo session — password required every time, no exceptions
sudo -k
sudo -v

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCKED=0

lock_file() {
  local f="$1"
  if [ -f "$f" ]; then
    # drop the unlock-window deny-delete ACL first (fails silently on already-locked
    # files — harmless, schg dominates), then make the file fully immutable:
    # locked = no edit, no delete, no rename, enforced by the OS.
    sudo chmod -N "$f" 2>/dev/null || true
    sudo chflags schg,uchg "$f"
    echo "  locked  ${f#"$WORKSPACE_ROOT/"}"
    LOCKED=$((LOCKED + 1))
  fi
}

lock_pattern() {
  while IFS= read -r -d '' f; do
    lock_file "$f"
  done < <(find "$1" -name "$2" -not -path "*/node_modules/*" -print0 2>/dev/null)
}

echo ""
echo "brioela lock"
echo ""

# ── baselines ──────────────────────────────────────────────────────────────────
lock_file "$WORKSPACE_ROOT/tools/brioela-type-guard/type.guard.baseline.json"
lock_file "$WORKSPACE_ROOT/tools/brioela-name-guard/name.guard.baseline.json"
lock_file "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/lexicon.guard.baseline.json"

# ── policies ───────────────────────────────────────────────────────────────────
lock_pattern "$WORKSPACE_ROOT/tools/brioela-type-guard/_policies"  "*.ts"
lock_pattern "$WORKSPACE_ROOT/tools/brioela-name-guard/_policies"  "*.ts"
lock_pattern "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/_policies" "*.ts"
# guard config helpers — ignoredPathParts / checkedRoots are attack surface
lock_file "$WORKSPACE_ROOT/tools/brioela-name-guard/_helpers/name.guard.config.helper.ts"
lock_file "$WORKSPACE_ROOT/tools/brioela-type-guard/_helpers/type.guard.config.helper.ts"
lock_file "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/_helpers/lexicon.guard.config.helper.ts"

# ── lexicon ────────────────────────────────────────────────────────────────────
lock_pattern "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/_lexicon" "*.ts"

# ── database schema ────────────────────────────────────────────────────────────
lock_pattern "$WORKSPACE_ROOT/backend/src/database" "*.ts"

# ── brain migrations ───────────────────────────────────────────────────────────
lock_file "$WORKSPACE_ROOT/backend/src/agents/brain/_migrations/brain.migration.ts"
lock_pattern "$WORKSPACE_ROOT/backend/src/agents/brain/drizzle" "*.sql"
lock_pattern "$WORKSPACE_ROOT/backend/src/agents/brain/drizzle/meta" "*.json"
lock_file "$WORKSPACE_ROOT/tools/scripts/brain-db-generate.sh"

# ── deploy configs ─────────────────────────────────────────────────────────────
while IFS= read -r -d '' f; do
  lock_file "$f"
done < <(find "$WORKSPACE_ROOT" \( -name "fly.toml" -o -name "wrangler.toml" -o -name "wrangler.json" \) -not -path "*/node_modules/*" -print0 2>/dev/null)

echo ""
echo "  $LOCKED file(s) locked"
