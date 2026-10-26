# Progress ledger

The single source of "where are we". Update it in the same commit as the work it records. If this file and `git log` disagree, `git log` wins; fix this file first.

**Current phase:** none (planning package only)
**Current branch:** none (repo not created yet)
**Last task:** none
**Blockers:** none
**Next step:** start Phase 0 (see `docs/PLAN.md`)

## Phases

| Phase | Name | Weight | Status | Branch | Commit range | Tests | Skills used | Nour approval |
|---|---|---|---|---|---|---|---|---|
| 0 | Repo bootstrap, CI, conventions | 5% | todo | `phase/00-bootstrap` | | | | |
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

Overall: **0%**

Status values: `todo`, `in progress`, `blocked`, `review`, `done`.

## Task log

One row per finished task. Newest at the bottom.

| Date | Phase | Task | Status | Commits | Test result | Skills used | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

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
| | | | | | |
