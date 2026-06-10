#!/usr/bin/env bash
# One-time setup: stores a Brioela lock password hash in .env.local.
# This is the second-layer password checked by unlock.sh BEFORE sudo runs.
# The first layer is OS-level: files are locked with schg (system immutable).
# Unlocking requires BOTH this password AND your macOS sudo password.
# Run once. Re-run only to change the password.
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_LOCAL="$WORKSPACE_ROOT/.env.local"
SALT="brioela-lock-v1"

printf "set brioela lock password: "
read -rs pw
echo ""
printf "confirm password: "
read -rs pw2
echo ""

if [ "$pw" != "$pw2" ]; then
  echo "passwords do not match"
  exit 1
fi

if [ -z "$pw" ]; then
  echo "password cannot be empty"
  exit 1
fi

hash=$(printf '%s:%s' "$SALT" "$pw" | shasum -a 256 | awk '{print $1}')

touch "$ENV_LOCAL"

if grep -q "^BRIOELA_LOCK_HASH=" "$ENV_LOCAL" 2>/dev/null; then
  # replace existing line (macOS sed)
  sed -i '' "s|^BRIOELA_LOCK_HASH=.*|BRIOELA_LOCK_HASH=$hash|" "$ENV_LOCAL"
else
  echo "BRIOELA_LOCK_HASH=$hash" >> "$ENV_LOCAL"
fi

echo "password set. run: bun run lock"
