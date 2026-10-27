import { describe, expect, it } from 'vitest';
import rawRecipe from '../../../../config/seed/demo/recipe.yaml?raw';
import rawSessions from '../../../../config/seed/demo/sessions.yaml?raw';
import { generateSessions, parseRecipe } from './generate-sessions';
import { sessionsYaml } from './sessions-yaml';

describe('config/seed/demo/sessions.yaml', () => {
  it('is exactly what the recipe generates (run `pnpm --filter web seed` after changing it)', () => {
    const recipe = parseRecipe(rawRecipe, 'recipe.yaml');
    expect(rawSessions).toBe(sessionsYaml(generateSessions(recipe)));
  });
});
