#!/bin/bash
set -e

# Navigate to the monorepo root (2 levels up from artifacts/api-server)
cd "$(dirname "$0")/../.."
REPO_ROOT="$(pwd)"

echo "==> Repo root: $REPO_ROOT"

# Map SUPABASE_* → VITE_SUPABASE_* so Vite bakes them into the static bundle.
# This means auth works without needing a running API server.
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}"

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "WARNING: SUPABASE_URL / SUPABASE_ANON_KEY not set — auth will not work in production."
fi

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building frontend..."
pnpm --filter @workspace/scorpstudy build

echo "==> Copying build output to artifacts/api-server/dist-fe..."
rm -rf "$REPO_ROOT/artifacts/api-server/dist-fe"
cp -r "$REPO_ROOT/artifacts/scorpstudy/dist" "$REPO_ROOT/artifacts/api-server/dist-fe"

echo "==> Build complete. Output: artifacts/api-server/dist-fe/"
ls "$REPO_ROOT/artifacts/api-server/dist-fe/"
