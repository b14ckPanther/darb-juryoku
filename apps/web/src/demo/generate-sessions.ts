// Demo only. Turns config/seed/demo/recipe.yaml into the synthetic sitter's sessions, one letter per
// minute. Seeded, so the committed sessions.yaml can be checked against a fresh run.
import recipeSchema from '../../../../packages/schemas/config/seed/demo/recipe.schema.json';
import { makeConfigParser } from '../config/parse-config';
import type { MinuteState } from '../report/types';

type Range = [number, number];
interface Sitting {
  start: string;
  minutes: Range;
}
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Recipe {
  end_date: string;
  days: number;
  rng_seed: number;
  device: string;
  model_version: string;
  workday_sessions: Sitting[];
  weekend_sessions: Sitting[];
  weekend_session_chance: number;
  jitter_minutes: number;
  drift_by_hour: Record<string, number>;
  weekday_shift: Partial<Record<Weekday, number>>;
  drift_mix: { slouch: number; forward_head: number; lean_side: number };
  mean_drift_run_minutes: number;
  away: { chance_per_minute: number; minutes: Range };
  unwatched: { chance_per_session: number; minutes: Range };
}

export interface SeedSession {
  id: string;
  date: string;
  start: string;
  model: string;
  device: string;
  minutes: string;
}

export interface SeedSessions {
  codes: Record<string, MinuteState>;
  sessions: SeedSession[];
}

export const parseRecipe = makeConfigParser<Recipe>(recipeSchema, (r) => {
  const mix = r.drift_mix.slouch + r.drift_mix.forward_head + r.drift_mix.lean_side;
  return Math.abs(mix - 1) > 1e-6 ? [`drift_mix adds up to ${mix}, needs 1`] : [];
});

/** The letters written to sessions.yaml. The file carries this map, so readers never guess. */
export const STATE_CODES: Record<string, MinuteState> = {
  u: 'upright',
  s: 'slouch',
  f: 'forward_head',
  l: 'lean_side',
  a: 'absent',
  x: 'unknown',
};
const letter = Object.fromEntries(Object.entries(STATE_CODES).map(([k, v]) => [v, k])) as Record<
  MinuteState,
  string
>;

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const toUtc = (date: string) => new Date(`${date}T00:00:00Z`);
export const weekdayOf = (date: string): Weekday => WEEKDAYS[toUtc(date).getUTCDay()] ?? 'mon';
export const addDays = (date: string, n: number) =>
  new Date(toUtc(date).getTime() + n * 86_400_000).toISOString().slice(0, 10);
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const minuteOf = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** mulberry32: small, fast, and the same everywhere. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSessions(recipe: Recipe): SeedSessions {
  const rand = rng(recipe.rng_seed);
  const between = ([lo, hi]: Range) => lo + Math.floor(rand() * (hi - lo + 1));
  const pickDrift = (): MinuteState => {
    const r = rand();
    const { slouch, forward_head } = recipe.drift_mix;
    return r < slouch ? 'slouch' : r < slouch + forward_head ? 'forward_head' : 'lean_side';
  };
  const sessions: SeedSession[] = [];

  for (let d = recipe.days - 1; d >= 0; d -= 1) {
    const date = addDays(recipe.end_date, -d);
    const weekday = weekdayOf(date);
    const weekend = weekday === 'sat' || weekday === 'sun';
    if (weekend && rand() >= recipe.weekend_session_chance) continue;
    const plan = weekend ? recipe.weekend_sessions : recipe.workday_sessions;
    const shift = recipe.weekday_shift[weekday] ?? 0;

    plan.forEach((sitting) => {
      const length = between(sitting.minutes);
      if (length === 0) return;
      const start =
        minuteOf(sitting.start) + between([-recipe.jitter_minutes, recipe.jitter_minutes]);
      const states: MinuteState[] = [];
      let current: MinuteState = 'upright';
      let away = 0;
      for (let i = 0; i < length; i += 1) {
        if (away > 0) {
          away -= 1;
          states.push('absent');
          continue;
        }
        if (i > 0 && rand() < recipe.away.chance_per_minute) {
          away = between(recipe.away.minutes) - 1;
          current = 'upright';
          states.push('absent');
          continue;
        }
        const hour = String(Math.floor((start + i) / 60));
        const p = Math.min(0.9, Math.max(0, (recipe.drift_by_hour[hour] ?? 0.2) + shift));
        const leave = 1 / recipe.mean_drift_run_minutes;
        if (current === 'upright') {
          // Enter drift so that, at steady state, drift takes share p of the minutes.
          if (rand() < (p / (1 - p)) * leave) current = pickDrift();
        } else if (rand() < leave) {
          current = 'upright';
        }
        states.push(current);
      }
      if (rand() < recipe.unwatched.chance_per_session && length > 30) {
        const span = between(recipe.unwatched.minutes);
        const at = between([10, Math.max(10, length - span - 1)]);
        for (let i = at; i < Math.min(length, at + span); i += 1) states[i] = 'unknown';
      }
      sessions.push({
        id: `demo-${date}-${clock(start).replace(':', '')}`,
        date,
        start: clock(start),
        model: recipe.model_version,
        device: recipe.device,
        minutes: states.map((s) => letter[s]).join(''),
      });
    });
  }
  return { codes: STATE_CODES, sessions };
}
