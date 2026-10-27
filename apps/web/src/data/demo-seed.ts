// Demo only. Reads config/seed/demo (sessions and library) into a DataSnapshot. Loaded with a
// dynamic import from source.ts, so a real-mode session never even downloads the seed.
import rawLibrary from '../../../../config/seed/demo/library.yaml?raw';
import rawRecipe from '../../../../config/seed/demo/recipe.yaml?raw';
import rawSessions from '../../../../config/seed/demo/sessions.yaml?raw';
import librarySchema from '../../../../packages/schemas/config/seed/demo/library.schema.json';
import sessionsSchema from '../../../../packages/schemas/config/seed/demo/sessions.schema.json';
import { makeConfigParser } from '../config/parse-config';
import { parseRecipe, type SeedSessions } from '../demo/generate-sessions';
import type { MinuteBucket } from '../report/types';
import { isDrift } from '../report/types';
import type { DataSnapshot, Library } from './types';

const square = (name: string, m: number[][], n: number) =>
  m.length === n && m.every((r) => r.length === n) ? [] : [`${name} must be ${n} by ${n}`];

export const parseLibrary = makeConfigParser<Library>(librarySchema, (lib) => [
  ...square('heuristic.confusion', lib.heuristic.confusion, lib.classes.length),
  ...lib.models.flatMap((m) => square(`${m.name} confusion`, m.confusion, lib.classes.length)),
  ...(lib.calibrations.filter((c) => c.active).length === 1
    ? []
    : ['exactly one calibration must be active']),
  ...(lib.models.filter((m) => m.active).length <= 1 ? [] : ['at most one model may be active']),
]);

export const parseSeedSessions = makeConfigParser<SeedSessions>(sessionsSchema, (s) =>
  s.sessions.flatMap((x) =>
    [...x.minutes].filter((c) => !s.codes[c]).map((c) => `${x.id} uses unknown letter "${c}"`),
  ),
);

/** One full-minute bucket per letter of each session. */
export function bucketsFromSeed(seed: SeedSessions): MinuteBucket[] {
  return seed.sessions.flatMap((s) => {
    const [h = 0, m = 0] = s.start.split(':').map(Number);
    return [...s.minutes].map((c, i): MinuteBucket => {
      const state = seed.codes[c] ?? 'unknown';
      return {
        sessionId: s.id,
        day: s.date,
        minute: h * 60 + m + i,
        good_s: state === 'upright' ? 60 : 0,
        drift_s: isDrift(state) ? 60 : 0,
        absent_s: state === 'absent' ? 60 : 0,
        unknown_s: state === 'unknown' ? 60 : 0,
        dominant: state,
      };
    });
  });
}

export function loadDemoSnapshot(): DataSnapshot {
  const seed = parseSeedSessions(rawSessions, 'config/seed/demo/sessions.yaml');
  return {
    demo: true,
    today: parseRecipe(rawRecipe, 'config/seed/demo/recipe.yaml').end_date,
    sessions: seed.sessions.map(({ id, date, start, model, device }) => ({
      id,
      date,
      start,
      model,
      device,
    })),
    buckets: bucketsFromSeed(seed),
    library: parseLibrary(rawLibrary, 'config/seed/demo/library.yaml'),
  };
}
