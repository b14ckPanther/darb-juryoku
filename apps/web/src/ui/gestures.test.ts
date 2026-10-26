import { describe, expect, it } from 'vitest';
import { designTokens } from '../design';
import { nearestDetent, sheetShouldDismiss, swipeSettle } from './gestures';

const sheet = designTokens.motion.sheet;
const swipe = designTokens.motion.swipe;

describe('sheetShouldDismiss (thresholds from tokens)', () => {
  const height = 600;

  it('stays open for a short, slow drag', () => {
    expect(sheetShouldDismiss(height * sheet.dismiss_fraction - 1, 0, height, sheet)).toBe(false);
  });

  it('closes once dragged past the dismiss fraction of its height', () => {
    expect(sheetShouldDismiss(height * sheet.dismiss_fraction + 1, 0, height, sheet)).toBe(true);
  });

  it('closes on a fast downward flick even when barely moved', () => {
    expect(sheetShouldDismiss(10, sheet.dismiss_velocity_px_s + 1, height, sheet)).toBe(true);
  });

  it('steps down instead of closing when flicked from above the lowest detent', () => {
    expect(sheetShouldDismiss(-120, sheet.dismiss_velocity_px_s + 1, height, sheet)).toBe(false);
  });

  it('never closes on an upward drag', () => {
    expect(sheetShouldDismiss(-300, -2000, height, sheet)).toBe(false);
  });
});

describe('nearestDetent', () => {
  it('snaps to the closest detent when released slowly', () => {
    expect(nearestDetent(0.55, 0, [0.5, 0.92])).toBe(0.5);
    expect(nearestDetent(0.8, 0, [0.5, 0.92])).toBe(0.92);
  });

  it('follows a flick to the next detent in its direction', () => {
    expect(nearestDetent(0.55, -900, [0.5, 0.92], sheet.dismiss_velocity_px_s)).toBe(0.92);
    expect(nearestDetent(0.85, 900, [0.5, 0.92], sheet.dismiss_velocity_px_s)).toBe(0.5);
  });
});

describe('swipeSettle', () => {
  const actionsWidth = swipe.reveal_px * 2;

  it('springs back closed for a small swipe', () => {
    expect(swipeSettle(-20, 0, actionsWidth, swipe.commit_fraction)).toBe(0);
  });

  it('opens fully past the commit fraction', () => {
    expect(
      swipeSettle(
        -actionsWidth * swipe.commit_fraction - 1,
        0,
        actionsWidth,
        swipe.commit_fraction,
      ),
    ).toBe(-actionsWidth);
  });

  it('closes when swiped back to the right', () => {
    expect(swipeSettle(30, 0, actionsWidth, swipe.commit_fraction)).toBe(0);
  });
});
