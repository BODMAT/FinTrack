#!/usr/bin/env bash
# ================================================================
#  db-dump.sh — PostgreSQL database dump
#  Reads connection details from .env
#  Usage: bash scripts/db-dump.sh
#         bash scripts/db-dump.sh -e apps/api/.env
#         bash scripts/db-dump.sh --env apps/api/.env
# ================================================================

ENV_FILE=".env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env) ENV_FILE="$2"; shift 2 ;;
    *) echo "❌  Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -f "$ENV_FILE" ]]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "❌  .env file not found: $ENV_FILE" >&2; exit 1
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo "❌  DATABASE_URL is not set in $ENV_FILE" >&2; exit 1
fi

DUMPS_DIR="dumps/db"
mkdir -p "$DUMPS_DIR"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
OUTPUT="${DUMPS_DIR}/backup-${DATE}.sql"

pg_dump "$DATABASE_URL" > "$OUTPUT"

echo "✅  DB dump saved → ./${OUTPUT}"