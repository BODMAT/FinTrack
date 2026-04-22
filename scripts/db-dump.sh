#!/usr/bin/env bash
# ================================================================
#  db-dump.sh — PostgreSQL database dump
#  Reads connection details from .env
#  Works both locally and inside Docker (auto-detects docker network)
#
#  Usage:
#    bash scripts/db-dump.sh
#    bash scripts/db-dump.sh -e apps/api/.env
#    bash scripts/db-dump.sh -e apps/api/.env.docker
# ================================================================

set -euo pipefail

ENV_FILE=".env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env) ENV_FILE="$2"; shift 2 ;;
    *) echo "❌  Unknown argument: $1" >&2; exit 1 ;;
  esac
done

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

DUMPS_DIR="dumps/db"
mkdir -p "$DUMPS_DIR"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
OUTPUT="${DUMPS_DIR}/backup-${DATE}.sql"

echo "⏳  Connecting to database..."
if pg_dump "$DB_URL" > "$OUTPUT"; then
  echo "✅  DB dump saved → ./${OUTPUT}"
else
  rm -f "$OUTPUT"
  echo "❌  Dump failed — no file written" >&2
  exit 1
fi