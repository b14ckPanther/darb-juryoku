# Progress ledger

The single source of "where are we". Update it in the same commit as the work it records. If this file and `git log` disagree, `git log` wins; fix this file first.

**Current phase:** 0, built and green, waiting for Nour's review and merge approval
**Current branch:** `phase/00-bootstrap` (local only: no remote, nothing pushed)
**Last task:** Phase 0 whole-branch review fixes; Phase 1 review sheet and a Phase 2 design proposal prepared
**Blockers:** Nour: answer `docs/REVIEW_FOR_NOUR.md`, confirm the Phase 0 rulings below, approve merging `phase/00-bootstrap` into `main`, approve creating the GitHub repo
**Next step:** Phase 1 (confirm the spec with Nour)

## Phases

| Phase | Name | Weight | Status | Branch | Commit range | Tests | Skills used | Nour approval |
|---|---|---|---|---|---|---|---|---|
| 0 | Repo bootstrap, CI, conventions | 5% | review (awaiting Nour) | `phase/00-bootstrap` | `8684454..HEAD` | web 9/9, e2e 3/3, schemas 2/2, ml 5/5, bats 18/18 | superpowers:test-driven-development, superpowers:requesting-code-review, superpowers:verification-before-completion, frontend-design (Phase 2 proposal) | pending |
| 1 | Confirm the spec with Nour | 3% | todo | `phase/01-spec` | | | | |
| 2 | Design system | 8% | todo | `phase/02-design-system` | | | | |
| 3 | Clickable prototype on seed data | 12% | todo | `phase/03-prototype` | | | | |
| 4 | Live pose pipeline and heuristic | 10% | todo | `phase/04-pose-pipeline` | | | | |
| 5 | Dataset Studio and versioned dataset | 8% | todo | `phase/05-dataset` | | | | |
| 6 | Training pipeline and evaluation | 14% | todo | `phase/06-training` | | | | |
| 7 | ONNX export, quantization, in-browser inference | 10% | todo | `phase/07-onnx-web` | | | | |
| 8 | Nudges, sessions, report, sentinel (real data) | 10% | todo | `phase/08-daily-loop` | | | | |
| 9 | Darb Budokai adapter (optional) | 5% | todo | `phase/09-budokai-adapter` | | | | |
| 10 | Hardening | 7% | todo | `phase/10-hardening` | | | | |
| 11 | Docs, demo GIF, public launch | 8% | todo | `phase/11-launch` | | | | |

Overall: **0%** (5% once Nour approves Phase 0)

Status values: `todo`, `in progress`, `blocked`, `review`, `done`.

## Task log

One row per finished task. Newest at the bottom.

| Date | Phase | Task | Status | Commits | Test result | Skills used | Notes |
|---|---|---|---|---|---|---|---|
| 2026-10-26 | 0 | Init repo in place, identity, planning package on `main` | done | `c9065ae` | n/a |  | Branch `phase/00-bootstrap` created from it |
| 2026-10-26 | 0 | commit-msg hook, agent settings, .gitignore | done | `8684454` | bats 9/9 | superpowers:test-driven-development | Hook verified live: it blocked a probe commit |
| 2026-10-26 | 0 | Web scaffold (Vite 7, React 19, Tailwind 4), App smoke | done | `3b20106` | web 2/2 | superpowers:test-driven-development | Brand tokens and self-hosted fonts |
| 2026-10-26 | 0 | app.yaml, JSON Schema, Ajv loader, schemas:check | done | `1e6d3d2` | web 8/8, schemas 2/2 | superpowers:test-driven-development | schemas:check watched failing on a bad config |
| 2026-10-26 | 0 | ml uv project, pg_ml.config, dvc init | done | `799b37e` | ml 5/5 | superpowers:test-driven-development | jsonschema + Pydantic on the shared schema |
| 2026-10-26 | 0 | check-emoji.sh, pnpm check:emoji | done | `f01bb4d` | bats 16/16 | superpowers:test-driven-development |  |
| 2026-10-26 | 0 | Playwright smoke: COOP/COEP, name, no off-origin request | done | `778ce0c` | e2e 2/2 | superpowers:test-driven-development |  |
| 2026-10-26 | 0 | CI, PR template, .env.example, LICENSE, ASSETS.md | done | `5edfddc` | check:all green, actionlint clean |  | mypy root command fixed (strict was silently off) |
| 2026-10-26 | 0 | Review fixes: emoji script on Linux, hook scissors line | done | `db3a8d7` | bats 18/18 on macOS and Ubuntu 24.04 | superpowers:requesting-code-review | GNU xargs returned 123, CI would have been red |
| 2026-10-26 | 0 | Review fixes: axe scan, title from config, narrower fs.allow | done | `66b3378` | web 9/9, e2e 3/3 | superpowers:test-driven-development | axe watched failing on a missing lang |
| 2026-10-26 | 0 | Review fixes: DVC as ml dev dependency, dvc status in CI | done | `3a54540` | ml 5/5 |  |  |
| 2026-10-26 | 0 | Ledger, README, plan record, Phase 1 review sheet, Phase 2 proposal | done | this commit | check:all green | frontend-design, superpowers:verification-before-completion | Proposal is not approved |

Test result format: `web 48/48, ml 31/31` or the failing count with a link to the ruling.

## Model releases

| Date | Model version | Data version | Experiment | Macro F1 | Slouch recall | vs heuristic | p95 latency (WebGPU / WASM) | Size (INT8) | Gates |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

## Data collection log

| Date | Sessions added | Minutes | Protocols | Conditions | Data version |
|---|---|---|---|---|---|
| | | | | | |

## Screen approvals (Phases 2, 3, 8)

| Date | Screen | Version or commit | Nour's verdict | Changes requested |
|---|---|---|---|---|
| | | | | |

## Rulings

Decisions an agent made because Nour had not. Each one is the cheapest reversible option. High cost-if-wrong means stop and ask instead.

| Date | Phase | Ruling | Why | Cost if wrong | Confirmed by Nour? |
|---|---|---|---|---|---|
| 2026-10-26 | 0 | Initialised git in place in `darb-juryoku/` and committed the planning package and brand to a local `main` | Phase branches need a base; nothing is pushed | Low: local history only | proposed, confirm with Nour |
| 2026-10-26 | 0 | bats-core via Homebrew; DVC via `uv tool install dvc` and as an ml dev dependency | Plan wants bats and DVC; neither was installed; no sudo | Low | proposed, confirm with Nour |
| 2026-10-26 | 0 | Kept Vite 7 (plan) with `@vitejs/plugin-react` 5, because plugin 6 requires Vite 8 | Follow the plan's version | Low: one-line upgrade | proposed, confirm with Nour |
| 2026-10-26 | 0 | Phase 0 shell bundles the full Zen Old Mincho SemiBold (5.5 MB); Phase 2 subsets it | Uses the approved font now without inventing a subset | Low | proposed, confirm with Nour |
| 2026-10-26 | 0 | Local Playwright browsers live in `~/Library/Caches/ms-playwright-alt` (set `PLAYWRIGHT_BROWSERS_PATH`) | A stale install from another session holds the default cache lock; I did not kill a process I do not own | Low: CI unaffected | proposed, confirm with Nour |
| 2026-10-26 | 0 | mypy runs as `mypy --config-file ml/pyproject.toml ml/src`; agent manual section 5 updated | From the repo root mypy ignored the strict config | Low | proposed, confirm with Nour |
| 2026-10-26 | 0 | App name lives in `config/app.yaml` until `config/copy/en.yaml` exists (Phase 3) | Phase 0 asks for the name from config | Low | proposed, confirm with Nour |
| 2026-10-26 | 0 | Ajv compiles validators at runtime, which needs `unsafe-eval`; switch to Ajv standalone validators generated at build time before the strict CSP lands (Phase 7 or 10) | Review finding 5; no CSP exists yet | Medium-low: CSP would block app start if forgotten | proposed, confirm with Nour |
| 2026-10-26 | 0 | Config types are written by hand in TS, Pydantic and the schema; generate TS types from schemas when the next config files arrive (Phase 3 or 4) | Review finding 9; one small file today | Low | proposed, confirm with Nour |
| 2026-10-26 | 0 | Phase 0 has no separate spec; `docs/plans/2026-10-26-phase-00-bootstrap.md` records the plan as executed | PLAN.md fully specifies Phase 0 and it decides nothing for Nour | Low | proposed, confirm with Nour |
| 2026-10-26 | 0 | Node 26 locally, CI pins Node 24 (`engines: >=24`) | Node 24 LTS target per ADR-026 | Low | proposed, confirm with Nour |
| 2026-10-26 | 0 | `LICENSE` is MIT as a proposal | Open question 20 | Low: replace the file | proposed, confirm with Nour |
| 2026-10-26 | 0 | `check:emoji` also scans `ml/tests`, `scripts` and the root markdown files | Stricter than the manual's list, still passes | Low | proposed, confirm with Nour |
