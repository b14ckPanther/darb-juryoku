# Master plan: 0% to 100%

Twelve phases. Each is a shippable increment on its own branch, merged into `main` only with Nour's approval. Weights add up to 100%. Each phase starts with `superpowers:brainstorming` and a written spec, then `superpowers:writing-plans` expands the task list below into a detailed plan, then `superpowers:executing-plans`. Every phase ends with a whole-branch review (`superpowers:requesting-code-review`) and `superpowers:finishing-a-development-branch`.

Every phase also uses the process skills (`superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:executing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`, `superpowers:requesting-code-review`, `superpowers:receiving-code-review`, `superpowers:finishing-a-development-branch`, `code-review`, `simplify`). The "Skills:" line on each phase lists those **plus** the phase-specific ones.

| # | Phase | Weight | Cumulative |
|---|---|---|---|
| 0 | Repo bootstrap, CI, conventions | 5% | 5% |
| 1 | Confirm the spec with Nour | 3% | 8% |
| 2 | Design system | 8% | 16% |
| 3 | Clickable prototype on seed data | 12% | 28% |
| 4 | Live pose pipeline and heuristic | 10% | 38% |
| 5 | Dataset Studio and versioned dataset | 8% | 46% |
| 6 | Training pipeline and evaluation | 14% | 60% |
| 7 | ONNX export, quantization, in-browser inference | 10% | 70% |
| 8 | Nudges, sessions, report, sentinel on real data | 10% | 80% |
| 9 | Darb Budokai adapter (optional) | 5% | 85% |
| 10 | Hardening | 7% | 92% |
| 11 | Docs, demo GIF, public launch | 8% | 100% |

---

## Phase 0: Repo bootstrap, CI, conventions (5%)

**Branch:** `phase/00-bootstrap`
**Skills:** process skills, `superpowers:using-git-worktrees`, `react-best-practices`, `tailwindcss`, `run`.

**Goal:** an empty but real monorepo where every command in `CLAUDE.md` §5 works, CI is green, and no commit can carry attribution.

**Deliverables**
- `git init` in a new folder `darb-juryoku/` (this planning package is copied into it as the first commit), `git config user.name "Nour Alden Mousa"`, `git config user.email "nmcryptoinvest@gmail.com"`, `git config core.hooksPath .githooks`.
- `.claude/settings.json` with `"attribution": {"commit": "", "pr": ""}` and `"includeCoAuthoredBy": false`.
- `.githooks/commit-msg` rejecting `co-authored|claude|anthropic|generated with` and emoji.
- pnpm workspace with `apps/web` (Vite 7 + React 19 + TS + Tailwind 4 + Vitest 3 + Playwright) and `packages/schemas`.
- `ml/` uv project (Python 3.12, torch CPU/MPS, pytest, ruff, mypy), `dvc init`, empty `dvc.yaml` and `params.yaml`.
- `config/` with `app.yaml` and its schema; config loader in the app and in `pg_ml` with validation.
- `.env.example`, `.gitignore` (node_modules, dist, .venv, .env, data/**, !data/*.dvc, models/**/*.pt, models/**/*.onnx, .dvc/cache).
- `scripts/check-emoji.sh` and `pnpm check:emoji`.
- GitHub Actions `ci.yml` (jobs: web, ml, schemas, emoji) ready to run once the remote exists.
- `LICENSE` (MIT proposed), `ASSETS.md` stub.

**Tasks (TDD order)**
1. Write a test for the commit-msg hook (a shell test with `bats` or a small Node script) that feeds it an attributed message and expects rejection; implement the hook.
2. Scaffold `apps/web`; write a Vitest smoke test that renders `<App />` and finds the app name from config; make it pass.
3. Write a failing test for the config loader rejecting an invalid `app.yaml`; implement Ajv validation.
4. Scaffold `ml/`; write `test_config_loads` and `test_config_rejects_invalid`; implement with Pydantic.
5. Playwright smoke test that loads `/` and runs axe; make it pass.
6. Add `check-emoji.sh` with a test fixture containing an emoji; it must fail on the fixture and pass on the repo.
7. Write CI workflow; run every job's commands locally to prove them.
8. Fill README status and the ledger.

**Tests that prove it:** hook rejects attribution and emoji; web smoke + axe; config validation in TS and Python; `pytest` green; `dvc status` runs.

**Definition of done:** all commands in CLAUDE.md §5 that exist so far run green from a clean clone; push checks pass; Nour approved creating the GitHub repo (ask, do not assume) or the phase is merged locally only.

---

## Phase 1: Confirm the spec with Nour (3%)

**Branch:** `phase/01-spec`
**Skills:** process skills (led by `superpowers:brainstorming`), `writing-guidelines`, `design:ux-copy`.

**Goal:** every "proposed" item is accepted or replaced, and Nour has approved one written spec.

**Deliverables**
- Answers to every question in `docs/OPEN_QUESTIONS.md`, asked **one at a time**, open-ended first.
- `docs/specs/YYYY-MM-DD-phase-01-product-spec.md`: classes, screens, nudge behaviour, report content, data-collection plan and schedule, gates, hosting, Darb Budokai opt-in.
- `DECISIONS.md` updated: each Proposed ADR becomes Accepted or Superseded.
- `PLAN.md` adjusted if answers change scope (weights still sum to 100).

**Tasks**
1. Ask questions 1 to 7 (open-ended), one per message; summarise each answer back and confirm.
2. Ask questions 8 to 20.
3. Draft the spec; ask Nour to approve it section by section.
4. Update ADRs, PLAN and OPEN_QUESTIONS (mark answered).

**Tests that prove it:** none in code; the proof is Nour's written approval recorded in the ledger.

**Definition of done:** spec approved, no unanswered question that blocks Phases 2 to 6.

---

## Phase 2: Design system (8%)

**Branch:** `phase/02-design-system`
**Skills:** `frontend-design`, `impeccable:impeccable`, `design-taste-frontend`, `build-awwwards-quality-sites`, `design-first-ui-prompting`, `design:design-system`, `design:design-critique`, `design:accessibility-review`, `audit-reference-originality`, `animation-systems`, `threejs-choose-skills`, `threejs`, `threejs-web-design`, `threejs-bloom`, `threejs-exposure-color-grading`, `threejs-visual-validation`, `dataviz`, `procedural-sfx`, `solar-duotone-bold` (if Solar), `tailwindcss`.

**Goal:** Nour picks an art direction side by side and gets a token-driven component library with the golden outline prototype.

**Deliverables**
- A `/design` route showing the three art directions (UI_DESIGN §4) side by side on the Live mirror and Today screens using a fixed landmark fixture and a still image (a synthetic figure render, not a real person).
- After Nour picks: tokens (colour light/dark, type, spacing, radii, elevation, motion springs, glow parameters) in `apps/web/src/design/tokens.css` + Tailwind `@theme`, generated from `config/design/tokens.yaml` (proposed).
- Components from UI_DESIGN §5, each with states (default, hover, pressed, focus, disabled, loading), on a component gallery route.
- Overlay prototype: outline + glow + bloom on the fixture, with a slider for match strength, plus reduced-motion and 2D fallback variants.
- Mobile shell primitives: large-title header, tab bar, sheet with detents, grouped list with swipe actions.
- Icon set chosen and wired; `ASSETS.md` filled; original nudge chime generated with `procedural-sfx`.

**Tasks (TDD order)**
1. Test that tokens YAML validates and generates CSS variables; implement the generator.
2. Test contrast of every text/background token pair (WCAG AA) in Vitest; fix tokens until green.
3. Build the side-by-side `/design` route; get Nour's pick; record in ADR.
4. Components one by one, each with a Testing Library test for role, keyboard and states, then visual polish.
5. Sheet: tests for drag-to-dismiss threshold (from tokens) and keyboard close; implement with Motion springs.
6. Overlay prototype: Playwright screenshot tests at match 0, 0.5, 1 and reduced motion; `threejs-visual-validation`.
7. `design:design-critique` pass; fix findings.

**Tests that prove it:** token contrast test; component tests; overlay screenshot tests; axe on gallery; `check:emoji`.

**Definition of done:** Nour approved the direction and the component gallery (recorded); every component has reduced-motion behaviour and keyboard support.

---

## Phase 3: Clickable prototype on seed data (12%)

**Branch:** `phase/03-prototype`
**Skills:** `frontend-design`, `impeccable:impeccable`, `design-taste-frontend`, `ui-implementer`, `web-design-guidelines`, `design:ux-copy`, `design:design-critique`, `design:accessibility-review`, `design:design-handoff`, `animation-systems`, `react-view-transitions`, `threejs`, `threejs-visual-validation`, `dataviz`, `react-best-practices`, `composition-patterns`, `tailwindcss`, `playwright-cli`, `writing-guidelines`.

**Goal:** every screen in UI_DESIGN §2 works end to end in demo mode on realistic seed data, and Nour approves each screen.

**Deliverables**
- `config/seed/demo/`: 21 days of minute buckets, sessions, calibrations, two model cards with eval JSON and latency JSON, five recordings metadata. Realistic patterns (afternoon slump, Friday drop), clearly demo.
- Demo landmark playback: a recorded-synthetic landmark track (generated, not of a real person) drives the overlay so the Live mirror and Sentinel animate without a camera.
- All 11 screens routed, with empty, loading and error states.
- Copy in `config/copy/en.yaml`, reviewed with `design:ux-copy`.
- "Demo data" banner always visible in demo mode.

**Tasks (TDD order)**
1. Seed loader: test that demo mode loads seed and that non-demo mode never does; implement.
2. Report engine on seed: tests for good share, longest streak, worst hour, 7-day comparison (pure functions); implement. (This logic is reused for real data in Phase 8.)
3. Screens one at a time in this order: Live mirror, Today, Calibrate, Sentinel (PiP, with fallback), Nudge, History, Settings, Welcome, Dataset Studio, Model Lab, Demo banner. For each: component test, then build, then screenshot to Nour for approval.
4. Navigation and view transitions; keyboard shortcuts with a test per shortcut.
5. Mobile pass at 360, 390 and 430 px: tab bar, large titles, sheets, swipe actions.
6. Playwright E2E click-through of every screen in demo mode with axe.

**Tests that prove it:** report engine unit tests; component tests; E2E click-through with axe; screenshot set committed under `docs/screens/phase-03/`.

**Definition of done:** Nour approved every screen (one ledger row per screen); no hardcoded copy; reduced-motion verified.

---

## Phase 4: Live pose pipeline and heuristic (10%)

**Branch:** `phase/04-pose-pipeline`
**Skills:** `react-best-practices`, `performance-profiling`, `threejs`, `threejs-debugging`, `threejs-compatibility-fallbacks`, `playwright-cli`, `run`.

**Goal:** the real camera drives the real overlay; posture state comes from the heuristic baseline.

**Deliverables**
- Camera service with permission states and device picker.
- Self-hosted MediaPipe files; pose worker with GPU delegate and CPU fallback.
- Feature module in TS per `config/features.yaml`; Python twin in `pg_ml.features`; golden parity test.
- Calibration flow saving to IndexedDB.
- Heuristic classifier from `config/heuristic.yaml`; session engine with EMA and hysteresis.
- Live mirror and Sentinel on real data.

**Tasks (TDD order)**
1. Feature functions: hypothesis-style unit tests in Python first (scale invariance, symmetric lean sign), implement; generate golden JSON.
2. Vitest parity test against the golden file; implement TS features until it passes.
3. Heuristic: table-driven tests on fixture feature vectors; implement.
4. Session engine: fake-clock tests for EMA, enter/exit thresholds, dwell, absent; implement.
5. Pose worker: test the message protocol with a mocked landmarker; implement with MediaPipe.
6. Calibration: test median aggregation and storage; implement UI wiring.
7. Playwright with fake camera clip: calibrate, see state change; assert no non-origin requests.
8. Profile CPU and frame time; record numbers in the ledger.

**Tests that prove it:** feature parity; heuristic table; session engine; worker protocol; E2E with fake camera; privacy request test.

**Definition of done:** Nour uses it live for one coding session with the heuristic and approves the feel of the overlay on their real image.

---

## Phase 5: Dataset Studio and versioned dataset (8%)

**Branch:** `phase/05-dataset`
**Skills:** `react-best-practices`, `design:ux-copy`, `dataviz`, `run`.

**Goal:** Nour can record labelled landmark sessions and the first dataset version is under DVC.

**Deliverables**
- Dataset Studio: guided protocols from `config/protocols/*.yaml`, passive mode with experience-sampling prompts, metadata form, export of `.jsonl` + `manifest.json`.
- Recording and manifest JSON Schemas in `packages/schemas/dataset/`.
- `pg_ml.data` loader and validator; `prepare` DVC stage.
- DVC remote configured (Nour's choice from Phase 1); `data/raw` tracked; tag `data-v1`; `data/CHANGELOG.md`.
- Dataset report (`eval/data/data-v1.json` + plots): minutes per class, per condition, per session.
- Data collection sessions with Nour, scheduled with them, logged in the ledger.

**Tasks (TDD order)**
1. Schema tests: valid and invalid recording examples.
2. Recorder: tests that frames are never stored, only landmarks; protocol timer tests with fake clock; implement.
3. Export: test that output validates against the schema; implement.
4. Python loader: tests for validation errors, resampling to `sample_hz`, label sources; implement.
5. `prepare` stage on `ml/tests/fixtures/mini-dataset/`; `dvc repro prepare` test.
6. Dataset report with class balance; test on fixture.
7. Record with Nour until the Phase 1 target is met (may continue in parallel with Phase 6 setup).

**Tests that prove it:** schema tests; "no frames stored" test (inspect IndexedDB contents in Playwright); loader and prepare tests.

**Definition of done:** `data-v1` exists, meets the agreed size and condition targets, and its report is committed.

---

## Phase 6: Training pipeline and evaluation (14%)

**Branch:** `phase/06-training`
**Skills:** `dataviz`, `performance-profiling`, `run`, `superpowers:subagent-driven-development` (for parallel experiment write-ups, optional).

**Goal:** a reproducible PyTorch pipeline produces a model that beats the heuristic on a session-split test set, with a full evaluation report.

**Deliverables**
- DVC stages `features`, `split`, `train`, `evaluate` with params in `params.yaml`.
- Models: logistic regression, MLP, TCN, GRU in `pg_ml.models`; heuristic re-implemented in Python for evaluation.
- DVCLive logging; `dvc exp show` comparison table committed to `eval/experiments.md` (generated).
- Evaluation: per-class P/R/F1, macro F1, confusion matrix (counts and normalised), ROC-AUC, reliability diagram, leave-one-condition-out results, model vs heuristic, all as JSON + PNG/SVG under `eval/<name>/`.
- `MODEL_CARD.md` for the chosen model.
- Model Lab reads the real `eval.json`.

**Tasks (TDD order)**
1. Window builder: tests for shapes, stride, no cross-session windows; implement.
2. Split: test no session in two splits, stratification by class where possible, deterministic by seed; implement.
3. Each model: test output shape and that it overfits a tiny batch to near-zero loss in under N steps; implement.
4. Training loop: test that one epoch on the fixture decreases loss and writes DVCLive metrics; implement with early stopping on validation macro F1.
5. Metrics: test against hand-computed confusion matrix on a fixture; implement with scikit-learn.
6. Gates: test the gate checker with passing and failing metrics files; implement.
7. Run experiments on `data-v1` (MPS); compare; choose; write the model card. If no model beats the heuristic, stop and discuss with Nour (more data, new features, or class changes) instead of loosening gates.

**Tests that prove it:** all pipeline unit tests; smoke `dvc repro` on fixture data in CI; gates pass on the real eval.

**Definition of done:** chosen model passes all gates in `gates.yaml`; `dvc repro` from a clean clone (with `dvc pull`) reproduces the metrics within tolerance; Nour reviewed the confusion matrix.

---

## Phase 7: ONNX export, quantization, in-browser inference (10%)

**Branch:** `phase/07-onnx-web`
**Skills:** `performance-profiling`, `react-best-practices`, `playwright-cli`, `security-review`, `run`.

**Goal:** the trained model runs in the browser with ONNX Runtime Web, matches PyTorch, and its on-device latency is measured and committed.

**Deliverables**
- `export`, `quantize`, `parity` DVC stages: FP32, FP16 and INT8 (static quantization with a calibration subset of the training split) variants.
- `pg_ml.release` writing to `apps/web/public/models/<version>/` with `model.json` (classes, window, feature hash).
- Classifier worker with `onnxruntime-web`, execution providers from config, WebGPU then WASM fallback, multi-threaded WASM under COOP/COEP.
- Model Lab latency benchmark (p50/p95/p99, both providers, all variants) and export to `eval/latency/`.
- Model switcher (released models and heuristic).

**Tasks (TDD order)**
1. Export: test that the ONNX graph loads in `onnxruntime` and matches PyTorch within `1e-4`; implement.
2. Quantize: test that INT8 macro F1 is within the gate of FP32 on the test set; implement.
3. Release: test that a mismatched feature hash is refused by the app loader (Vitest); implement.
4. JS parity: Vitest runs `onnxruntime-web` (WASM in Node) on fixture inputs; outputs match Python's within tolerance.
5. Worker: protocol tests with a mocked session; implement with the real session.
6. Benchmark: test statistics functions; implement UI; run on Nour's laptop; commit results.
7. `security-review` on the worker, loader and CSP.

**Tests that prove it:** ONNX parity (Python and JS); quantization gate; feature-hash refusal; benchmark stats tests.

**Definition of done:** the app uses the trained model live; latency report committed; p95 classifier latency meets the Phase 1 target; Nour approved.

---

## Phase 8: Nudges, sessions, report, sentinel on real data (10%)

**Branch:** `phase/08-daily-loop`
**Skills:** `frontend-design`, `impeccable:impeccable`, `design:ux-copy`, `design:design-critique`, `animation-systems`, `optimize-web-animations`, `threejs-bloom`, `threejs-particles-trails-and-effects`, `threejs-visual-validation`, `dataviz`, `procedural-sfx`, `playwright-cli`, `run`.

**Goal:** the full daily loop works on real data: live session, PiP sentinel, gentle nudges, minute buckets, Today and History reports.

**Deliverables**
- Session lifecycle (start, pause, idle timeout, end, midnight split) writing minute buckets.
- Nudge engine per `config/nudges.yaml` with escalation, cooldowns, quiet hours, snooze; system notifications with permission flow.
- Signature polish on real video: match moment motes, drift warming, bloom tuned per art direction.
- Today and History on real data (Phase 3 engine reused), with retention.
- Two weeks of Nour's real use started; feedback logged.

**Tasks (TDD order)**
1. Session lifecycle: fake-clock tests for idle, pause, midnight split; implement.
2. Nudge rules: table tests for every rule and cooldown; implement.
3. Notification flow: tests with a mocked Notification API; implement.
4. Report on real buckets: reuse tests, add retention tests; wire.
5. Overlay polish with screenshot tests per state; reduced-motion variants.
6. Nour's first real week: collect their notes, adjust config (not code) where possible.

**Tests that prove it:** lifecycle and nudge unit tests; E2E: fake camera slouch clip triggers exactly one nudge within the configured time and none during cooldown.

**Definition of done:** Nour approves the nudge feel and the reports after at least five real working days.

---

## Phase 9: Darb Budokai adapter (optional) (5%)

**Branch:** `phase/09-budokai-adapter`
**Skills:** `security-review`, `react-best-practices`, `run`.

**Goal:** opt-in emission of `posture.session.recorded` v1 per `INTEGRATION.md`, with no dependency on Darb Budokai being up.

**Deliverables**
- Event schema + examples in `packages/schemas/events/`, contract test.
- Builder, HMAC signer, IndexedDB outbox, sender with retry/backoff, Settings UI (URL, key entry, test send, outbox status).
- A note sent to the Darb Budokai project about CORS and the producer key scope.

**Tasks (TDD order):** follow the six test groups in `INTEGRATION.md` §5 in order, each test first.

**Tests that prove it:** contract, builder, signature vector, sender state machine with MSW, privacy body check.

**Definition of done:** with integration off, nothing is ever sent (test); with it on and a fixture server, events arrive once each. Nour approved. Skippable if Nour defers Darb Budokai; its 5% then moves to Phase 10 (record the ruling).

---

## Phase 10: Hardening (7%)

**Branch:** `phase/10-hardening`
**Skills:** `security-review`, `design:accessibility-review`, `web-design-guidelines`, `optimize-web-animations`, `performance-profiling`, `threejs-compatibility-fallbacks`, `threejs-debugging`, `playwright-cli`, `simplify`.

**Goal:** it is robust, accessible, private and light enough to run all day.

**Deliverables**
- Performance: one-hour soak test (fake camera) with memory and CPU recorded; no leak (ImageBitmaps closed, tensors released).
- Fallbacks verified: no WebGPU, no WebGL2, no PiP, camera unplugged mid-session, model fails to load, IndexedDB quota exceeded.
- Accessibility: manual VoiceOver pass, keyboard-only pass, 200% zoom, reduced motion and reduced transparency.
- Security: CSP final, `security-review` findings fixed, dependency audit (`pnpm audit`, `uv pip` audit via `pip-audit`).
- PWA: manifest, offline shell, installable on phone for reports.
- Data: export and "Delete all my data" tested.

**Tasks (TDD order):** for each fallback and failure, write the E2E or unit test that reproduces it, then fix. Soak test script with thresholds from config.

**Tests that prove it:** fallback E2E suite; soak thresholds; axe; privacy test still green.

**Definition of done:** all hardening tests green; Nour used it for two full weeks (from Phase 8) and signs off.

---

## Phase 11: Docs, demo GIF, public launch (8%)

**Branch:** `phase/11-launch`
**Skills:** `writing-guidelines`, `design:ux-copy`, `build-awwwards-quality-sites`, `audit-reference-originality`, `dataviz`, `deploy-to-vercel` and `vercel-optimize` (if Vercel), `publish-project-to-github` (only after Nour approves going public), `security-review`.

**Goal:** a public repo and demo that a recruiter understands in 30 seconds.

**Deliverables**
- README: GIF of the golden outline and glow (recorded by Nour on their own image, their choice), one-paragraph pitch, the privacy story, the confusion matrix image, model vs heuristic table, latency table, architecture diagram, how to run, how to train, "AI workflow" section describing how Nour used agents and reviewed their code (no attribution lines in commits or PRs).
- Model card and dataset card linked; dataset published or not per Nour's Phase 1 answer.
- `/embed` route for Darb Kaioken (no storage, no Darb Budokai).
- Deployment to the chosen static host with COOP/COEP; custom domain if chosen.
- Final push checklist run and shown to Nour.

**Tasks**
1. Write README and cards; `writing-guidelines` pass.
2. Record GIF and screenshots with Nour.
3. Build `/embed` with a test that it never writes to IndexedDB.
4. Ask Nour: make the repo public? deploy? Only then run `publish-project-to-github` and the deploy.

**Tests that prove it:** full CI green; embed storage test; deployed site passes the privacy test against its real URL (run by Nour's approval).

**Definition of done:** Nour approved and the repo is public with no AI contributors visible on GitHub; README status says 100%.
