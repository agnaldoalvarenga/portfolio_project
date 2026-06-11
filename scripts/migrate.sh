#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL}"
DIR="$(cd "$(dirname "$0")/../packages/db/migrations" && pwd)"
SHIM="$(cd "$(dirname "$0")" && pwd)/local-auth-shim.sql"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$DIR/0000_base.sql"
if [ "${LOCAL_AUTH_SHIM:-0}" = "1" ]; then
  echo "applying local auth.uid() shim"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SHIM"
fi
for f in 0001 0002 0003 0004 0005 0006 0007 0008 0009; do
  echo "-> migration $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$DIR/${f}"_*.sql
done
echo "migrations applied (0000..0009)"
