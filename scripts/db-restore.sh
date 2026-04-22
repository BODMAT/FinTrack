#!/usr/bin/env bash
# ================================================================
#  db-restore.sh — PostgreSQL database restore
#  Reads connection details from .env
#  Works both locally and inside Docker (auto-detects docker network)
#
#  Usage:
#    bash scripts/db-restore.sh                              (latest dump)
#    bash scripts/db-restore.sh -f dumps/db/backup.sql
#    bash scripts/db-restore.sh -e apps/api/.env.docker
#    bash scripts/db-restore.sh -r                          (drop & restore)
#    bash scripts/db-restore.sh -f dumps/db/backup.sql -e apps/api/.env -r
# ================================================================

set -euo pipefail

DUMP_FILE=""
ENV_FILE=".env"
RESET=false
DUMPS_DIR="dumps/db"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--file)  DUMP_FILE="$2"; shift 2 ;;
    -e|--env)   ENV_FILE="$2";  shift 2 ;;
    -r|--reset) RESET=true;     shift   ;;
    *) echo "❌  Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$DUMP_FILE" ]]; then
  DUMP_FILE=$(ls -t "$DUMPS_DIR"/*.sql 2>/dev/null | head -1 || true)
  if [[ -z "$DUMP_FILE" ]]; then
    echo "❌  No dump files found in $DUMPS_DIR" >&2; exit 1
  fi
  echo "📂  No dump specified, using latest: $DUMP_FILE"
fi

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "❌  Dump file not found: $DUMP_FILE" >&2; exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌  .env file not found: $ENV_FILE" >&2; exit 1
fi

parse_env() {
  grep -v '^\s*#' "$1" \
    | grep -v '^\s*$' \
    | sed 's/[[:space:]]*#[^"]*$//' \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

while IFS='=' read -r key value; do
  [[ -z "$key" ]] && continue
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  export "$key=$value"
done < <(parse_env "$ENV_FILE")

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌  DATABASE_URL is not set in $ENV_FILE" >&2; exit 1
fi

resolve_db_url() {
  local url="$1"
  if [[ -f "/.dockerenv" ]] || grep -q 'docker\|container' /proc/1/cgroup 2>/dev/null; then
    url="${url/localhost/postgres}"
    url="${url/127.0.0.1/postgres}"
  fi
  echo "$url"
}

strip_prisma_params() {
  echo "$1" | sed 's/?schema=[^&]*//;s/&schema=[^&]*//'
}

DB_URL=$(resolve_db_url "$DATABASE_URL")
DB_URL=$(strip_prisma_params "$DB_URL")

if [[ "$RESET" == "true" ]]; then
  echo "⚠️   Resetting database schema..."
  if ! psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>&1; then
    echo "❌  Schema reset failed" >&2; exit 1
  fi
fi

echo "⏳  Restoring from $DUMP_FILE ..."
if psql "$DB_URL" < "$DUMP_FILE"; then
  echo "✅  DB restored from → ./${DUMP_FILE}"
else
  echo "❌  Restore failed" >&2; exit 1
fi