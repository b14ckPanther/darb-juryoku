#!/usr/bin/env bash
# Subsets the approved brand fonts (brand/fonts) to the characters the app uses and writes WOFF2
# files to apps/web/src/design/fonts. Zen Old Mincho is a 5.5 MB CJK font; the app needs Latin
# text plus the two kanji of the name (重力). Needs uv (fonttools and brotli are fetched on demand).
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
out="$root/apps/web/src/design/fonts"
mkdir -p "$out"

# Basic Latin, Latin-1, general punctuation, arrows, minus and the name in kanji.
unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2193,U+2212,U+91CD,U+529B"

subset() {
  uv run --quiet --with fonttools --with brotli pyftsubset "$1" \
    --unicodes="$unicodes" --layout-features='*' --flavor=woff2 \
    --output-file="$out/$2"
}

subset "$root/brand/fonts/ZenOldMincho-SemiBold.ttf" ZenOldMincho-SemiBold.subset.woff2
subset "$root/brand/fonts/ZenOldMincho-Regular.ttf" ZenOldMincho-Regular.subset.woff2
subset "$root/brand/fonts/Geist.ttf" Geist.subset.woff2
ls -l "$out"
