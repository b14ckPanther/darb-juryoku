# Decisions (ADR log)

Format: one entry per decision. Status is **Fixed** (from Nour's roadmap or hard rules), **Proposed** (confirm with Nour in Phase 1), **Accepted** (confirmed), or **Superseded**. Phase 1 closed on 2026-10-26: every Proposed entry was decided under Nour's delegation (Nour: "any choice by u will be approved from my side"). Outward actions (repo creation, push, deploy, DNS, spending) are not covered and still need Nour's yes. Phase 1 turns every Proposed entry into Accepted or replaces it.

---

## ADR-001 Product: webcam posture coach with a self-trained model
Status: Fixed (roadmap).
Darb Juryoku runs while Nour codes; pose estimation tracks neck and shoulders; a small model trained on Nour's own good and bad posture decides when they are slouching; gentle nudge and daily report.

## ADR-002 Stack: PyTorch, MediaPipe, ONNX Runtime Web
Status: Fixed (roadmap, Deep Learning + Computer Vision stack).
MediaPipe for pose landmarks, PyTorch for training, ONNX export and ONNX Runtime Web for in-browser inference.

## ADR-003 On-device inference, no cloud
Status: Fixed (roadmap and Nour's brief).
All inference runs in the browser. No backend, no cloud API. Hosting is a static free tier. Expected cost $0/month.

## ADR-004 Privacy: frames never leave the device
Status: Fixed (Nour's brief).
Frames are never sent or stored. Datasets hold landmarks and labels only. Self-hosted model and WASM files. Enforced by a Playwright network test and CSP.
Consequence: an image-based CNN fine-tuned on webcam crops is ruled out, because it would need stored frames.

## ADR-005 Signature: golden ideal outline and body glow; Darb Budokai stamina
Status: Fixed (roadmap).

## ADR-006 UI first
Status: Fixed (hard rule 3). Phase 2 design system, Phase 3 clickable prototype approved screen by screen, before engine or ML work.

## ADR-007 No hardcoded data
Status: Fixed (hard rule 2). Config in `config/`, `params.yaml`, `ml/configs/`, validated by JSON Schema.

## ADR-008 No AI attribution; commits as Nour
Status: Fixed (hard rule 1). Commit-msg hook, agent settings with attribution off, push checks.

## ADR-009 TDD, no live services in CI
Status: Fixed (hard rule 7).

## ADR-010 Superpowers workflow and installed skills
Status: Fixed (hard rules 8 and 10). Skills mapped per phase in `PLAN.md` and recorded in the ledger.

## ADR-011 Native feel, one SVG icon set, no emoji
Status: Fixed (hard rule 11). SwiftUI-quality mobile behaviour; Solar or Lucide; `pnpm check:emoji` in CI.

## ADR-012 Training pipeline is Python with versioned datasets and experiments
Status: Fixed (Nour's brief for this package).

---

## ADR-013 Frontend: Vite 7 + React 19 + TypeScript + Tailwind 4 (not Next.js)
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
The app is fully client-side with workers, WASM and camera; there is nothing to server-render. Vite gives simpler worker and WASM handling and header control for COOP/COEP. Cost if wrong: low (React components port to Next.js).

## ADR-014 Classifier input is landmark windows, relative to calibration
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
Features from upper-body landmarks expressed as deltas from Nour's calibrated ideal. Small model, fast, privacy-safe, generalises across camera positions.

## ADR-015 Classes: upright, slouch, forward_head, lean_side; absent is a rule
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.

## ADR-016 Model family chosen by experiment (heuristic, logistic, MLP, TCN, GRU)
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
TCN expected to win; the decision follows the eval report.

## ADR-017 DVC 3 + DVCLive for dataset versioning and experiments (not MLflow)
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
One tool for data, pipeline stages, params and experiment comparison, all in git. MLflow would add a server. Cost if wrong: low (DVCLive can log to MLflow later).

## ADR-018 Python 3.12 with uv
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
3.12 has the widest wheel support across torch, onnxruntime and mediapipe. Move to 3.13 when all wheels are confirmed.

## ADR-019 Split by session; test set includes passive real-work sessions
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
Frame-level splits leak near-identical frames into test and inflate metrics.

## ADR-020 Release gates
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
Macro F1 >= 0.85, slouch recall >= 0.85, beats heuristic by >= 0.05 macro F1, INT8 within 0.01 of FP32, ONNX parity max abs diff <= 1e-4. Added in Phase 1: p95 classifier latency <= 8 ms on WASM, p95 pose + classifier step <= 60 ms, on Nour's laptop (Phase 7 needs a latency target; VISION asks for single-digit milliseconds). The eval report also shows the passive subset alone. Values in `ml/configs/gates.yaml`.

## ADR-021 Storage: IndexedDB via Dexie 4
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.

## ADR-022 Overlay rendering with three.js (WebGL2), 2D canvas fallback
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
Gives bloom, line materials and a tested renderer; lets the three.js skills apply. Raw WebGL2 would be smaller but slower to build well.

## ADR-023 Document Picture-in-Picture as the "while you code" surface
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
Avoids hidden-tab throttling in Chrome and Edge. Firefox and Safari get a degraded mode with honest `unknown` minutes. A Tauri wrapper is deferred.

## ADR-024 Hosting: static free tier with COOP/COEP headers
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
Vercel free tier (headers in `vercel.json`); Cloudflare Pages stays a drop-in alternative. GitHub Pages cannot set COOP/COEP without a service-worker shim. The deploy and the custom domain (suggested `juryoku.zangeel.dev`) are outward actions and wait for Nour in Phase 11.

## ADR-025 Darb Budokai event: `posture.session.recorded` v1, aggregates only, HMAC signed from the browser
Status: Accepted (mirrors Darb Budokai's proposed contract; revisit if that contract changes). Decided under Nour's delegation (2026-10-26). Opt-in, off by default.
The secret is entered at runtime and kept as a non-extractable CryptoKey on Nour's device.

## ADR-026 Package managers: pnpm workspaces, Node 24 LTS
Status: Accepted. Decided under Nour's delegation (2026-10-26); see `docs/specs/2026-10-26-phase-01-product-spec.md`.
pnpm 11, not 10: Phase 0 pinned `pnpm@11.24.0` in `package.json` and CI reads it from there. Recorded so the ADR matches the repo.

---

## ADR-027 Phase 0 tooling rulings
Status: Accepted. Decided under Nour's delegation (2026-10-26).
- Shell tests use **bats-core** (installed with Homebrew, no sudo); CI installs it with apt.
- **DVC 3** is an `ml` dev dependency (`uv run --project ml dvc ...`) and also installed with `uv tool install dvc` for convenience.
- **Vite 7** stays as planned, so `@vitejs/plugin-react` is pinned to 5 (version 6 needs Vite 8).
- Python type checks run as `mypy --config-file ml/pyproject.toml ml/src` so strict mode applies from the repo root.
- Runtime Ajv compilation is temporary; Ajv standalone validators replace it before the strict CSP lands.
Cost if wrong: low; each is a one-line change. Details and the rest of the Phase 0 rulings are in the ledger.

---

## ADR-028 Phone report gets data by a user-started aggregates handoff
Status: Accepted. Decided under Nour's delegation (2026-10-26).
With no backend and no sync, an installable phone PWA would show an empty report. On the laptop, "Send to phone" exports aggregates only (minute buckets, session totals; never landmarks or frames) as one file through the share sheet; the phone imports it. QR handoff is a stretch goal. Built in Phase 8. Cost if wrong: low.

## ADR-029 Art direction candidates are rebuilt on the approved brand
Status: Accepted. Decided under Nour's delegation (2026-10-26).
The approved brand fixes the fonts (Zen Old Mincho, Geist) and palette, so UI_DESIGN section 4's candidates are shown in Phase 2 as brand-faithful variants: Night Instrument, Ivory Ledger and Night Monitor. Both a dark and a light theme ship. Phase 2 records the pick in ADR-031.

## ADR-030 Icons: Lucide; dataset raw private; brand not under MIT
Status: Accepted. Decided under Nour's delegation (2026-10-26).
- Icons: Lucide via `lucide-react` (ISC), plus four custom posture glyphs in the same stroke style.
- Dataset: raw landmarks private; aggregates, eval report, model and dataset cards public; the labelled synthetic fixture is public and never used for reported metrics. DVC remote path lives in git-ignored `.dvc/config.local`.
- Licence: code MIT; the Darb Juryoku name, mark and brand renders are not licensed for reuse as another product's brand (stated in `ASSETS.md` and the README).

## ADR-031 Art direction: Night Instrument leads, Ivory as its light theme
Status: Accepted. Decided under Nour's delegation (2026-10-26).
Picked on `/design`, where the three brand-faithful directions run side by side on the same live mirror and Today data (screenshots in `docs/screenshots/phase-02/`).
- **Night Instrument** leads. It sits next to a dark code editor without glare, it is what the approved brand already is (night, forest, gold), and it keeps gold for one meaning: you, sitting well.
- **Ivory Ledger** becomes the light theme (phone in daylight, `prefers-color-scheme: light`), but drift stays amber in it instead of the ledger's grey, so a colour never changes meaning between themes. The grey variant stays only as the `ledger` direction on `/design`.
- **Night Monitor** is not picked as a whole: the grid reads technical and busy beside the calm brand. Its framing corner marks echo the camera frame in the mark, so the live mirror may keep them (decided per screen in Phase 3).
Rejected as defaults: an all-ivory app (glare beside an IDE at night) and the monitor look (busier, more generic developer styling).
Cost if wrong: low. Each direction is one token block in `config/design/tokens.yaml`.

## ADR-032 Design-system tokens and overlay rendering details
Status: Accepted. Decided under Nour's delegation (2026-10-26).
- Tokens live in `config/design/tokens.yaml` (schema-validated) and reference the brand palette by name; `apps/web/src/design/tokens.css` is generated and drift-tested.
- Drift amber is `#B8652B` on night and `#843E14` on ivory (the Phase 0 proposal's `#C9822F` was too close to gold: OKLab distance 9, now 17 and above, tested). Gold itself (`#D9A54C`) fails the dataviz validator's lightness band on night; accepted, because it is the approved brand colour and passes contrast.
- The overlay blooms from 0.4, not the brand render's 0.86: in linear light the gold rim peaks near 0.55 luminance, so 0.86 would never bloom. Bloom therefore appears only near a match.
- The overlay renders without tone mapping, so the backdrop and outline show the exact token colours in WebGL and in the 2D fallback alike (the contrast tests describe both); the exposure token scales only the rim. The whole-branch review found ACES had been shifting every colour.
- The overlay draws at most `glow.max_fps` (30) frames a second, rebuilds the scene only when the match or size changes, pauses off screen and in hidden tabs, and frees every GPU resource and its context on unmount.
- The overlay's warmth is on the calibrated outline, not on the body rim, as UI_DESIGN section 1 says; the rim only fades.
- The Impeccable detector flags Geist as an overused font. Kept: it is a pinned brand face.

## ADR-033 Phase 3 prototype rulings
Status: Accepted. Decided under Nour's delegation (2026-10-26). Spec: `docs/specs/2026-10-27-phase-03-prototype.md`.
- **Router:** a small history router of our own (`apps/web/src/app/router.tsx`) instead of a router library. Navigations run in React transitions tagged with a direction, and each page sits in React's `<ViewTransition>`: a fade between tabs, a slide into a day report and back, nothing under reduced motion. Cost if wrong: low; twelve routes.
- **Seed format:** YAML, not the JSON that ARCHITECTURE section 8 sketched, so the existing schema-per-config-file check covers every seed file. Minutes are generated from `recipe.yaml` by a seeded generator and committed as `sessions.yaml` with a drift test, like the tokens. Cost if wrong: low.
- **Demo playback:** the live mirror and sentinel play match keys over the Phase 2 synthetic pose fixture (a recorded-synthetic track) instead of a per-frame landmark file. The demo's nudge and its quiet spell use compressed seconds from the seed (`playback.nudge_after_seconds`), standing in for `config/nudges.yaml` minutes. Cost if wrong: low.
- **Copy type:** the TypeScript shape of `config/copy/en.yaml` is generated from the file (`pnpm --filter web copy:types`), so a missing string fails the typecheck; the schema checks it is a tree of non-empty strings. Closes the Phase 0 ruling about generated config types for copy; other config types stay hand-written.
- **Real mode before Phase 4:** opens on Welcome; camera screens say the pipeline is not built yet and offer the demo. "Allow camera" asks for the camera and releases it at once, only to show the granted, denied or missing state.
- **Phone tabs:** UI_DESIGN's four tabs (Today, History, Live, Settings). Dataset Studio, Model Lab and Nudges live under Settings on the phone; desktop has all of them in a sidebar.
- **Live mirror keeps the monitor's corner marks** (ADR-031 left this to Phase 3): they echo the camera frame in the mark and stay quiet.
- **Sentinel:** the overlay renders inside the PiP window using that window's document, frame clock and visibility, so it keeps drawing while the opener tab is hidden. Styles are copied into the window at open.
- **Toasts** announce from one live region that is always in the page (closes the Phase 2 minor about a toast mounting its own region).
- **Settings** are kept in memory until IndexedDB storage lands (Phase 8); defaults come from `config/settings.yaml` and `config/nudges.yaml`.
