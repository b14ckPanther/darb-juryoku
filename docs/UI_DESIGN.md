# UI design

Status: the golden outline, the glow, the gentle nudge and the daily report come from Nour's roadmap. Screen list, art directions, motion values and layout details are **accepted in Phase 1** (decided under Nour's delegation, 2026-10-26; see `docs/specs/2026-10-26-phase-01-product-spec.md`); Phase 2 picks the art direction side by side and Phase 3 approves each screen.

Skills to load before any work in this file's scope: `frontend-design`, `impeccable:impeccable`, `design-taste-frontend`, `build-awwwards-quality-sites`, `design-first-ui-prompting`, `ui-implementer`, `web-design-guidelines`, `design:design-system`, `design:design-critique`, `design:accessibility-review`, `design:ux-copy`, `animation-systems`, `threejs-choose-skills` (then the three.js skills it routes to), `dataviz`, `solar-duotone-bold` if Solar icons are chosen.

## 1. Signature moment: the golden outline

**What Nour sees.** Their own webcam image, slightly desaturated and darkened so it reads as a backdrop. Over it, a thin, faint gold line traces the silhouette of their **ideal** posture: the head, neck and shoulder contour they recorded in calibration. It does not move with them; it stays where good posture would be. When they drift, the gap between their body and the line is visible at a glance. When they sit back into it, the edge of their silhouette lights up with a warm gold glow that blooms softly and settles. Good posture literally looks golden.

**How it is built.**

1. **Calibration** stores the ideal-pose landmarks and the segmentation mask contour from a 3-second hold (median per landmark).
2. **Outline:** a Catmull-Rom spline through head-top (estimated from eyes and ears), ears, neck sides, shoulders and upper arms, rendered in three.js as a screen-space line (`Line2` / `LineMaterial`, width from tokens) with a subtle animated dash shimmer at 0.6 opacity. The outline is re-anchored to the current camera framing with a similarity transform estimated from stable points (eyes) only when the camera moves, not when the body moves.
3. **Match strength** `m` in 0..1 comes from the classifier's `upright` probability, blended with the feature distance to calibration. Smoothed with a critically damped spring so it never flickers.
4. **Glow:** MediaPipe's segmentation mask is uploaded as a texture. A fragment shader computes the mask edge (gradient magnitude after a small blur) and paints a gold rim whose intensity is `m`. `UnrealBloomPass` (`threejs-bloom`) with threshold and strength from tokens gives the soft halo. Exposure and tone mapping per `threejs-exposure-color-grading` so the gold stays gold on both bright and dim webcams.
5. **Match moment:** when `m` crosses the "match" threshold (from config) after being below it for at least the dwell time, the outline briefly brightens and a few slow gold motes drift up from the shoulders (`threejs-particles-trails-and-effects`, capped at a small count). This is the stamina refill moment Darb Budokai will echo.
6. **Drift:** as `m` falls, the glow fades and the outline segments nearest the largest deviation (neck for forward head, shoulders for slouch) warm toward amber. Never red. No shaking, no alarms.
7. **Fallback:** without WebGL2, a 2D canvas draws the outline and an outer shadow glow; the meaning is identical.
8. **Reduced motion:** no shimmer, no motes, no bloom pulse. The outline is static and the glow changes as a short opacity cross-fade (150 ms).

The same overlay runs, scaled down, inside the Document Picture-in-Picture sentinel.

## 2. Screens and surfaces

Desktop is the primary live surface. Report, History and Settings are fully designed for the phone too (installable PWA).

| # | Screen | Purpose and content |
|---|---|---|
| 1 | **Welcome and privacy** | One sentence on what it does, one clear privacy statement ("Your camera image never leaves this device"), a diagram of what is stored (minutes, not pictures), then "Allow camera". Handles denied and no-camera states with a fix-it path. |
| 2 | **Calibrate** | Live mirror with a framing guide (head and shoulders in a soft vignette). Prompts: sit as you want to sit, hold for 3 seconds (ring countdown). Shows the captured outline for confirm or redo. Multiple calibrations per camera position. |
| 3 | **Live mirror** (home) | Full-bleed video with the golden outline and glow. A quiet status line (state, time in good posture this session), session controls (pause, end), "Open sentinel" (PiP) as the primary action. |
| 4 | **Sentinel** (Document PiP window) | About 240 x 180 px always-on-top window: mini mirror with outline and glow, a one-word state, pause button. Nudges show here first. |
| 5 | **Nudge** | Escalation from config: (a) PiP glow fades to amber and the outline segment pulses once; (b) soft original chime (`procedural-sfx`); (c) system notification with plain copy ("Shoulders forward for 4 minutes. Roll them back?"). Actions: "Sitting up" and "Snooze 15 min" (Phase 1 spec section 4). |
| 6 | **Today** (daily report) | Hero number (good-posture share of sitting time), a day timeline ribbon (minute buckets coloured by state), longest bad streak, worst hour, comparison to the 7-day average, one plain-language observation generated by `config/report.yaml` rules. |
| 7 | **History** | Week and month views: daily good-share bars, heatmap of hour x weekday, streaks. Tap a day to open its report. |
| 8 | **Dataset Studio** | Protocol picker (guided: upright 60 s, natural slouch 60 s, forward head 60 s, lean left/right), passive mode with prompt frequency, a live label indicator, session metadata form (lighting, chair, camera), list of recordings with size and duration, export and clear. Clear note: "Landmarks only. No images are recorded." |
| 9 | **Model Lab** | Active model card (version, data version, classes), per-class precision/recall table, confusion matrix heatmap, model vs heuristic comparison, latency benchmark button (runs N inferences on WebGPU and WASM, shows p50/p95/p99), model switcher between released versions and the heuristic. |
| 10 | **Settings** | Camera device, sensitivity (maps to hysteresis offsets), nudge style and quiet hours, sample rate, retention, Darb Budokai integration (off by default; URL, producer key entry, test send, outbox status), export and "Delete all my data". |
| 11 | **Demo mode** | Same app on seed data with a fixed "Demo data" banner. Used for the prototype, screenshots and the Darb Kaioken embed. |

Empty, loading and error states are designed for every screen (camera denied, no person in frame, model failed to load so heuristic is active, WebGPU unavailable, PiP unsupported).

## 3. Interaction and motion rules

- Motion explains state; it never decorates. Every animation maps to a posture change, a navigation or a confirmation.
- Springs, not linear easing: default spring stiffness and damping from motion tokens (Motion 12 `type: "spring"`). Durations for non-spring fades: 120 to 240 ms.
- The live view is calm: no element other than the outline and glow animates while a session runs.
- Glow and outline follow the critically damped `m`, never raw per-frame values.
- Nudges are rare and soft; at most one visible at a time; never modal; never block the PiP.
- Report charts animate in once on first view (300 ms stagger), never on re-render.
- Page transitions use the View Transitions API through React (`react-view-transitions`) with a cross-fade fallback.
- `prefers-reduced-motion: reduce`: springs become 0-duration or short fades, no shimmer, no particles, no bloom pulse, chart entry animations off.
- Keyboard: every action reachable; `Space` pause/resume, `C` calibrate, `P` open sentinel, `?` shortcut sheet. Visible focus rings from tokens.
- Performance budget: overlay at display rate with under 2 ms GPU time per frame on Nour's laptop; total app CPU under 10% of one core at 5 Hz sampling (measured with `performance-profiling`).

## 4. Art direction candidates (Nour picks one in Phase 2)

> Phase 1 (ADR-029): the approved brand fixes fonts and palette, so these three are shown in Phase 2 rebuilt on the brand as Night Instrument (A), Ivory Ledger (B) and Night Monitor (C). The fonts named below are superseded by Zen Old Mincho and Geist.

All three are original. No gradient blobs, no stock illustrations, no emoji. Each will be shown as a live side-by-side of the Live mirror and Today screens.

### A. Gilded Instrument
A precision instrument at night. Near-black warm graphite surfaces, hairline rules, gold leaf `#C9A24A`-range accent used only for the outline, glow and the hero number. Type: a refined serif for numbers and headings (Fraunces or Newsreader) and a neutral grotesk for UI (Inter Tight or Geist). Charts are thin gold strokes on graphite with tabular figures. Feels like a watch dial.

### B. Kintsugi Paper
Light mode first. Warm off-white paper texture (procedural, subtle), ink-black type, and gold seams: the outline and the report timeline look like gold repairs on ceramic. Bad posture minutes are drawn as soft ink-grey, never red. Type: a humanist serif (Source Serif 4) with a mono for data (IBM Plex Mono). Calm, crafted, unusual for a health app.

### C. Studio Monitor
A broadcast-monitor aesthetic. Deep blue-black, fine scanline grid at very low contrast, gold as the single "signal" colour, technical mono labels (JetBrains Mono) and a condensed sans for headings (Barlow Condensed or Archivo Narrow). The live view reads like a calibrated camera monitor with framing marks. Strongest fit for developers.

## 5. Design system (built in Phase 2)

> Built in Phase 2 (ADR-031, ADR-032). Tokens: `config/design/tokens.yaml`, generated into `apps/web/src/design/tokens.css` with `pnpm --filter web tokens`. Components: `apps/web/src/ui/`. Live gallery: `/design/components`; directions: `/design`; overlay prototype: `/design/overlay`; phone shell: `/design/mobile`. Shape rule: controls are pills, containers 14 px, the mirror 24 px, sheets 28 px. Icons: Lucide at stroke 1.75 plus four custom posture glyphs.

- Tokens as CSS custom properties and a Tailwind 4 `@theme`: colour (light and dark; gold reserved for posture meaning), type scale, spacing, radii, elevation, motion (spring presets, durations), glow parameters (outline width, bloom strength/threshold, rim intensity).
- Components: button (primary, quiet, destructive), icon button, segmented control, toggle, slider with value, list row, grouped list, sheet, toast/nudge, stat block, timeline ribbon, heatmap, bar chart, confusion matrix, model card, permission prompt, empty state, banner (demo, warnings).
- Charts follow the `dataviz` skill: one palette, tabular numbers, direct labels instead of legends where possible, accessible colour contrast in both themes.
- `ASSETS.md` lists fonts, icon set and the chime source.

## 6. Native feel, icons, no emoji

Nour: "the apps must feel as native as a SWIFT UI when it comes to mobile apps... use only modern elements and icons and SVGs ... emojis and low quality icons are forbidden".

On the phone (Today, History, Settings, Dataset Studio list):

- Safe-area insets on every edge (`viewport-fit=cover`, `env(safe-area-inset-*)`).
- Large titles that collapse into a compact, translucent top bar on scroll.
- A bottom tab bar (Today, History, Live, Settings) with SVG icons and labels.
- Sheets with detents (medium, large) and drag-to-dismiss, with a grabber; nudge details, calibration confirm and destructive confirmations use sheets, not centred modals.
- Spring physics for every movement; no linear easing.
- Pressed-state scale feedback (about 0.97) and highlight on every tappable element.
- 44 x 44 pt minimum touch targets.
- System-like translucent materials (`backdrop-filter: blur() saturate()` with an opaque fallback when unsupported or with reduced transparency).
- Native-style inset grouped lists, with swipe actions on History days and recordings (delete, export).
- Desktop keeps the same component language with pointer-appropriate density.

Icons: one modern SVG set only, **Solar** via Iconify (skill `solar-duotone-bold`) or **Lucide**, chosen in Phase 2, plus custom-drawn SVG for the posture glyphs (upright, slouch, forward head, lean). No raster icons, no mixed sets. Company logos (none expected) only via Iconify Simple Icons (`company-logos`).

**No emoji anywhere**: UI, notifications, alerts, config copy, docs, commits. `pnpm check:emoji` fails the build if any appear.

## 7. Accessibility requirements

- WCAG 2.2 AA: 4.5:1 body text, 3:1 large text and UI components, in light and dark themes. The gold accent is checked against both backgrounds; where gold fails contrast for text, it is used only for non-text marks and paired with text.
- Posture state is never conveyed by colour alone: every state has a word and a glyph.
- The live view has a text alternative: an `aria-live="polite"` region announces state changes (rate-limited from config).
- Fully keyboard operable, logical focus order, visible focus, skip link, no keyboard traps in sheets or PiP.
- Screen-reader labels for charts plus a data table toggle for each chart.
- `prefers-reduced-motion` and `prefers-reduced-transparency` respected; `prefers-color-scheme` sets the default theme.
- Responsive from 360 px; text resizes to 200% without loss.
- Nudge sound always optional, with a visual equivalent.
- axe (Playwright) shows zero serious or critical violations on every screen; manual VoiceOver pass in Phase 10 (`design:accessibility-review`).
