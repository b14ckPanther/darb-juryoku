import { describe, expect, it } from 'vitest';
import { answerNudge, initialNudgeTimer, stepNudge } from './nudge-timer';

describe('stepNudge', () => {
  it('shows only after continuous drift for the full time', () => {
    let s = stepNudge(initialNudgeTimer, 0, true, 5);
    s = stepNudge(s, 4, true, 5);
    expect(s.showing).toBe(false);
    s = stepNudge(s, 5, true, 5);
    expect(s.showing).toBe(true);
  });
  it('restarts the count when posture recovers', () => {
    let s = stepNudge(initialNudgeTimer, 0, true, 5);
    s = stepNudge(s, 3, false, 5);
    s = stepNudge(s, 4, true, 5);
    expect(stepNudge(s, 8, true, 5).showing).toBe(false);
    expect(stepNudge(s, 9, true, 5).showing).toBe(true);
  });
  it('stays quiet after an answer until the quiet spell ends', () => {
    let s = answerNudge(stepNudge(stepNudge(initialNudgeTimer, 0, true, 5), 5, true, 5), 6, 40);
    s = stepNudge(s, 7, true, 5);
    expect(stepNudge(s, 30, true, 5).showing).toBe(false);
    expect(stepNudge(s, 46, true, 5).showing).toBe(true);
  });
});

describe('recovery', () => {
  it('takes the nudge away when posture recovers', () => {
    const shown = stepNudge(stepNudge(initialNudgeTimer, 0, true, 5), 5, true, 5);
    expect(shown.showing).toBe(true);
    expect(stepNudge(shown, 6, false, 5).showing).toBe(false);
  });
});
