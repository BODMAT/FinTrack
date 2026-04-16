#!/usr/bin/env bash
# ================================================================
#  codebase-dump.sh — AI-ready full project codebase dump
#  Respects .gitignore | skips lock-files | skips binaries
#  Usage: bash codebase-dump.sh                                    (full project)
#         bash codebase-dump.sh -d src/components                  (subfolder, recursive)
#         bash codebase-dump.sh --no-recursive                     (root files only)
#         bash codebase-dump.sh -d src/components --no-recursive   (subfolder, top-level only)
# ================================================================

TARGET_DIR="."
RECURSIVE="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--dir)          TARGET_DIR="$2"; shift 2 ;;
    -R|--no-recursive) RECURSIVE="false";  shift   ;;
    *) echo "❌  Unknown argument: $1" >&2; exit 1 ;;
  esac
done

DUMPS_DIR="dumps/codebase"
mkdir -p "$DUMPS_DIR"

if [[ "$TARGET_DIR" == "." && "$RECURSIVE" == "true" ]]; then
  OUTPUT="${DUMPS_DIR}/codebase-dump.txt"
elif [[ "$TARGET_DIR" == "." && "$RECURSIVE" == "false" ]]; then
  OUTPUT="${DUMPS_DIR}/codebase-dump_root-only.txt"
elif [[ "$RECURSIVE" == "false" ]]; then
  SAFE_DIR=$(echo "$TARGET_DIR" | tr '/' '_')
  OUTPUT="${DUMPS_DIR}/codebase-dump_${SAFE_DIR}_top-only.txt"
else
  SAFE_DIR=$(echo "$TARGET_DIR" | tr '/' '_')
  OUTPUT="${DUMPS_DIR}/codebase-dump_${SAFE_DIR}.txt"
fi

THIS_SCRIPT="$(basename "${BASH_SOURCE[0]:-$0}")"

LOCK_RE='^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|composer\.lock|Gemfile\.lock|poetry\.lock|Cargo\.lock|Pipfile\.lock|packages\.lock\.json|npm-shrinkwrap\.json|bun\.lockb|shrinkwrap\.json)$'

if ! git rev-parse --git-dir &>/dev/null; then
  echo "❌  Not a git repository. Run from the project root." >&2; exit 1
fi

get_files() {
  local prefix
  if [[ "$TARGET_DIR" == "." ]]; then
    prefix=""
  else
    prefix="${TARGET_DIR}/"
  fi

  {
    git ls-files "$TARGET_DIR"
    # Uncomment next line if untracked git files needed:
    git ls-files --others --exclude-standard "$TARGET_DIR"
  } 2>/dev/null \
    | sort -u \
    | grep -vE "$LOCK_RE" \
    | grep -vxF "$OUTPUT" \
    | grep -vxF "$THIS_SCRIPT" \
    | if [[ "$RECURSIVE" == "false" ]]; then
        grep -E "^${prefix}[^/]+$"
      else
        cat
      fi
}

build_tree() {
  awk 'BEGIN { FS="/" } {
    n = NF
    for (i = 1; i <= n; i++) {
      key = ""
      for (j = 1; j <= i; j++) key = (key == "" ? $j : key "/" $j)
      if (!(key in S)) {
        S[key] = 1
        pad = ""
        for (j = 1; j < i; j++) pad = pad "|   "
        if (i < n)
          print pad "+-- " $i "/"
        else
          print pad "|-- " $i
      }
    }
  }'
}

is_binary() {
  perl -e 'read(STDIN,$b,8192); exit(index($b,"\x00")>=0 ? 0 : 1)' < "$1" 2>/dev/null
}

FILE_LIST=$(get_files)
FILE_COUNT=$(printf '%s\n' "$FILE_LIST" | grep -c .)
echo "⏳  Collecting ${FILE_COUNT} files…"

{
  printf '==========================================\n'
  printf '           PROJECT STRUCTURE\n'
  printf '==========================================\n\n'
  printf '%s\n' "$FILE_LIST" | build_tree
  printf '\n==========================================\n'
  printf '             FILE CONTENTS\n'
  printf '==========================================\n'

  printf '%s\n' "$FILE_LIST" | while IFS= read -r f; do
    [[ -z "$f" || ! -f "$f" ]] && continue
    printf '\n================== %s ==================\n\n' "$f"
    if is_binary "$f"; then
      printf '[BINARY FILE — content skipped]\n'
    else
      cat "$f"
      [[ -n "$(tail -c1 "$f")" ]] && printf '\n'
    fi
  done
} > "$OUTPUT"

SIZE_KB=$(awk "BEGIN{printf \"%.1f\", $(wc -c < "$OUTPUT")/1024}")
echo "✅  Dump saved → ./${OUTPUT}  (${FILE_COUNT} files, ${SIZE_KB} KB)"
