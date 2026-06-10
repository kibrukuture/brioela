#!/usr/bin/env bash
# Locks all protected files with chflags uchg.
# No password needed — locking is always safe.
# To unlock a category: bun run unlock <category>
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCKED=0

lock_file() {
  local f="$1"
  if [ -f "$f" ]; then
    chflags uchg "$f"
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

# ── lexicon ────────────────────────────────────────────────────────────────────
lock_pattern "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/_lexicon" "*.ts"

# ── database schema ────────────────────────────────────────────────────────────
lock_pattern "$WORKSPACE_ROOT/backend/src/database" "*.ts"

# ── deploy configs ─────────────────────────────────────────────────────────────
while IFS= read -r -d '' f; do
  lock_file "$f"
done < <(find "$WORKSPACE_ROOT" \( -name "fly.toml" -o -name "wrangler.toml" -o -name "wrangler.json" \) -not -path "*/node_modules/*" -print0 2>/dev/null)

echo ""
echo "  $LOCKED file(s) locked"
