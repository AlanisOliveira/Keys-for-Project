#!/bin/sh
set -e

mkdir -p /data

if [ -n "${ADMIN_CPF}" ] && [ -n "${ADMIN_PASSWORD}" ]; then
  node --import tsx ./scripts/seed-admin.ts
else
  echo "ADMIN_CPF/ADMIN_PASSWORD not set; skipping admin seed."
fi

exec node server.js
