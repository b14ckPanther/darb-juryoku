# Phase 1 review for Nour

> **Closed 2026-10-26.** Decided by Claude under Nour's delegation (2026-10-26). Eight recommendations below were changed after a second, critical read; see `docs/OPEN_QUESTIONS.md` for the table and `docs/specs/2026-10-26-phase-01-product-spec.md` for the reasons. Phase 0 is merged into local `main`. The GitHub repo is still not created and nothing is pushed: that needs Nour.

Phase 0 is done (see `docs/PROGRESS.md`). Phase 1 settles the 20 questions in `docs/OPEN_QUESTIONS.md`. Each one below has a recommended answer and one line of why. Reply "yes to all", or list the numbers you want to change. Nothing here is decided until you answer.

## Open-ended (your answer matters more than mine)

| # | Question | Recommended default | Why |
|---|---|---|---|
| 1 | Your day: setup, sitting length, what keeps it open | Assume one MacBook with its built-in camera, 2 to 4 hour sittings, and it must use under 10% of one core | It sets camera framing, sampling rate and the CPU budget; tell me if you use an external camera or a second screen. |
| 2 | The nudge | Silent by default: the sentinel glow turns amber first, a system notification only after 4 minutes, sound off unless you switch it on | A nudge that feels like an alarm kills daily use (VISION anti-goal). |
| 3 | The report | One hero number (good-posture share), a day timeline, one plain sentence, and a 7-day comparison; readable on the phone | Short enough to read every evening; the phone is where you will actually look. |
| 4 | What "bad posture" means for you | Forward head and slouching first, leaning on one arm second | These are the most common coding habits, and they decide the class list in #8. |
| 5 | The signature moment's feel | A calm instrument, not a game | Matches the approved brand (night, forest, gold) and keeps the live view quiet while you code. |
| 6 | Data collection time | About 20 minutes of guided recording on 6 days, plus passive recording during 2 real work sessions a week, with a "how are you sitting?" prompt at most 3 times an hour | Reaches the v1 target (30 sessions, 6 hours, 3 lighting conditions) in two weeks without getting in the way. |
| 7 | What a recruiter sees in 30 seconds | The golden-outline GIF first, then the confusion matrix and model-vs-heuristic table, then latency numbers and the privacy line | The GIF earns the click; the evaluation proves the ML is real. |

## Specific choices

| # | Question | Recommended answer | Why |
|---|---|---|---|
| 8 | Classes | Keep `upright`, `slouch`, `forward_head`, `lean_side`; `absent` stays a rule, not a class | Four classes are learnable from your own data in two weeks; merging loses the forward-head habit. |
| 9 | Art direction | Gilded Instrument, rebuilt on the approved brand (Zen Old Mincho + Geist, night, forest, gold) | The approved brand already is a night-and-gold instrument; Kintsugi Paper and Studio Monitor would fight it. Phase 2 still shows it side by side. |
| 10 | Icon set | Lucide | Its thin, even strokes match the line-drawn mark and the instrument look; Solar duotone reads more playful. |
| 11 | Framework | Vite + React (already scaffolded in Phase 0) | Fully client-side with workers and WASM; nothing to server-render. Low cost to switch later. |
| 12 | Running while coding | Document Picture-in-Picture in Chrome or Edge now; Tauri wrapper only if PiP fails you in Phase 8 | Works today with no install; the desktop icon is already made if you want Tauri later. |
| 13 | Phone | Yes, installable PWA for Today, History and Settings; data stays on the laptop unless you export it | Matches your SwiftUI-feel rule and keeps the privacy story simple. |
| 14 | Dataset privacy | Keep the raw dataset private; publish aggregate statistics and the evaluation report | Landmarks of your body over weeks are still personal; aggregates give the same credibility. |
| 15 | DVC remote | A local folder outside the repo (for example `~/darb-juryoku-dvc`), mirrored to an external drive when convenient | Free, private, works offline; can move to a private bucket later in one command. |
| 16 | Release gates | Keep macro F1 >= 0.85, slouch recall >= 0.85, beat the heuristic by >= 0.05 | Strict enough to mean something, reachable with session-split data; the report states it honestly if not met. |
| 17 | Hosting | Vercel free tier at `posture.zangeel.dev` | Sets COOP/COEP headers easily, $0, and fits your zangeel.dev portfolio. |
| 18 | Visitors on the public demo | Demo mode by default, plus an optional "try it on yourself" calibration that stores nothing | Lets recruiters feel the golden outline without any data leaving their browser. |
| 19 | Darb Budokai integration | Keep it opt-in (off by default) | Nothing leaves the device unless you switch it on. |
| 20 | Repo name and licence | `darb-juryoku` under MIT (already in `LICENSE` as a proposal) | Matches the Darb naming and is the simplest licence for a portfolio repo. |

## Also waiting for you

- **Rulings made in Phase 0** (all cheap to reverse) are in the ledger's "Rulings" table in `docs/PROGRESS.md`. Please confirm or change them.
- **Merge** `phase/00-bootstrap` into `main`: needs your yes.
- **GitHub repo**: not created, no remote, nothing pushed. Needs your yes, then the description and topics get set.
- **Phase 2 proposal**: open `docs/proposals/phase-02-design-directions.html` in a browser. It shows the brand tokens with measured contrast, the live mirror (drag the drift control), and Today on the phone in a night and an ivory direction. It is a proposal, not approved.
