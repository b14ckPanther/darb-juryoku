# Phase 3 plan: clickable prototype on seed data

Source: `docs/PLAN.md` Phase 3 and `docs/specs/2026-10-27-phase-03-prototype.md`. The tasks below are the plan as executed. Decided under Nour's delegation (2026-10-26).

| # | Task (PLAN order) | Test written first | Commit |
|---|---|---|---|
| 1 | Seed loader: demo mode loads the seed, real mode never does; seeded generator for 21 days | `data/source.test.ts`, `demo/generate-sessions.test.ts` (afternoon slump, Friday drop), `demo/sessions-file.test.ts` (drift) | `0ec9c8f` |
| 2 | Report engine on seed: good share, longest drift, worst hour, 7-day comparison, streaks, ribbon, heatmap, observation rules | `report/engine.test.ts`, `report/day-report.test.ts` | `0ec9c8f`, `2e7a761` |
| 2b | Copy, report, nudge, settings and protocol config with schemas; generated copy type | `config/parse-config.test.ts`, `config/runtime.test.ts`, `copy/*.test.ts`, `packages/schemas` | `0ec9c8f` and later |
| 3 | Screens in PLAN order: Live, Today, Calibrate, Sentinel, Nudge, History, Settings, Welcome, Studio, Model Lab, demo banner | `screens/screens.test.tsx` (one or more per screen), `lab/metrics.test.ts`, `live/*.test.ts`, `app/data.test.ts` | `2fff932` and later |
| 4 | Navigation and view transitions; one test per shortcut | `app/routes.test.ts`, `app/shortcuts.test.ts`, `app/App.test.tsx` | `2fff932` |
| 5 | Mobile pass at 360, 390 and 430 px | `e2e/prototype.spec.ts` (tab bar, no sideways scroll, 44 px targets, sheets) | this phase's last commits |
| 6 | E2E click-through of every screen in demo mode with axe, both themes | `e2e/prototype.spec.ts` | this phase's last commits |
| 7 | Screenshots of every screen and state, phone and desktop, both themes | `pnpm --filter web screens` into `docs/screens/phase-03/` | this phase's last commits |
