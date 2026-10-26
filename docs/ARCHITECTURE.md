# Architecture

Status: MediaPipe, PyTorch, ONNX Runtime Web, on-device inference and "no cloud" come from Nour's roadmap. Everything else here (feature set, classes, model family, sample rate, storage layout, DVC, tooling) is **proposed, confirm with Nour in Phase 1**.

## 1. Shape in one paragraph

A static web app (Vite + React) opens the webcam. A **pose worker** runs MediaPipe `PoseLandmarker` on sampled frames and returns upper-body landmarks. A **feature module** turns landmarks into a small posture feature vector relative to Nour's calibrated ideal pose. A **classifier worker** runs Nour's trained ONNX model with ONNX Runtime Web over a sliding window of feature vectors and returns class probabilities. A **session engine** smooths those into a posture state with hysteresis, the **nudge engine** decides whether to nudge, and the **overlay renderer** draws the golden ideal outline and the glow over the live video. Minute-level aggregates go to IndexedDB, which feeds the **daily report**. An optional **Darb Budokai adapter** sends one aggregate event per session. Separately, a Python **training pipeline** (uv, PyTorch, DVC) turns landmark recordings exported from the app into a versioned dataset, trains and evaluates models, and exports the approved one to ONNX for the app.

## 2. Diagram

```
 ┌──────────────────────────────── Browser (Nour's laptop) ─────────────────────────────────┐
 │                                                                                          │
 │  getUserMedia ──► <video> ──frames──► Pose worker (MediaPipe PoseLandmarker, GPU→CPU)     │
 │      (never leaves this box)                │ 33 landmarks + seg mask, every 1/sample_hz   │
 │                                             ▼                                            │
 │                                Feature module (TS, config/features.yaml)                 │
 │                                 relative to calibration ──► window buffer (N frames)     │
 │                                             │                                            │
 │                                             ▼                                            │
 │                          Classifier worker (onnxruntime-web, WebGPU | WASM)              │
 │                                 model: /models/posture-<ver>.onnx                        │
 │                                             │ p(class)                                   │
 │                                             ▼                                            │
 │   Overlay renderer ◄── state ── Session engine (EMA + hysteresis) ──► Nudge engine       │
 │   (three.js: gold outline,             │                              (Notification,     │
 │    mask glow) in main view             │ minute buckets               chime, PiP glow)   │
 │    and Document PiP window             ▼                                                 │
 │                               IndexedDB (Dexie): sessions, minutes, settings,            │
 │                               calibrations, recordings (landmarks only), outbox          │
 │                                        │                     │                           │
 │                         Daily report / History        Dataset Studio export (.jsonl)     │
 │                                        │                     │ (manual download)         │
 │                     Darb Budokai adapter (opt-in, aggregates only)  │                           │
 └────────────────────────────────────────┼─────────────────────┼───────────────────────────┘
                                          │ HTTPS + HMAC        ▼
                                          ▼             ┌───────────────── ml/ (Python) ───────┐
                              Darb Budokai ingest API          │ data/raw (DVC) ─► prepare ─► features │
                              (later, optional)         │ ─► split (by session) ─► train (PyTorch, MPS)
                                                        │ ─► evaluate (P/R, F1, confusion, vs heuristic)
                                                        │ ─► export ONNX ─► quantize ─► parity test │
                                                        │ ─► release to apps/web/public/models     │
                                                        └──────────────────────────────────────────┘
```

## 3. Components (web app)

| Component | Where | Responsibility |
|---|---|---|
| Camera service | main thread, `apps/web/src/camera/` | `getUserMedia` (resolution from config, 640x480 proposed), device picker, permission states, pause/resume, "camera in use" indicator. |
| Pose worker | Web Worker, `src/workers/pose.worker.ts` | MediaPipe Tasks Vision `PoseLandmarker` in `VIDEO` mode, model `pose_landmarker_lite.task` (full model selectable in config), `outputSegmentationMasks: true` for the glow, GPU delegate with CPU fallback. Receives `ImageBitmap` frames via `postMessage` transfer. Falls back to the main thread if `OffscreenCanvas` WebGL is unavailable. |
| Feature module | shared TS, `src/posture/features.ts` | Pure functions: landmarks + calibration → feature vector. Feature list and normalisation in `config/features.yaml`. A Python twin in `ml/src/pg_ml/features.py` must give identical output (golden-fixture parity test). |
| Classifier worker | Web Worker, `src/workers/classifier.worker.ts` | `onnxruntime-web` `InferenceSession` with `executionProviders` from config (`["webgpu","wasm"]` proposed). Input `[1, window, features]`, output class logits. Reports per-inference latency. |
| Heuristic baseline | `src/posture/heuristic.ts` | Angle thresholds from `config/heuristic.yaml`. Used before a model exists, as fallback if the model fails to load, and as the evaluation baseline. |
| Session engine | `src/posture/session.ts` | EMA over probabilities, hysteresis (enter-bad and exit-bad thresholds, minimum dwell seconds), `absent` state from landmark visibility. Emits state changes and per-minute buckets. Pure and clock-injected for tests. |
| Nudge engine | `src/nudge/` | Rules in `config/nudges.yaml`: bad for X seconds, cooldown, quiet hours, max per hour, escalation steps (glow, then chime, then system notification). Copy from `config/copy/en.yaml`. |
| Overlay renderer | `src/overlay/` | three.js `WebGLRenderer` with an orthographic camera over the video: smoothed spline outline of the calibrated ideal pose, mask-edge glow shader, match-strength uniform. 2D canvas fallback when WebGL2 is unavailable. |
| PiP sentinel | `src/pip/` | Document Picture-in-Picture window (Chrome/Edge 116+) with a small live view and the outline, so it keeps running and stays visible while Nour codes. Fallback: a compact pinned tab with audio-only nudges. |
| Report engine | `src/report/` | Aggregates minute buckets into daily and weekly stats (good %, longest bad streak, worst hour, trend). Wording rules in `config/report.yaml`. |
| Dataset Studio | `src/studio/` | Guided recording protocols (`config/protocols/*.yaml`) and passive recording with experience-sampling prompts. Stores landmarks, timestamps, labels and session metadata, **never frames**. Exports `.jsonl` + `manifest.json`. |
| Model Lab | `src/lab/` | Shows the active model card, eval report JSON from `/models/<ver>/eval.json`, and runs the in-browser latency benchmark. |
| Darb Budokai adapter | `src/budokai/` | Opt-in. Builds `posture.session.recorded` v1 CloudEvents from session aggregates, signs with WebCrypto HMAC-SHA256, IndexedDB outbox with retry and backoff from config. See `INTEGRATION.md`. |

### Frame data flow (one sample)

1. A timer driven by `video.requestVideoFrameCallback` takes one frame every `1/sample_hz` seconds (5 Hz proposed) as an `ImageBitmap`.
2. The bitmap is transferred to the pose worker, which returns landmarks, visibility and a low-resolution mask. The bitmap is closed. Nothing is stored.
3. The feature module computes the vector, pushes it into the window ring buffer.
4. Every `classify_every` samples, the classifier worker returns probabilities and latency.
5. The session engine updates state; the overlay renders at display rate using the latest landmarks and mask; the nudge engine evaluates rules.
6. Once per minute the session engine writes a minute bucket to IndexedDB.

## 4. The posture model

### Inputs (proposed)

Upper-body MediaPipe landmarks only (nose, eyes, ears, mouth corners, shoulders, elbows; indices 0 to 14), because hips are usually hidden by the desk. Features, defined in `config/features.yaml`:

- head-forward ratio: horizontal ear-to-shoulder offset divided by shoulder width;
- neck tilt: angle of the ear-midpoint to shoulder-midpoint line against vertical;
- shoulder roll: shoulder line angle against horizontal;
- lean distance: shoulder width relative to calibrated width (leaning toward the screen);
- head drop: nose height above the shoulder line relative to calibration;
- shoulder hunch: ear-to-shoulder vertical distance relative to calibration;
- visibility mean of the used landmarks;
- each of the above as a **delta from Nour's calibrated ideal pose**, so the model learns "worse than your own upright" and transfers better across camera positions.

### Classes (proposed)

`upright`, `slouch`, `forward_head`, `lean_side`. `absent` (no person or low visibility) is a rule in the session engine, not a model class.

### Model candidates (compared in Phase 6 experiments)

| Candidate | Shape | Why |
|---|---|---|
| Heuristic | thresholds | Baseline every model must beat. |
| Logistic regression (scikit-learn) | per-frame | Simple learned baseline. |
| MLP (PyTorch) | per-frame, 2 hidden layers | Smallest neural model. |
| TCN (PyTorch) | window of N frames, 1D dilated convs | Uses motion over ~2 seconds; expected best. |
| GRU (PyTorch) | window of N frames | Alternative temporal model. |

The winner is chosen by macro F1 on the test set, then by latency. All candidates and hyperparameters live in `params.yaml`.

### Evaluation (every model)

- Per-class precision, recall, F1, macro F1, confusion matrix (counts and normalised), ROC-AUC per class, calibration plot (reliability diagram), all versus the heuristic on the same test set.
- **Split by session**, never by frame: whole sessions go to train, validation or test (`GroupShuffleSplit` on `session_id`). The test set includes passive real-work sessions, not only staged ones.
- **Leave-one-condition-out** check: train without, say, evening-light sessions, test on them (conditions from session metadata).
- **On-device latency**: p50/p95/p99 of classifier inference and of the full pose + classifier step, for WebGPU and WASM, measured by Model Lab's benchmark on Nour's laptop, committed as `eval/latency/<model>-<device>-<date>.json`.
- **Model size** on disk for FP32, FP16 and INT8.
- Metric gates in `ml/configs/gates.yaml` (proposed: macro F1 at least 0.85, `slouch` recall at least 0.85, beats heuristic macro F1 by at least 0.05, INT8 macro F1 within 0.01 of FP32). A model that fails a gate is not released.

## 5. Running while Nour codes

Hidden tabs throttle timers and `requestAnimationFrame`. Plan:

1. **Document Picture-in-Picture** (`documentPictureInPicture.requestWindow`) opens a small always-on-top window with the live view; the page is then not considered hidden. This is the primary "while you code" surface.
2. Sampling uses `requestVideoFrameCallback` plus a worker-side timer, not `requestAnimationFrame`.
3. Fallback when PiP is unavailable (Firefox, Safari): the app warns that background accuracy drops, keeps sampling at the reduced rate the browser allows, and records gaps as `unknown` minutes rather than inventing data.
4. A desktop wrapper (Tauri 2) is an open question for after launch, not in this plan.

## 6. Storage

IndexedDB through Dexie 4, schema versioned with Dexie migrations:

| Table | Content |
|---|---|
| `settings` | user settings (sensitivity, nudge style, quiet hours, sample rate override, Darb Budokai opt-in and key reference) |
| `calibrations` | ideal-pose landmarks and feature means, camera label, created at |
| `sessions` | id, started, ended, model version, device label |
| `minutes` | session id, minute start, good/bad/absent/unknown seconds, dominant class |
| `recordings` | Dataset Studio: session metadata + landmark frames + labels (exported, then optionally cleared) |
| `outbox` | pending Darb Budokai events with attempt count and next retry |

Retention (days) for minutes and recordings comes from config. Settings has "Delete all my data", which clears every table after a confirmation sheet.

Why IndexedDB: no server is allowed, the data is small (a year of minute buckets is a few MB), and it works offline.

## 7. Training pipeline (`ml/`)

Python 3.12, managed with **uv**. Package `pg_ml` in `ml/src/pg_ml/`.

### Dataset

- Dataset Studio exports `recording-<sessionId>.jsonl` (one landmark frame per line: `t`, `landmarks[15][x,y,z,visibility]`, `label`, `label_source: protocol|prompt|manual`) and `manifest.json` (session metadata: protocol, camera, lighting, chair, time of day, calibration id). Both validated against `packages/schemas/dataset/`.
- Raw exports go to `data/raw/`, tracked with **DVC 3** (`dvc add data/raw`). The DVC remote is a local folder outside the repo or an external drive (proposed). Nothing about the dataset is pushed anywhere public unless Nour decides to publish it (open question).
- Each dataset version is a git tag `data-vN` pointing at the `.dvc` file, with a `data/CHANGELOG.md` entry (sessions added, label fixes).
- Target for v1 (proposed): at least 30 sessions and 6 hours, across morning, afternoon and evening light, two chairs, two camera positions, and at least 2 hours of passive real-work sessions labelled by prompts.

### Pipeline stages (`dvc.yaml`)

```
prepare   data/raw            -> data/interim/frames.parquet      (validate, clean, resample to sample_hz)
features  frames.parquet      -> data/processed/windows.npz       (Python twin of config/features.yaml)
split     windows.npz         -> data/processed/split.json        (group split by session_id, seed from params)
train     windows + split     -> models/<name>/model.pt           (PyTorch, device mps|cpu, DVCLive logging)
evaluate  model + test split  -> eval/<name>/metrics.json, plots/ (P/R/F1, confusion, vs heuristic)
export    model.pt            -> models/<name>/model.onnx         (torch.onnx.export, opset from params, dynamic batch)
quantize  model.onnx          -> model.int8.onnx, model.fp16.onnx (onnxruntime.quantization, onnxconverter-common)
parity    all onnx variants   -> eval/<name>/parity.json          (onnxruntime vs PyTorch, max abs diff gate)
```

Libraries: `torch` 2.8+, `numpy`, `pandas` + `pyarrow`, `scikit-learn` 1.7 (metrics, splits, logistic baseline), `onnx`, `onnxruntime` 1.22+, `onnxconverter-common`, `dvc` 3, `dvclive` 3, `pydantic` 2 (config models), `typer` (CLI), `matplotlib` (plots). Dev: `pytest`, `hypothesis`, `ruff`, `mypy`.

### Experiments

`dvc exp run` with `-S` overrides; DVCLive logs per-epoch loss and metrics. `dvc exp show` and `dvc plots diff` compare runs. The chosen experiment is promoted with `dvc exp apply` + a commit, and gets a model card at `models/<name>/MODEL_CARD.md` (data version, params, metrics, limits, intended use).

### Release to the app

`pg_ml.release` copies the gated ONNX variant, a `model.json` (version, classes, window, feature list hash, input name, eval summary) and `eval.json` into `apps/web/public/models/<version>/`. The app reads the active version from `config/model.yaml`. The feature-list hash must match the app's `config/features.yaml` hash or the app refuses to load the model.

## 8. Config, not code

| File | Holds |
|---|---|
| `config/app.yaml` | sample rate, camera resolution, classify-every, window length, retention days |
| `config/features.yaml` | feature definitions, landmark indices, normalisation; hashed for model compatibility |
| `config/heuristic.yaml` | baseline thresholds |
| `config/session.yaml` | EMA alpha, hysteresis thresholds, dwell seconds, absent visibility threshold |
| `config/nudges.yaml` | nudge rules, cooldowns, escalation, quiet hours default |
| `config/report.yaml` | report sections and wording rules |
| `config/copy/en.yaml` | every user-facing string |
| `config/protocols/*.yaml` | Dataset Studio recording protocols |
| `config/model.yaml` | active model version and execution providers |
| `config/budokai.yaml` | event type, schema URI, retry and backoff, batch size |
| `config/seed/demo/*.json` | demo sessions and minutes (demo mode only) |
| `params.yaml` | training hyperparameters, split seed, model family |
| `ml/configs/gates.yaml` | release metric gates |

Every config file has a JSON Schema in `packages/schemas/config/`. Config is bundled at build time as JSON and also loadable from `/config/*.json` at runtime so it can change without a rebuild (proposed). User-adjustable values (sensitivity, quiet hours) override config from IndexedDB.

## 9. Testing strategy

| Level | Tool | What |
|---|---|---|
| Unit (TS) | Vitest 3 | features, heuristic, session engine (fake clock), nudge rules, report aggregation, CloudEvent builder, HMAC signing (WebCrypto in Node 24), config schema validation |
| Feature parity | Vitest + pytest | Python generates golden `features.golden.json` from fixture landmarks; Vitest asserts the TS output matches within 1e-6. |
| Model parity | pytest + Vitest | PyTorch vs `onnxruntime` (Python) max abs diff below gate; then `onnxruntime-web` (WASM backend in Node) on the same fixture inputs matches the Python outputs. |
| Component | Vitest + Testing Library | screens on seed data, keyboard paths |
| E2E | Playwright | Chromium with `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=fixtures/sit.y4m` (a short clip of a mannequin or a synthetic render, not a real person); calibrate, detect, nudge, report; axe scan on every screen |
| Privacy | Playwright | intercepts all requests during a 60-second live session; fails on any non-origin request and on any request body larger than the Darb Budokai aggregate |
| ML unit | pytest + hypothesis | schema validation, resampling, feature properties (rotation/scale invariance where intended), split has no session overlap, model output shapes, loss decreases and a tiny batch overfits (smoke) |
| Pipeline smoke | pytest | `dvc repro` on `ml/tests/fixtures/mini-dataset/` with 2 epochs on CPU, under 60 s in CI |
| Metric gates | pytest | reads `eval/<name>/metrics.json`, asserts gates from `gates.yaml` (run on release, not on fixture data) |
| Visual | Playwright screenshots | overlay states (no match, near, match) on fixed landmark fixtures, with `threejs-visual-validation` |

CI: GitHub Actions, two jobs: `web` (pnpm, Node 24) and `ml` (uv, Python 3.12, CPU torch). No job uses a camera, a GPU or the network beyond package installs.

## 10. Local dev setup

Requirements: macOS with Chrome or Edge (for WebGPU and Document PiP), Node 24 LTS, pnpm 10, Python 3.12, uv, DVC (installed through uv), git.

```bash
pnpm install
uv sync --project ml
dvc pull                       # after a DVC remote exists
pnpm --filter web dev          # Vite serves with COOP/COEP so WASM threads work
```

Vite dev and the production host both send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` so ONNX Runtime Web can use multi-threaded WASM (`SharedArrayBuffer`). MediaPipe WASM, `.task` and ORT WASM files are copied into `public/` by a postinstall script so no CDN is used.

## 11. Security and privacy

- CSP: `default-src 'self'; connect-src 'self' <budokai-ingest-url-if-set>; img-src 'self' blob: data:; media-src 'self' blob:; worker-src 'self' blob:; script-src 'self' 'wasm-unsafe-eval'`.
- No analytics, no error-reporting SaaS. Errors go to a local in-app log the user can export.
- The Darb Budokai HMAC secret is stored as a non-extractable WebCrypto `CryptoKey` in IndexedDB once imported.
- `security-review` skill runs on Phases 7, 9 and 10.
