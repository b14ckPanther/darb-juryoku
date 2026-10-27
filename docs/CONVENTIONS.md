# Conventions

Accepted in Phase 1 (decided under Nour's delegation, 2026-10-26). Phase 0 encodes these in config files (ESLint, Prettier, ruff, mypy, EditorConfig) so they are enforced, not remembered.

## 1. Project layout

```
darb-juryoku/
├── .claude/settings.json        agent settings (attribution off)
├── .githooks/commit-msg         rejects attribution text and emoji
├── .github/
│   ├── workflows/ci.yml         jobs: web, ml, schemas, emoji
│   └── pull_request_template.md
├── apps/web/
│   ├── public/models/<ver>/     released ONNX + model.json + eval.json
│   ├── public/vendor/           self-hosted MediaPipe and ORT WASM (copied at install)
│   ├── src/
│   │   ├── app/                 routes, layout, providers
│   │   ├── camera/  workers/  posture/  overlay/  pip/  nudge/  report/
│   │   ├── studio/  lab/  settings/  budokai/
│   │   ├── design/              tokens, primitives, components
│   │   ├── config/              loader + typed config (generated types from schemas)
│   │   └── storage/             Dexie database and repositories
│   ├── e2e/                     Playwright specs and fake-camera fixtures
│   └── vite.config.ts
├── packages/schemas/
│   ├── config/                  JSON Schemas for config/*.yaml
│   ├── dataset/                 recording + manifest schemas
│   └── events/posture.session.recorded/v1.schema.json (+ examples)
├── config/                      runtime YAML (see ARCHITECTURE §8), seed/demo/
├── ml/
│   ├── pyproject.toml           uv project
│   ├── src/pg_ml/               data, features, models, train, evaluate, export, quantize, release, cli
│   ├── configs/gates.yaml
│   └── tests/                   unit, smoke, fixtures/mini-dataset/
├── data/                        raw/ interim/ processed/ (DVC; contents git-ignored) + CHANGELOG.md
├── models/<name>/               model.pt, *.onnx (DVC) + MODEL_CARD.md (git)
├── eval/                        metrics, plots, parity, latency JSON (git)
├── dvc.yaml  params.yaml  dvc.lock
├── ASSETS.md  LICENSE  README.md  CLAUDE.md  AGENTS.md
└── docs/  specs/  plans/
```

## 2. TypeScript and React

- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`. No `any` without a comment explaining why.
- ESLint 9 flat config with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`. Prettier 3 for formatting.
- Function components, hooks, no class components. Follow `react-best-practices` and `composition-patterns`: compound components over prop explosions, state colocated, derived state not stored.
- State: React state and context for UI; Zustand 5 for the live session store (proposed). No global mutable singletons outside workers.
- Workers talk through typed messages (Comlink 4, proposed). Transfer `ImageBitmap`s, never copy them.
- Pure logic (features, session engine, nudge rules, report) has no DOM or React imports and takes an injected clock.
- Styling: Tailwind CSS 4 with tokens in `@theme`; no inline colour literals; no arbitrary values that bypass tokens except in the overlay shaders (which read tokens as uniforms).
- Files: `kebab-case.ts`, components `PascalCase.tsx`, tests next to code as `*.test.ts(x)`.
- User-facing strings only from `config/copy/en.yaml`. No emoji.

## 3. Python (`ml/`)

- Python 3.12, uv, `src/` layout, package `pg_ml`.
- ruff (lint + format, line length 100), mypy `--strict` on `src/`.
- Pydantic 2 models for every config file and dataset record. Typer for the CLI (`python -m pg_ml <command>`).
- Seeds from `params.yaml`; `torch.manual_seed`, `numpy` and Python `random` seeded in one helper. Deterministic algorithms on where supported.
- No notebooks in `src/`. Exploration notebooks, if any, go in `ml/notebooks/` and never hold logic the pipeline needs.
- Device selection `mps` then `cpu` from params, never hardcoded.

## 4. Testing conventions

- TDD: red, green, refactor. A test name states behaviour: `it("enters bad state only after dwell seconds")`, `test_split_has_no_session_overlap`.
- Vitest for TS unit and component tests; Testing Library queries by role and label.
- Playwright for E2E with the fake camera flags and `@axe-core/playwright` on every screen.
- pytest for Python; `hypothesis` for feature invariants; fixtures in `ml/tests/fixtures/`.
- Golden files (`*.golden.json`) are regenerated only by an explicit command and reviewed in the diff.
- No test touches the network beyond localhost fixture servers (MSW, `respx`).
- No real person's video in fixtures. Fake-camera clips are synthetic renders or a mannequin.

## 5. Commits

- Imperative, plain English, first line under 72 characters, optional body for the why.
  - Good: `Add hysteresis to posture state changes`
  - Good: `Export TCN to ONNX with dynamic batch axis`
  - Bad: `feat: stuff`, `WIP`, `fixes`
- One logical change per commit. Many small commits are the goal.
- **No AI attribution of any kind.** No `Co-Authored-By`, no "Generated with", no tool names. Never write the word "claude" in a commit message (the push check greps for it).
- No emoji in commit messages.
- Author and committer: `Nour Alden Mousa <nmcryptoinvest@gmail.com>`.
- The `commit-msg` hook rejects `co-authored|claude|anthropic|generated with` and emoji code points.

## 6. Branches

- `main`: protected in spirit; only Nour approves merges.
- One branch per phase: `phase/NN-short-name` (two-digit phase number).
- Short-lived sub-branches for risky experiments: `phase/06-training--gru-trial`, merged back into the phase branch or deleted (ask before deleting).
- Model experiments live as DVC experiments, not branches.

## 7. Pull request template

`.github/pull_request_template.md`:

```markdown
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
```

The template contains no attribution line, and PR bodies never get one added.
