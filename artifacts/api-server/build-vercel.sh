#!/bin/bash
set -e

# Navigate to the monorepo root (2 levels up from artifacts/api-server)
cd "$(dirname "$0")/../.."
REPO_ROOT="$(pwd)"

echo "==> Repo root: $REPO_ROOT"
echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building frontend..."
pnpm --filter @workspace/scorpstudy build

echo "==> Copying build output to artifacts/api-server/dist-fe..."
rm -rf "$REPO_ROOT/artifacts/api-server/dist-fe"
cp -r "$REPO_ROOT/artifacts/scorpstudy/dist" "$REPO_ROOT/artifacts/api-server/dist-fe"

echo "==> Build complete. Output: artifacts/api-server/dist-fe/"
ls "$REPO_ROOT/artifacts/api-server/dist-fe/"
