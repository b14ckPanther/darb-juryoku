#!/usr/bin/env bash
# Fail if any text file contains an emoji or pictograph code point (CLAUDE.md section 1.10).
# Usage: scripts/check-emoji.sh [path ...]   (defaults to the repo's source and docs folders)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ "$#" -eq 0 ]; then
  set -- "$root/apps" "$root/packages" "$root/config" "$root/docs" "$root/ml/src" "$root/ml/tests" \
    "$root/scripts" "$root/README.md" "$root/AGENTS.md" "$root/CLAUDE.md"
fi

existing=()
for path in "$@"; do
  [ -e "$path" ] && existing+=("$path")
done
[ "${#existing[@]}" -eq 0 ] && exit 0

# find -exec ... + never runs perl on an empty list, and the exit code is normalised to 1
# (GNU and BSD tools report a failed child differently).
if ! find "${existing[@]}" \
  \( -name node_modules -o -name dist -o -name .venv -o -name coverage -o -name .git \) -prune -o \
  -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.json' \
  -o -name '*.yaml' -o -name '*.yml' -o -name '*.md' -o -name '*.css' -o -name '*.html' \
  -o -name '*.py' -o -name '*.sh' -o -name '*.bats' -o -name '*.svg' -o -name '*.txt' \) \
  -exec perl -CSD -ne '
    BEGIN { $bad = 0 }
    if (/[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}]/) {
      print "$ARGV:$.: emoji or pictograph code point\n"; $bad = 1;
    }
    close ARGV if eof;
    END { exit $bad }
  ' {} +; then
  exit 1
fi
