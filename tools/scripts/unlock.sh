#!/usr/bin/env bash
# Unlocks one category of protected files.
# Requires sudo (macOS password or Touch ID) — cannot be run non-interactively (AI cannot use this).
# The schg flag is OS-enforced: no script, no AI, no process can bypass it without sudo.
#
# Usage: bun run unlock <category>
# Categories: baselines  policies  lexicon  schema  deploy
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_LOCAL="$WORKSPACE_ROOT/.env.local"
SALT="brioela-lock-v1"
CATEGORY="${1:-}"

if [ -z "$CATEGORY" ]; then
  echo ""
  echo "usage: bun run unlock <category>"
  echo ""
  echo "  baselines   guard baseline files"
  echo "  policies    guard rule policy files"
  echo "  lexicon     approved word list files"
  echo "  schema      database schema files"
  echo "  deploy      deploy config files"
  echo ""
  exit 1
fi

# ── password gate ──────────────────────────────────────────────────────────────
# read -s blocks on interactive stdin — AI tools cannot satisfy this prompt.

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

# ── unlock ─────────────────────────────────────────────────────────────────────

UNLOCKED=0

unlock_file() {
  local f="$1"
  if [ -f "$f" ]; then
    sudo chflags noschg,nouchg "$f"
    echo "  unlocked  ${f#"$WORKSPACE_ROOT/"}"
    UNLOCKED=$((UNLOCKED + 1))
  fi
}

unlock_pattern() {
  while IFS= read -r -d '' f; do
    unlock_file "$f"
  done < <(find "$1" -name "$2" -not -path "*/node_modules/*" -print0 2>/dev/null)
}

echo ""
echo "brioela unlock — $CATEGORY"
echo ""

case "$CATEGORY" in
  baselines)
    unlock_file "$WORKSPACE_ROOT/tools/brioela-type-guard/type.guard.baseline.json"
    unlock_file "$WORKSPACE_ROOT/tools/brioela-name-guard/name.guard.baseline.json"
    unlock_file "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/lexicon.guard.baseline.json"
    ;;
  policies)
    unlock_pattern "$WORKSPACE_ROOT/tools/brioela-type-guard/_policies"   "*.ts"
    unlock_pattern "$WORKSPACE_ROOT/tools/brioela-name-guard/_policies"   "*.ts"
    unlock_pattern "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/_policies" "*.ts"
    unlock_file "$WORKSPACE_ROOT/tools/brioela-name-guard/_helpers/name.guard.config.helper.ts"
    unlock_file "$WORKSPACE_ROOT/tools/brioela-type-guard/_helpers/type.guard.config.helper.ts"
    unlock_file "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/_helpers/lexicon.guard.config.helper.ts"
    ;;
  lexicon)
    unlock_pattern "$WORKSPACE_ROOT/tools/brioela-lexicon-guard/_lexicon" "*.ts"
    ;;
  schema)
    unlock_pattern "$WORKSPACE_ROOT/backend/src/database" "*.ts"
    ;;
  deploy)
    while IFS= read -r -d '' f; do
      unlock_file "$f"
    done < <(find "$WORKSPACE_ROOT" \( -name "fly.toml" -o -name "wrangler.toml" -o -name "wrangler.json" \) -not -path "*/node_modules/*" -print0 2>/dev/null)
    ;;
  *)
    echo "unknown category: $CATEGORY"
    echo "valid: baselines  policies  lexicon  schema  deploy"
    exit 1
    ;;
esac

echo ""
echo "  $UNLOCKED file(s) unlocked"
echo "  re-lock when done: bun run lock"
