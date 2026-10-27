# Phase 3 spec: clickable prototype on seed data

Status: **Approved.** Decided under Nour's delegation (2026-10-26). Source: `docs/PLAN.md` Phase 3, `docs/UI_DESIGN.md` sections 2, 3 and 6, the Phase 1 product spec, and the Phase 2 design system (ADR-031, ADR-032).

## 1. What Phase 3 delivers

Every screen of UI_DESIGN section 2 runs end to end in demo mode on a synthetic sitter's three weeks, built on the Night Instrument design system without restyling it. No camera, pose model or storage yet: those are Phases 4 to 8. Outside demo mode the app is honest about that: it opens on Welcome, reports are empty, and screens that need the camera say the pipeline is not built yet and offer the demo.

## 2. Demo mode

- On with `?demo=1`, off with `?demo=0`; the choice is remembered per viewer. `vite --mode demo` makes it the build default (for the public demo, Phase 11).
- The seed loads with a dynamic import, only in demo mode. An E2E test checks that real mode never downloads it.
- The "Demo data" banner is on every screen in demo mode. On the phone it shows the label only; from 640 px it adds the sentence.
- Demo changes (delete a day, switch model, add a calibration, record) live in memory; a reload restores the seed.
- `?state=` previews the states that are hard to reach on purpose: `loading`, `error`, `empty` (every screen), `denied` and `missing` (Welcome), `absent` and `fallback` (Live), `unsupported` (Sentinel), `nogpu` (Model Lab). Demo mode only.

## 3. Seed data (config/seed/demo)

- `recipe.yaml`: the sitter's routine (sittings, afternoon drift by hour, the Friday drop, away spells, unwatched minutes, drift kinds). `pnpm --filter web seed` turns it, with a seeded generator, into `sessions.yaml` (one letter per minute per session, 21 days). A test fails if the committed file drifts from the recipe. The recipe seed was chosen so the last day shows the afternoon slump.
- `library.yaml`: three calibrations, two released models with confusion matrices and latency numbers, the heuristic's confusion matrix, five recordings' metadata, the release gates as spec section 9 sets them (until `ml/configs/gates.yaml` exists in Phase 6), and the live-mirror playback.
- Live mirror and sentinel animate from the Phase 2 synthetic pose fixture driven by the playback's match keys (a recorded-synthetic track, never a real person). Precision, recall, F1 and the gates are computed from the matrices, not stored.

## 4. Report engine (apps/web/src/report), reused for real data in Phase 8

Pure functions over minute buckets: good share (good over sitting, away and unwatched excluded), longest drift (a run broken by away, gaps or a new session), worst hour (with a minimum of sitting), daily summaries, the comparison with the previous N days that have sitting time, streaks (days off neither count nor break), the ribbon, the hour by weekday grid, afternoon drift share, and the observation (first rule in `config/report.yaml` whose conditions all hold).

## 5. Screens

| Screen | Route | Notes |
|---|---|---|
| Live mirror (home) | `/` | Golden outline playback, state word with glyph, session tally from the seed, Open sentinel, Pause (Space), End session with a confirm sheet and an ended state, calibration in use, demo nudge after continuous drift, away and model-fallback states |
| Today | `/today` | Hero share, observation, ribbon, four facts, empty state |
| Day report | `/history/YYYY-MM-DD` | Same report for a past day, slides in from History and back out |
| History | `/history` | Week and month, daily bars, hour by weekday heatmap (no-sitting cells outlined, not zero), streaks, swipe rows (export downloads the day's minutes as JSON; delete confirms in a sheet) |
| Calibrate | `/calibrate` | Frame guide, hold ring counting `calibration_hold_seconds`, confirm or redo, name sheet, saved calibrations to switch |
| Sentinel | `/sentinel` | True-size preview, opens the Document PiP window (P), unsupported fallback copy |
| Nudges | `/nudges` | Escalation ladder (glow, notification, chime), live example nudge, test notification, play the chime, limits from `config/nudges.yaml` |
| Welcome | `/welcome` (and `/` outside demo) | Promise, privacy diagram (camera, pose points, posture, minute totals), allow camera, denied and missing fixes |
| Dataset Studio | `/studio` | Guided protocol from `config/protocols/guided.yaml` (demo runs faster and says so), passive prompts, session metadata, recordings with swipe actions, export, clear |
| Model Lab | `/lab` | Model switcher (v3, v2, heuristic), macro F1, facts, release gates, confusion matrix, per-class table against the heuristic, latency benchmark (seed numbers, labelled), WebGPU-missing warning |
| Settings | `/settings` | Camera, calibrations, nudge style and quiet hours sheets, chime, sensitivity, sample rate, Darb Budokai (off; fields only when on; secrets masked), retention, export, tools, theme, delete all (confirm), leave demo |
| Demo banner | every screen | Section 2 |

Navigation: a sidebar on desktop (1024 px up), the four-tab bar of UI_DESIGN section 6 on the phone (Today, History, Live, Settings; Studio, Lab and Nudges are reached from Settings, Calibrate and Sentinel from Live). Page changes are view transitions: a fade between tabs, a slide into a day report and back. Shortcuts from `config/settings.yaml`: Space, C, P, `?`.

## 6. Config added

`config/copy/en.yaml` (every string; its TypeScript shape is generated by `pnpm --filter web copy:types` and drift-tested), `config/report.yaml`, `config/nudges.yaml`, `config/settings.yaml`, `config/protocols/guided.yaml`, each with a schema in `packages/schemas/config/`.

## 7. Out of scope

Camera and pose pipeline (Phase 4), storage in IndexedDB (Phase 8), real nudge engine (Phase 8), Darb Budokai sending (Phase 9). Settings changes are kept in memory until then.
