#!/usr/bin/env bash
# MEPM website deploy — run on the VPS from the repo root.
#
# Non-destructive by design: it applies migrations but NEVER resets the
# database or removes uploaded files. The SQLite DB (prisma/dev.db) and the
# upload folders (uploads/, public/uploads/) persist across deploys and hold
# real enquiries and project drawings.
set -euo pipefail

echo "==> Pulling latest code"
git pull origin main

echo "==> Installing dependencies"
npm ci

echo "==> Applying database migrations (non-destructive)"
npx prisma migrate deploy

echo "==> Seeding admin user (idempotent)"
npx prisma db seed

echo "==> Building"
npm run build

echo "==> Restarting app"
if pm2 describe mepm-website > /dev/null 2>&1; then
  pm2 restart mepm-website --update-env
else
  pm2 start npm --name mepm-website -- start
fi

echo "==> Done"
pm2 save
