# Phase 0 plan: repo bootstrap, CI, conventions

Source: `docs/PLAN.md` Phase 0. Phase 0 is fully specified there and decides nothing for Nour, so no separate spec was written; the tasks below are the plan as executed, in TDD order. Each task: failing test first, watched fail, minimum code, all suites green, commit as Nour.

| # | Task | Test written first | Commit |
|---|---|---|---|
| 0 | `git init` in place, identity set to Nour, planning package committed on `main`, branch `phase/00-bootstrap` | none (setup) | `c9065ae` |
| 1 | `commit-msg` hook rejecting attribution text and emoji; agent settings with attribution off; `.gitignore` | `tests/hooks/commit-msg.bats` (9 cases) | `8684454` |
| 2 | pnpm workspace, `apps/web` (Vite 7, React 19, TS strict, Tailwind 4, Vitest 3), shell renders app name from config with brand tokens and fonts | `src/app/App.test.tsx` (2) | `3b20106` |
| 3 | `config/app.yaml`, JSON Schema in `packages/schemas/config/`, Ajv loader that fails fast; `pnpm schemas:check` | `src/config/load-config.test.ts` (6), `packages/schemas/tests/config-files.test.ts` (2) | `1e6d3d2` |
| 4 | `ml/` uv project (Python 3.12, torch, pytest, ruff, mypy strict), `pg_ml.config` (jsonschema + Pydantic), `dvc init`, empty `dvc.yaml`, `params.yaml` | `ml/tests/test_config.py` (5) | `799b37e` |
| 5 | `scripts/check-emoji.sh`, `pnpm check:emoji` | `tests/scripts/check-emoji.bats` (7) | `f01bb4d` |
| 6 | Playwright config and smoke: COOP/COEP, configured name, no off-origin request | `apps/web/e2e/shell.spec.ts` (2) | `778ce0c` |
| 7 | GitHub Actions `ci.yml` (web, schemas, ml, emoji-and-hooks), PR template, `.env.example`, `LICENSE` (MIT, proposed), `ASSETS.md` | `actionlint` clean; `pnpm check:all` | `5edfddc` |
| 8 | Whole-branch review (8 findings fixed: Linux exit code, axe scan, DVC dependency, ledger and README, scissors line, title from config, fs.allow, UTF-8 reads; 3 logged as rulings) | `bats` on Ubuntu 24.04, axe probe | `db3a8d7`, `66b3378`, `3a54540` |
