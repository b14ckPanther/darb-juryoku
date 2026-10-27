# Phase 2 plan: design system

Source: `docs/PLAN.md` Phase 2 and the Phase 1 spec (`docs/specs/2026-10-26-phase-01-product-spec.md`, sections 10 and 11). The spec already settles what Phase 2 decides (three brand-faithful directions, Lucide, both themes), so no separate Phase 2 spec was written; the tasks below are the plan as executed. Decided by Claude under Nour's delegation (2026-10-26).

| # | Task (PLAN order) | Test written first | Commit |
|---|---|---|---|
| 1 | Tokens YAML with schema; generator to `tokens.css` and Tailwind `@theme`; brand fonts subset to WOFF2 | `build-css.test.ts` (generated output, drift guard), `load-tokens.test.ts` | `013fff1` |
| 2 | Contrast of every text, mark and filled-control pair in every theme and direction; OKLab separation of good and drift | `contrast.test.ts` (169 pairs plus separation) | `013fff1` |
| 3 | Demo seed and synthetic pose fixture (schema-validated), overlay geometry, sheet and swipe thresholds from tokens | `design-seed.test.ts`, `geometry.test.ts`, `gestures.test.ts` | `22649d1` |
| 4 | Components, each with role, keyboard and state tests | `src/ui/*.test.tsx` | `1e3f5b2` |
| 5 | Sheet: drag-to-dismiss threshold from tokens, keyboard close, focus trap | `gestures.test.ts`, `sheet.test.tsx`, `e2e/design.spec.ts` | `1e3f5b2`, `4cd665b` |
| 6 | Overlay prototype: WebGL outline, rim, bloom, motes; 2D fallback; reduced motion. `/design` side by side; pick recorded (ADR-031) | `e2e/overlay.spec.ts` (pixel checks at match 0, 0.5, 1, reduced motion, both renderers) | `4cd665b` |
| 7 | Icon set wired (Lucide), `ASSETS.md`, original chime from tokens | `pnpm audio:check` (drift check in CI) | `4cd665b` |
| 8 | Critique, accessibility and web-guidelines passes; screenshots; fresh-context review | `e2e/design.spec.ts` (axe both themes, 44 px targets, overflow at 390 px) | this phase's last commits |
