# Third-party assets, models and datasets

Every asset not made in this repo is listed here with its licence (agent manual section 1.5).

| Asset | Where | Source | Licence | Notes |
|---|---|---|---|---|
| Zen Old Mincho | `brand/fonts/ZenOldMincho-*.ttf` | Google Fonts | SIL OFL 1.1 (`brand/fonts/OFL-ZenOldMincho.txt`) | Display face |
| Geist | `brand/fonts/Geist.ttf` | Vercel, via Google Fonts | SIL OFL 1.1 (`brand/fonts/OFL-Geist.txt`) | UI face |
| Font subsets | `apps/web/src/design/fonts/*.subset.woff2` | Made from the two fonts above by `apps/web/scripts/subset-fonts.sh` | SIL OFL 1.1 (as their sources) | Latin plus 重力; 71 KB in total |
| Lucide icons | `lucide-react` (npm) | Lucide contributors | ISC | The one icon set (ADR-030); stroke 1.75 everywhere |
| Posture glyphs | `apps/web/src/ui/glyphs.tsx` | Drawn in this repo on the Lucide grid | MIT (this repo) | Upright, slouch, head forward, lean |
| Nudge chime | `apps/web/public/audio/nudge-chime.wav` | Synthesised in this repo by `scripts/audio/make_chime.py` from `config/design/tokens.yaml` | MIT (this repo) | No samples used |
| Synthetic demo pose | `config/seed/demo/pose-fixture.yaml` | Drawn by hand in this repo | MIT (this repo) | Not a recording of a person |
| three.js | `three` (npm) | three.js authors | MIT | Overlay renderer, bloom |
| Motion | `motion` (npm) | Motion contributors | MIT | Springs, sheet and swipe gestures |
| Darb Juryoku mark and brand exports | `brand/` | Made in this repo | Not covered by MIT: the name, mark and renders identify this project and may not be reused as another product's brand | Approved brand set (ADR-030) |
| MediaPipe Pose Landmarker model | not yet added (Phase 4) | Google | Apache-2.0 | Self-hosted under the app origin |
