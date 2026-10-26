#!/usr/bin/env bats
# Tests for scripts/check-emoji.sh: fails on emoji code points, passes on clean text.

setup() {
  SCRIPT="$BATS_TEST_DIRNAME/../../scripts/check-emoji.sh"
  DIR="$BATS_TEST_TMPDIR/tree"
  mkdir -p "$DIR/src"
}

@test "passes on a clean tree" {
  printf 'export const label = "Sit straight";\n' > "$DIR/src/a.ts"
  run bash "$SCRIPT" "$DIR"
  [ "$status" -eq 0 ]
}

@test "fails on an emoji and reports file and line" {
  printf 'line one\nconst x = "great \xf0\x9f\x8e\x89";\n' > "$DIR/src/b.ts"
  run bash "$SCRIPT" "$DIR"
  [ "$status" -eq 1 ]
  [[ "$output" == *"b.ts:2"* ]]
}

@test "fails on a dingbat check mark in markdown" {
  printf '# Done \xe2\x9c\x85\n' > "$DIR/notes.md"
  run bash "$SCRIPT" "$DIR"
  [ "$status" -eq 1 ]
}

@test "fails on a variation selector" {
  printf 'title: "Star\xef\xb8\x8f"\n' > "$DIR/copy.yaml"
  run bash "$SCRIPT" "$DIR"
  [ "$status" -eq 1 ]
}

@test "allows Japanese text and arrows" {
  printf 'brand: "\xe9\x87\x8d\xe5\x8a\x9b" and a -> \xe2\x86\x92 arrow\n' > "$DIR/brand.md"
  run bash "$SCRIPT" "$DIR"
  [ "$status" -eq 0 ]
}

@test "skips node_modules" {
  mkdir -p "$DIR/node_modules/pkg"
  printf 'x = "\xf0\x9f\x9a\x80"\n' > "$DIR/node_modules/pkg/index.js"
  run bash "$SCRIPT" "$DIR"
  [ "$status" -eq 0 ]
}

@test "ignores missing paths" {
  run bash "$SCRIPT" "$DIR" "$BATS_TEST_TMPDIR/does-not-exist"
  [ "$status" -eq 0 ]
}
