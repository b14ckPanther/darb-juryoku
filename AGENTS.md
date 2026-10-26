# AGENTS.md

This repo's full agent manual is **`CLAUDE.md`**. Read it before doing anything. It applies to every coding agent, not only one tool. If this file and `CLAUDE.md` ever differ, `CLAUDE.md` wins.

The short version:

1. **No AI attribution.** "Never add "Co-Authored-By" or any other AI attribution line to commit messages, pull request descriptions, or any other text, in any project. Commit messages end with the last line of the actual description." Every commit is authored and committed as `Nour Alden Mousa <nmcryptoinvest@gmail.com>`. Nour: "NO AI CONTRIBUTORS".
2. **Before every push**, both must hold:
   - `git log --format='%an %ae%n%cn %ce' | sort -u` prints only Nour.
   - `git log --format=%B | grep -ciE 'co-authored|claude|anthropic|generated with'` prints `0`.
3. **No hardcoded data.** Thresholds, copy, labels, hyperparameters and gates live in `config/`, `params.yaml`, `ml/configs/`, env vars or IndexedDB. Fixtures only in tests and the labelled demo mode.
4. **Privacy first.** Webcam frames never leave the device and are never stored. Datasets hold landmarks and labels only. No runtime CDN.
5. **UI/UX first.** Design system (Phase 2) and a clickable prototype approved screen by screen (Phase 3) before any engine or ML work.
6. **Native feel, modern icons, no emoji.** SwiftUI-quality mobile behaviour, one SVG icon set (Solar or Lucide), no emoji anywhere (`pnpm check:emoji`).
7. **Secrets** only in env vars or a git-ignored `.env`; the Darb Budokai key is entered at runtime.
8. **Original assets only.** Licences recorded in `ASSETS.md`.
9. **Ask Nour first** before creating or publishing the repo, pushing or merging to `main`, deploying, publishing data, or deleting anything.
10. **TDD**, one branch per phase (`phase/NN-name`), many small honest commits, no live services in CI.
11. **Use the installed skills.** Check the skill list before every task, invoke every matching skill, record them in the ledger. The mapping is in `CLAUDE.md` §2 and on every phase in `docs/PLAN.md`.
12. **Resume** by reading `CLAUDE.md`, `docs/PROGRESS.md` and `git log --oneline -20`.

Plan: `docs/PLAN.md`. Ledger: `docs/PROGRESS.md`.
