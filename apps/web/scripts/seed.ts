// Demo only. Regenerates config/seed/demo/sessions.yaml from recipe.yaml (`pnpm --filter web seed`).
// sessions-file.test.ts fails if the committed file drifts from the recipe.
import { readFileSync, writeFileSync } from 'node:fs';
import { generateSessions, parseRecipe } from '../src/demo/generate-sessions';
import { sessionsYaml } from '../src/demo/sessions-yaml';

const fromRoot = (path: string) => new URL(`../../../${path}`, import.meta.url);
const recipe = parseRecipe(
  readFileSync(fromRoot('config/seed/demo/recipe.yaml'), 'utf8'),
  'recipe.yaml',
);
const target = fromRoot('config/seed/demo/sessions.yaml');
writeFileSync(target, sessionsYaml(generateSessions(recipe)));
console.log(`Wrote ${target.pathname}`);
