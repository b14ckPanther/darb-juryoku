# Open questions: closed in Phase 1

**All 20 answered on 2026-10-26.** Decided under Nour's delegation (2026-10-26). Answers and reasons are in `docs/specs/2026-10-26-phase-01-product-spec.md`; the ADRs in `docs/DECISIONS.md` are Accepted. Nothing below blocks Phases 2 to 6. Outward actions (repo creation, push, deploy, DNS, publishing data) still need Nour's yes.

| # | Answer | Spec section | Changed from the review sheet? |
|---|---|---|---|
| 1 | One MacBook, built-in camera, 2 to 4 hour sittings, under 10% of one core (assumed, in config) | 2 | no |
| 2 | Silent by default: glow, then one notification after 4 min, chime opt-in; two actions | 4 | yes: two actions, not three |
| 3 | Hero number, ribbon, three facts, one sentence; History views | 5 | no |
| 4 | Forward head and slouching first, leaning second | 3 | no |
| 5 | A calm instrument | 10 | no |
| 6 | 32 guided runs on 8 days plus 4 passive hours; 30 sessions, 6 hours target | 8 | yes: the old plan gave about 6 sessions |
| 7 | Summary, GIF, live demo link, eval tables, latency, privacy | 14 | yes: live demo link added |
| 8 | `upright`, `slouch`, `forward_head`, `lean_side`; `absent` is a rule | 3 | no |
| 9 | Three brand-faithful variants in Phase 2; dark and light both ship | 10 | yes: variants rebuilt on the brand |
| 10 | Lucide | 11 | no |
| 11 | Vite + React | 16 | no |
| 12 | Document Picture-in-Picture; Tauri only if PiP fails | 7 | no |
| 13 | Installable PWA fed by a user-started aggregates handoff | 6 | yes: fixes an empty phone report |
| 14 | Raw private; aggregates, cards and labelled synthetic fixture public | 12 | yes: fixture added |
| 15 | Local folder outside the repo, path in `.dvc/config.local` | 13 | yes: path kept out of git |
| 16 | Proposed gates kept, plus two latency gates | 9 | yes: latency gates added |
| 17 | Vercel free tier; domain set at launch with Nour | 14 | yes: domain deferred, outward action |
| 18 | Demo by default plus "Try it on yourself", nothing stored | 14 | no |
| 19 | Opt-in, off by default | 15 | no |
| 20 | `darb-juryoku`, code MIT, brand excluded | 16 | yes: brand excluded |

## The original questions


The Phase 1 session asks these **one at a time**, open-ended questions first, and records each answer in `DECISIONS.md` (turning the matching ADR into Accepted or replacing it) and in the ledger's "Rulings" table.

## Open-ended (ask first)

1. **Your day.** Walk me through a normal coding day: where you sit, which machine and camera, how long a sitting usually lasts, and when you notice your posture going bad. What would make you keep this running every day, and what would make you close it?
2. **The nudge.** How do you want to be told you are slouching? What is the gentlest signal you would still notice, and what would feel annoying? Should it ever make a sound?
3. **The report.** What would you actually want to read at the end of a day or week? A number, a timeline, a sentence, a comparison? Do you want it on your phone?
4. **What "bad posture" means for you.** Which habits do you know you have (forward head, rounded shoulders, leaning on one arm, sinking into the chair)? This decides the class list.
5. **The signature moment.** Picture the golden outline and glow. What should it feel like: a calm instrument, a game, a ritual? Any references you love (not to copy, to understand taste)?
6. **Data collection.** How much time can you give to recording sessions in the first two weeks (guided and passive)? Are you comfortable with prompts asking "how are you sitting right now?" a few times an hour while recording?
7. **Showing it publicly.** What should a recruiter see in the README in 30 seconds: the GIF, the confusion matrix, the latency numbers, the privacy story? Which matters most to you?

## Specific choices

8. **Classes:** confirm `upright`, `slouch`, `forward_head`, `lean_side` (ADR-015), or add or merge any?
9. **Art direction:** Gilded Instrument, Kintsugi Paper or Studio Monitor (UI_DESIGN §4)? Decided in Phase 2 side by side, but say now if one is already out.
10. **Icon set:** Solar (duotone) or Lucide?
11. **Frontend framework:** Vite + React (ADR-013), or do you want Next.js for consistency with your other repos?
12. **Running while coding:** is Chrome or Edge with a Document Picture-in-Picture sentinel acceptable (ADR-023)? Or do you want a desktop wrapper (Tauri) later?
13. **Phone:** should the report be an installable PWA on your phone (data stays on the laptop unless you export it), or desktop only?
14. **Dataset privacy:** the dataset is landmarks only, no images. May it be published with the repo (helps credibility), kept private, or published only as aggregate statistics?
15. **DVC remote:** a folder on an external drive, a local folder outside the repo, or a private cloud bucket (free tier)?
16. **Release gates:** are the proposed thresholds (macro F1 0.85, slouch recall 0.85, beat heuristic by 0.05) the right bar for you?
17. **Hosting:** Vercel or Cloudflare Pages for the public demo? Custom domain (for example `posture.zangeel.dev`)?
18. **Visitors:** should the public demo let visitors calibrate and use the model on themselves (calibration-only, nothing stored), or show demo mode only?
19. **Darb Budokai integration:** when Darb Budokai exists, turn it on by default for you, or keep it opt-in?
20. **Repo name and licence:** `darb-juryoku` under MIT?
