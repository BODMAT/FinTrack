#!/usr/bin/env bash
# ================================================================
#  db-dump.sh — PostgreSQL database dump
#  Reads connection details from .env
#  Usage: bash scripts/db-dump.sh
# ================================================================

ENV_FILE="${1:-.env}"

if [[ -f "$ENV_FILE" ]]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "❌  .env file not found: $ENV_FILE" >&2; exit 1
fi

DUMPS_DIR="dumps/db"
mkdir -p "$DUMPS_DIR"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
OUTPUT="${DUMPS_DIR}/backup-${DATE}.sql"

PGPASSWORD=$DB_PASSWORD pg_dump \
  -U $DB_USER \
  -h $DB_HOST \
  -p $DB_PORT \
  -d $DB_NAME \
  > "$OUTPUT"

echo "✅  DB dump saved → ./${OUTPUT}"