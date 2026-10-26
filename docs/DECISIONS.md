# Decisions (ADR log)

Format: one entry per decision. Status is **Fixed** (from Nour's roadmap or hard rules), **Proposed** (confirm with Nour in Phase 1), **Accepted** (confirmed), or **Superseded**. Phase 1 turns every Proposed entry into Accepted or replaces it.

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
Status: Proposed, confirm with Nour in Phase 1.
The app is fully client-side with workers, WASM and camera; there is nothing to server-render. Vite gives simpler worker and WASM handling and header control for COOP/COEP. Cost if wrong: low (React components port to Next.js).

## ADR-014 Classifier input is landmark windows, relative to calibration
Status: Proposed, confirm with Nour in Phase 1.
Features from upper-body landmarks expressed as deltas from Nour's calibrated ideal. Small model, fast, privacy-safe, generalises across camera positions.

## ADR-015 Classes: upright, slouch, forward_head, lean_side; absent is a rule
Status: Proposed, confirm with Nour in Phase 1.

## ADR-016 Model family chosen by experiment (heuristic, logistic, MLP, TCN, GRU)
Status: Proposed, confirm with Nour in Phase 1.
TCN expected to win; the decision follows the eval report.

## ADR-017 DVC 3 + DVCLive for dataset versioning and experiments (not MLflow)
Status: Proposed, confirm with Nour in Phase 1.
One tool for data, pipeline stages, params and experiment comparison, all in git. MLflow would add a server. Cost if wrong: low (DVCLive can log to MLflow later).

## ADR-018 Python 3.12 with uv
Status: Proposed, confirm with Nour in Phase 1.
3.12 has the widest wheel support across torch, onnxruntime and mediapipe. Move to 3.13 when all wheels are confirmed.

## ADR-019 Split by session; test set includes passive real-work sessions
Status: Proposed, confirm with Nour in Phase 1.
Frame-level splits leak near-identical frames into test and inflate metrics.

## ADR-020 Release gates
Status: Proposed, confirm with Nour in Phase 1.
Macro F1 >= 0.85, slouch recall >= 0.85, beats heuristic by >= 0.05 macro F1, INT8 within 0.01 of FP32, ONNX parity max abs diff <= 1e-4. Values in `ml/configs/gates.yaml`.

## ADR-021 Storage: IndexedDB via Dexie 4
Status: Proposed, confirm with Nour in Phase 1.

## ADR-022 Overlay rendering with three.js (WebGL2), 2D canvas fallback
Status: Proposed, confirm with Nour in Phase 1.
Gives bloom, line materials and a tested renderer; lets the three.js skills apply. Raw WebGL2 would be smaller but slower to build well.

## ADR-023 Document Picture-in-Picture as the "while you code" surface
Status: Proposed, confirm with Nour in Phase 1.
Avoids hidden-tab throttling in Chrome and Edge. Firefox and Safari get a degraded mode with honest `unknown` minutes. A Tauri wrapper is deferred.

## ADR-024 Hosting: static free tier with COOP/COEP headers
Status: Proposed, confirm with Nour in Phase 1.
Vercel or Cloudflare Pages (both can set headers). GitHub Pages cannot set COOP/COEP without a service-worker shim.

## ADR-025 Darb Budokai event: `posture.session.recorded` v1, aggregates only, HMAC signed from the browser
Status: Proposed (mirrors Darb Budokai's proposed contract), confirm with Nour in Phase 1.
The secret is entered at runtime and kept as a non-extractable CryptoKey on Nour's device.

## ADR-026 Package managers: pnpm 10 workspaces, Node 24 LTS
Status: Proposed, confirm with Nour in Phase 1.
