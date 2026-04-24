#!/usr/bin/env bash
# ================================================================
#  db-restore.sh — PostgreSQL database restore
#  Reads connection details from .env
#  Works both locally and inside Docker (auto-detects docker network)
#
#  Usage:
#    bash scripts/db-restore.sh                                              (latest dump, default .env)
#    bash scripts/db-restore.sh -f dumps/db/backup-2026-04-09.sql            (specific dump)
#    bash scripts/db-restore.sh -e apps/api/.env.docker                      (custom .env.docker)
#    bash scripts/db-restore.sh -r                                           (drop & restore)
#    bash scripts/db-restore.sh -c|--clean                                   (only drop public objects)
#    bash scripts/db-restore.sh -f dumps/db/backup.sql -e apps/api/.env -r   (full options)
# ================================================================

DUMP_FILE=""
ENV_FILE=".env"
RESET=false
CLEAN_ONLY=false
DUMPS_DIR="dumps/db"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--file)  DUMP_FILE="$2"; shift 2 ;;
    -e|--env)   ENV_FILE="$2";  shift 2 ;;
    -r|--reset) RESET=true;     shift   ;;
    -c|--clean) CLEAN_ONLY=true; RESET=true; shift ;;
    *) echo "❌  Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ "$CLEAN_ONLY" == "false" ]]; then
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
  echo "⚠️   Resetting database schema (dropping all objects in public)..."
  RESET_CMD="
    DO \$\$ DECLARE
      r RECORD;
    BEGIN
      -- Drop tables
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
      -- Drop types (enums)
      FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END \$\$;"
    
  if ! psql "$DB_URL" -q -c "$RESET_CMD" 2>&1; then
    echo "❌  Schema reset failed" >&2; exit 1
  fi
  echo "✅  Schema cleared."
fi

if [[ "$CLEAN_ONLY" == "false" ]]; then
  echo "⏳  Restoring from $DUMP_FILE ..."

  if psql "$DB_URL" < "$DUMP_FILE"; then
    echo "✅  DB restored from → ./${DUMP_FILE}"
  else
    echo "❌  Restore failed" >&2; exit 1
  fi
fi
