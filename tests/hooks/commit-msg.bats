#!/usr/bin/env bats
# Tests for .githooks/commit-msg: it must reject attribution text and emoji.

setup() {
  HOOK="$BATS_TEST_DIRNAME/../../.githooks/commit-msg"
  MSG="$BATS_TEST_TMPDIR/COMMIT_EDITMSG"
}

write_msg() { printf '%b' "$1" > "$MSG"; }

@test "accepts a plain honest message" {
  write_msg "Add config loader\n\nValidate app.yaml at startup.\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 0 ]
}

@test "rejects a co-authored trailer" {
  write_msg "Add config loader\n\nCo-Authored-By: Someone <x@example.com>\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 1 ]
}

@test "rejects a tool name in any case" {
  write_msg "Update CLAUDE.md rules\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 1 ]
}

@test "rejects the vendor name" {
  write_msg "Tidy docs\n\nThanks anthropic\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 1 ]
}

@test "rejects a generated-with line" {
  write_msg "Tidy docs\n\nGenerated with some tool\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 1 ]
}

@test "rejects an emoji in the subject" {
  write_msg "Add loader \xf0\x9f\x9a\x80\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 1 ]
}

@test "rejects a dingbat symbol" {
  write_msg "Fix tests \xe2\x9c\x85\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 1 ]
}

@test "ignores git comment lines" {
  write_msg "Add loader\n# Please enter the commit message. Co-Authored-By\n"
  run "$HOOK" "$MSG"
  [ "$status" -eq 0 ]
}

@test "prints a readable reason on rejection" {
  write_msg "Tidy\n\nCo-authored-by: x\n"
  run "$HOOK" "$MSG"
  [[ "$output" == *"attribution"* ]]
}
