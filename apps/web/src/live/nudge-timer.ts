/**
 * When to show a nudge: after `after` seconds of continuous drift, never again until `quiet` seconds
 * after the last answer. Pure; the caller feeds it the clock.
 */
export interface NudgeTimer {
  driftSince: number | null;
  quietUntil: number;
  showing: boolean;
}

export const initialNudgeTimer: NudgeTimer = { driftSince: null, quietUntil: 0, showing: false };

export function stepNudge(
  s: NudgeTimer,
  now: number,
  drifting: boolean,
  after: number,
): NudgeTimer {
  // Sitting back up answers the nudge too: it goes away without a tap.
  if (!drifting) return { ...s, driftSince: null, showing: false };
  const since = s.driftSince ?? now;
  const due = !s.showing && now >= s.quietUntil && now - since >= after;
  return { ...s, driftSince: since, showing: s.showing || due };
}

export const answerNudge = (_s: NudgeTimer, now: number, quiet: number): NudgeTimer => ({
  driftSince: null,
  quietUntil: now + quiet,
  showing: false,
});
