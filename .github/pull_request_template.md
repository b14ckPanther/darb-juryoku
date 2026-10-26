## What

<one paragraph: what this phase or change delivers>

## Why

<link to the spec in docs/specs/ and the phase in docs/PLAN.md>

## How it was tested

- [ ] Web: `pnpm -r test`, `pnpm lint`, `pnpm typecheck`, `pnpm --filter web e2e`
- [ ] ML: `uv run --project ml pytest`, `ruff`, `mypy`
- [ ] Model gates (if a model changed): link to `eval/<name>/metrics.json`
- [ ] axe: zero serious or critical violations
- [ ] `pnpm check:emoji` passes

## Screens

<screenshots or a short clip for any UI change, with Nour's approval date>

## Checklist

- [ ] No hardcoded thresholds, labels or copy
- [ ] No frames or landmarks leave the device
- [ ] No secrets in the diff
- [ ] Docs and ledger updated
