# Phase 1 product spec: Darb Juryoku v1

Status: **Approved.** Decided under Nour's delegation (2026-10-26). Nour wrote: "the review must be up to u ... i trust ur recommendation... any choice by u will be approved from my side". The delegation covers product, spec and design choices and local merges. It does not cover outward actions (creating the GitHub repo, pushing, deploying, DNS, spending, publishing data). Those still wait for Nour's yes.

Nour can veto any line below. Each section names the question it answers (`Q1` to `Q20` from `docs/OPEN_QUESTIONS.md`) and the ADR it settles.

## 1. What it is

An on-device webcam posture coach. While Nour codes, a small always-on-top window (the sentinel) watches their neck and shoulders, compares them to the posture Nour calibrated as their own good posture, and warns them gently when they drift. At the end of the day it gives an honest report. The classifier is a PyTorch model Nour trains on landmark recordings of their own posture, evaluated on held-out sessions and shipped to the browser as ONNX.

Two audiences, in this order:

1. **Nour, every working day.** If it nags, drains the battery or breaks when the tab is hidden, it is dead (VISION anti-goals).
2. **A recruiter or hiring manager with 30 seconds.** They need to see the golden outline, then proof that the ML is real (session-split evaluation, confusion matrix, model against heuristic, measured latency), then the privacy story.

## 2. Assumed setup and budgets (Q1)

Nour has not described their desk, so these are assumptions, all of them in config and all cheap to change:

- One MacBook, built-in camera, 2 to 4 hour sittings. An external camera or a second screen is handled by choosing the camera in Settings and calibrating once per camera position (several calibrations are already in the design).
- Sampling at 5 Hz (`config/app.yaml`).
- Budgets: whole app under 10% of one CPU core at 5 Hz; overlay under 2 ms GPU per frame; no audible fan.

## 3. Classes (Q4, Q8, ADR-015)

`upright`, `slouch`, `forward_head`, `lean_side`. `absent` (nobody in frame, or landmarks below visibility) is a rule in the session engine, not a class. Lean left and lean right are recorded as separate protocols and labelled `lean_side`; the side is kept in the recording metadata so it can be split later without re-recording.

Why four: forward head and slouching are the two habits most coders have and the two a front camera can tell apart (head drops and grows against shoulders sinking). Four classes are learnable from two weeks of one person's data. Merging `forward_head` into `slouch` would lose the most common coding habit.

## 4. Nudge behaviour (Q2)

Silent by default. Escalation, all timings in `config/nudges.yaml`:

1. **Glow.** As soon as the smoothed state leaves `upright`, the sentinel's gold glow fades and the deviating outline segment warms toward amber. Never red, never shaking.
2. **Notification.** After 4 minutes of continuous drift, one system notification with plain copy, for example "Shoulders forward for 4 minutes. Roll them back?" Two actions: "Sitting up" and "Snooze 15 min". The UI_DESIGN draft had three (Done, Snooze, Not now); "Not now" overlapped with snooze, "Done" did not say what was done, and Chrome shows at most two notification actions on most platforms. Ignoring the notification counts as "not now".
3. **Chime.** Off by default. An original chime made with `procedural-sfx` plays with the notification only when Nour switches it on.

Cooldown after any nudge (default 20 minutes), quiet hours, and at most one visible nudge at a time. Nudges are never modal and never block the sentinel.

## 5. Report content (Q3)

**Today:** one hero number (share of sitting time in good posture), the day as a timeline ribbon of minute buckets coloured by state, three facts in a grouped list (longest drift, worst hour, against the 7-day average), and one plain sentence from rules in `config/report.yaml`. **History:** week and month views with daily good-share bars, an hour by weekday heatmap and streaks; tapping a day opens its report.

Charts follow the `dataviz` skill: one palette, tabular numbers, direct labels, a data table toggle for screen readers, state never shown by colour alone.

## 6. The phone (Q13), changed from the review sheet

The review sheet said "installable PWA on the phone; data stays on the laptop unless you export it". That hides a contradiction: with no backend and no sync (VISION non-goals), the phone app would open to an empty report every evening. Fixed as follows:

- The PWA is installable and fully designed for the phone (Today, History, Settings). This is also where the SwiftUI-grade feel is shown off in the demo.
- Real data reaches the phone only by a **handoff Nour starts**: on the laptop, "Send to phone" exports the aggregates (minute buckets and session totals, never landmarks or frames) as one small file through the share sheet (AirDrop on Apple devices); the phone imports it. A QR-code handoff is a stretch goal, not a v1 promise.
- Built in Phase 8 with the real-data report. Weight unchanged; it replaces a hidden gap, not adds a feature.

## 7. Running while coding (Q12, ADR-023)

Document Picture-in-Picture in Chrome and Edge. Firefox and Safari get a degraded mode that counts hidden-tab time as `unknown` minutes and says so. A Tauri wrapper is considered only if PiP fails Nour in Phase 8; the desktop icon already exists in `brand/exports/icons/`.

## 8. Data collection plan (Q6, ADR-019)

The review sheet proposed "20 minutes on 6 days", which gives about 6 guided sessions, far short of the 30-session target. Corrected:

- **Guided:** one protocol run is about 5 minutes (upright, natural slouch, forward head, lean left, lean right, 60 s each). Four runs a sitting, about 20 minutes, on **8 days** across the two weeks: 32 guided sessions, about 2.7 hours.
- **Passive:** 2 real work sessions a week (4 in total, about 1 hour each) with a "how are you sitting right now?" prompt at most 3 times an hour. About 4 hours.
- **Coverage:** morning, afternoon and evening light; two chairs; two camera positions. Logged in `docs/PROGRESS.md` "Data collection log".
- **Target:** at least 30 sessions and 6 hours, of which at least 2 hours passive. The passive sessions are mostly test data, because they are the real use case.
- **Never synthesized.** Recording needs Nour at the camera. The agent plans sessions with Nour and never invents data and presents it as real.

## 9. Release gates (Q16, ADR-020)

Measured on the session-split test set, values in `ml/configs/gates.yaml`:

| Gate | Value |
|---|---|
| Macro F1 | >= 0.85 |
| Slouch recall | >= 0.85 |
| Beats the heuristic | by >= 0.05 macro F1 |
| INT8 against FP32 | within 0.01 macro F1 |
| ONNX parity | max abs diff <= 1e-4 |
| **p95 classifier latency (new)** | **<= 8 ms on WASM** on Nour's laptop; WebGPU reported |
| **p95 pose + classifier step (new)** | **<= 60 ms**, so 5 Hz keeps more than 60% headroom |

The two latency gates are new. The review sheet left them out, yet Phase 7's definition of done refers to "the Phase 1 target" and VISION asks for single-digit milliseconds. The eval report also shows the metrics on the passive subset alone, because those labels are noisier; the gate applies to the whole test set. If a gate is not met, the report says so; gates are never loosened to pass.

## 10. Art direction (Q5, Q9)

A calm instrument, not a game. The approved brand already fixes the type (Zen Old Mincho, Geist) and the palette (night, forest, gold, ivory), so the three candidates in UI_DESIGN section 4 cannot keep their own fonts and colours. Phase 2 therefore shows three **brand-faithful** variants side by side and picks one:

- **A. Night Instrument** (the old Gilded Instrument on the brand).
- **B. Ivory Ledger** (Kintsugi Paper on the brand: ivory paper, gold seams, drift in soft grey).
- **C. Night Monitor** (Studio Monitor on the brand: framing marks and a mono data voice set in Geist's tabular figures, no third font).

Both a dark and a light theme ship (WCAG requires both to pass). The pick decides which one leads and which details carry over.

## 11. Icons (Q10)

**Lucide**, bundled through `lucide-react` (ISC licence) and tree-shaken. Its even 1.5 to 2 px strokes match the line-drawn mark and read like SF Symbols at regular weight, which suits the native feel. Solar's duotone reads playful next to the instrument look. The four posture glyphs (upright, slouch, forward head, lean) are custom SVG in the same stroke style.

## 12. Dataset privacy (Q14)

The raw dataset stays private: landmarks of one body over weeks are still personal. Published with the repo: aggregate statistics (sessions, minutes, class balance, conditions), the evaluation report, the model card and the dataset card. The pipeline's **labelled synthetic fixture** (already needed for the CI smoke train) is public, so anyone can run the pipeline end to end from a clean clone. It is named and documented as synthetic and is never used for reported metrics.

## 13. DVC remote (Q15, ADR-017)

A local folder outside the repo (suggested `~/darb-juryoku-dvc`), mirrored to an external drive when convenient. The path is set in `.dvc/config.local` (git-ignored), never in the committed config, so the repo does not carry Nour's home folder layout. Moving to a private bucket later is one `dvc remote add` away.

## 14. The public demo (Q7, Q17, Q18, ADR-024)

- **What a recruiter sees first (README):** a two-line summary, the golden-outline GIF, a link to the live demo, then the model against heuristic table and the confusion matrix, then latency numbers and the privacy line.
- **Hosting:** Vercel free tier, chosen over Cloudflare Pages because the COOP/COEP headers are one `vercel.json` and the repo's deploy skills (`deploy-to-vercel`, `vercel-optimize`) target it. Cloudflare Pages remains a drop-in alternative (a `_headers` file). Cost $0. The custom domain (suggested `juryoku.zangeel.dev`, matching the Darb project name) is set at launch with Nour, because DNS and deploys are outward actions.
- **Visitors:** demo mode by default (seed data, the "Demo data" banner). An optional "Try it on yourself" path runs calibration and the live mirror on the visitor's own camera, stores nothing, and labels the model honestly as trained on one person.

## 15. Darb Budokai (Q19, ADR-025)

Opt-in, off by default for everyone including Nour. Only aggregate minutes leave the device, and only when switched on.

## 16. Stack and licence (Q11, Q20, ADR-013, ADR-026)

- Vite 7, React 19, TypeScript, Tailwind 4 (already scaffolded). The app is fully client-side with workers and WASM, so there is nothing to server-render.
- pnpm 11 (the version the repo already pins; ADR-026 said 10) and Node 24 LTS.
- Repo name `darb-juryoku`. Code under MIT. The Darb Juryoku name, mark and brand renders in `brand/` are not licensed for reuse as someone else's brand; this is stated in `ASSETS.md` and the README. Fonts keep their SIL OFL licences.

## 17. Out of scope for v1

Medical advice, accounts, a backend, cloud sync, a mobile camera mode, full-body tracking, training on visitors' data.

## 18. What is left to the builder

Exact copy wording (Phase 3 with `design:ux-copy`), spring values beyond the brand's (Phase 2 tokens), chart details (Phase 3), model family (chosen by experiment in Phase 6, ADR-016).
