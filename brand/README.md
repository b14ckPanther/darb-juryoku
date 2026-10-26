# Darb Juryoku brand

Juryoku is a Darb product. It wears Darb's colours (night, forest, gold, ivory) and motion curves, and has
its own mark: **you, sitting straight at your laptop, in the camera's frame, with your spine lit in gold.**
It says what the app does at first glance: your webcam keeps an eye on your back, and good posture shows up as light.
重力 (juryoku) means gravity: the gravity-room training from Dragon Ball. Good posture is your daily fight against gravity.

## See it

```sh
cd brand && npm install
node scripts/serve.mjs          # http://127.0.0.1:4180/ : live 3D showcase, palette, every asset
```

## Rebuild every asset

```sh
PWEXE=/path/to/chromium npm run build
```

Everything comes from two sources, so nothing is hardcoded in the build:

| File | Holds |
|---|---|
| `src/tokens.json` | colours and their roles, type, motion, render settings, icon sizes, copy |
| `src/mark.svg` | the approved mark, drawn once. Ids `frame`, `spine`, `lens`, `bg` name the parts the 3D scene animates |

`src/scene.js` is the Three.js scene: it loads `mark.svg`, extrudes fills into bevelled gold and turns strokes into rods, then animates camera focus (the frame tightens, the spine and lens light up), with gold flakes and bloom on Darb night.
(`render.html`).

## What's in `exports/`

| Path | Use |
|---|---|
| `icons/icon-192.png`, `icon-512.png` | PWA icons, purpose `any` (squircle cut) |
| `icons/icon-maskable-192.png`, `-512.png` | PWA maskable (artwork inside the 80% safe zone) |
| `icons/apple-touch-icon.png` | iOS home screen, 180 px, opaque |
| `icons/icon-desktop-1024.png` | Desktop app (Tauri later): macOS grid, 824 px body with system shadow |
| `icons/favicon.ico`, `favicon.svg`, `favicon-16/32/48.png` | Browser tab: no furniture, heavier strokes for small sizes |
| `icons/badge-96.png` | Notification badge and Android monochrome icon |
| `svg/mark-*.svg` | The mark, flat: gold, ivory, ink, and on night (recoloured from `mark.svg`) |
| `svg/wordmark-on-dark.svg`, `-on-light.svg` | Lockup: mark, Darb, Juryoku, 重力 (text outlined, no font needed) |
| `social/og-image.png` | 1200 x 630 sharing card |
| `social/hero-aligned.png` | 2400 x 1350 README / store hero |
| `social/align-1..3.png` | The camera locking on, in three frames: searching, focusing, locked on |
| `manifest.webmanifest`, `head.html` | Drop-in manifest and `<head>` tags |
| `tokens.css` | CSS custom properties generated from `tokens.json` |

## Rules

- Darb's doorway belongs to Darb itself. Juryoku never uses it: only Darb's colours and motion curves.
- Gold marks only what matters. Bad posture is never red, just dimmer gold.
- Change the mark only in `src/mark.svg`; every flat and 3D asset is derived from it. Explorations live in `concepts/`.
- No emoji anywhere. Interface icons come from one SVG set (Solar).
- Fonts: Zen Old Mincho (display) and Geist (interface), both under the SIL Open Font License (`fonts/`).
