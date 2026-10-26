# Open questions (only Nour can decide)

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
