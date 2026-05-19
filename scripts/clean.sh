#!/usr/bin/env bash
# ================================================================
#  clean.sh — Remove node_modules, lock files, and build output
#  Universal for any Node.js monorepo or single-package project.
#
#  Usage:
#    bash scripts/clean.sh              # node_modules + lock files (default)
#    bash scripts/clean.sh --modules    # node_modules only
#    bash scripts/clean.sh --locks      # lock files only
#    bash scripts/clean.sh --dist       # build output only
#    bash scripts/clean.sh --all        # everything
#    bash scripts/clean.sh --all -y     # skip confirmation (CI)
# ================================================================

set -euo pipefail

# ── Helpers ───────────────────────────────────────────────────────
log()  { printf '\033[0;36m▸\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m⚠\033[0m  %s\n' "$*" >&2; }
die()  { printf '\033[0;31m✖\033[0m  %s\n' "$*" >&2; exit 1; }

confirm() {
  local msg="${1:-Are you sure?}"
  printf "\033[0;33m⚠\033[0m %s [y/N] " "$msg"
  read -r response
  case "$response" in
    [yY][eE][sS]|[yY]) return 0 ;;
    *) log "Cancelled."; exit 0 ;;
  esac
}

# ── Defaults ──────────────────────────────────────────────────────
CLEAN_MODULES=false
CLEAN_LOCKS=false
CLEAN_DIST=false
SKIP_CONFIRM=false

# ── Arg parsing ───────────────────────────────────────────────────
if [[ $# -eq 0 ]]; then
  CLEAN_MODULES=true
  CLEAN_LOCKS=true
else
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --modules)   CLEAN_MODULES=true; shift ;;
      --locks)     CLEAN_LOCKS=true;   shift ;;
      --dist)      CLEAN_DIST=true;    shift ;;
      --all)       CLEAN_MODULES=true; CLEAN_LOCKS=true; CLEAN_DIST=true; shift ;;
      -y|--yes)    SKIP_CONFIRM=true;  shift ;;
      --)          shift; break ;;
      --help|-h)
        cat <<'EOF'
clean.sh — Remove node_modules, lock files, and build output

Usage:
  bash scripts/clean.sh [flags]

Flags:
  (none)       node_modules + lock files (default)
  --modules    All node_modules directories
  --locks      All lock files (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lock*)
  --dist       Build output (dist/, .next/, out/, build/, .turbo/, coverage/,
               .svelte-kit/, .nuxt/, .astro/, .vite/, .cache/, .parcel-cache/)
               plus *.tsbuildinfo, .eslintcache, .prettiercache, .stylelintcache
  --all        Everything above
  -y, --yes    Skip confirmation prompt (useful in CI)
  --help       Show this help
EOF
        exit 0 ;;
      *) die "Unknown flag: $1. Use --help for usage." ;;
    esac
  done
fi

# ── Resolve root ──────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ── Preview ───────────────────────────────────────────────────────
FOUND_ANYTHING=false

if $CLEAN_MODULES; then
  MODULE_DIRS=()
  while IFS= read -r line; do MODULE_DIRS+=("$line"); done < <(
    find . -path '*/.git' -prune -o \
      -name 'node_modules' -type d -prune -print 2>/dev/null | sort
  )
  if [[ ${#MODULE_DIRS[@]} -gt 0 ]]; then
    warn "node_modules to remove (${#MODULE_DIRS[@]}):"
    printf '  %s\n' "${MODULE_DIRS[@]}"
    FOUND_ANYTHING=true
  fi
fi

if $CLEAN_LOCKS; then
  LOCK_FILES=()
  while IFS= read -r line; do LOCK_FILES+=("$line"); done < <(
    find . \( -path '*/.git' -o -path '*/node_modules' \) -prune -o \
      \( -name 'package-lock.json' \
         -o -name 'yarn.lock' \
         -o -name 'pnpm-lock.yaml' \
         -o -name 'bun.lock' \
         -o -name 'bun.lockb' \) -print 2>/dev/null | sort
  )
  if [[ ${#LOCK_FILES[@]} -gt 0 ]]; then
    warn "Lock files to remove (${#LOCK_FILES[@]}):"
    printf '  %s\n' "${LOCK_FILES[@]}"
    FOUND_ANYTHING=true
  fi
fi

if $CLEAN_DIST; then
  DIST_DIRS=()
  while IFS= read -r line; do DIST_DIRS+=("$line"); done < <(
    find . \( -path '*/.git' -o -path '*/node_modules' \) -prune -o \
      \( -name 'dist' -o -name '.next' -o -name 'out' -o -name 'build' \
         -o -name '.turbo' -o -name 'coverage' \
         -o -name '.svelte-kit' -o -name '.nuxt' -o -name '.astro' \
         -o -name '.vite' -o -name '.cache' -o -name '.parcel-cache' \) \
      -type d -prune -print 2>/dev/null | sort
  )
  TSBUILD_FILES=()
  while IFS= read -r line; do TSBUILD_FILES+=("$line"); done < <(
    find . \( -path '*/.git' -o -path '*/node_modules' \) -prune -o \
      \( -name '*.tsbuildinfo' \
         -o -name '.eslintcache' \
         -o -name '.prettiercache' \
         -o -name '.stylelintcache' \) \
      -type f -print 2>/dev/null | sort
  )
  if [[ ${#DIST_DIRS[@]} -gt 0 ]]; then
    warn "Build output to remove (${#DIST_DIRS[@]}):"
    printf '  %s\n' "${DIST_DIRS[@]}"
    FOUND_ANYTHING=true
  fi
  if [[ ${#TSBUILD_FILES[@]} -gt 0 ]]; then
    warn "Build/lint caches to remove (${#TSBUILD_FILES[@]}):"
    printf '  %s\n' "${TSBUILD_FILES[@]}"
    FOUND_ANYTHING=true
  fi
fi

if ! $FOUND_ANYTHING; then
  log "Nothing to clean."
  exit 0
fi

# ── Confirm ───────────────────────────────────────────────────────
if ! $SKIP_CONFIRM; then
  confirm "Delete the above? This cannot be undone."
fi

# ── Execute ───────────────────────────────────────────────────────
if $CLEAN_MODULES && [[ ${#MODULE_DIRS[@]} -gt 0 ]]; then
  log "Removing node_modules..."
  printf '%s\0' "${MODULE_DIRS[@]}" | xargs -0 rm -rf
  log "node_modules removed."
fi

if $CLEAN_LOCKS && [[ ${#LOCK_FILES[@]} -gt 0 ]]; then
  log "Removing lock files..."
  printf '%s\0' "${LOCK_FILES[@]}" | xargs -0 rm -f
  log "Lock files removed."
fi

if $CLEAN_DIST; then
  if [[ ${#DIST_DIRS[@]} -gt 0 ]]; then
    log "Removing build output..."
    printf '%s\0' "${DIST_DIRS[@]}" | xargs -0 rm -rf
    log "Build output removed."
  fi
  if [[ ${#TSBUILD_FILES[@]} -gt 0 ]]; then
    log "Removing build/lint caches..."
    printf '%s\0' "${TSBUILD_FILES[@]}" | xargs -0 rm -f
    log "Build/lint caches removed."
  fi
fi

log "Clean complete."
