import { describe, expect, it } from 'vitest';
import { settingsConfig } from '../config/runtime';
import { shortcutFor } from './shortcuts';

const keys = settingsConfig.shortcuts;
const body = { tagName: 'BODY' };

describe('shortcutFor', () => {
  it('Space pauses or resumes', () => {
    expect(shortcutFor({ key: ' ', target: body }, keys)).toBe('pause');
  });
  it('C opens calibration, in either case', () => {
    expect(shortcutFor({ key: 'c', target: body }, keys)).toBe('calibrate');
    expect(shortcutFor({ key: 'C', target: body }, keys)).toBe('calibrate');
  });
  it('P opens the sentinel', () => {
    expect(shortcutFor({ key: 'p', target: body }, keys)).toBe('sentinel');
  });
  it('? shows the shortcuts', () => {
    expect(shortcutFor({ key: '?', target: body }, keys)).toBe('help');
  });
  it('does nothing while typing or with a modifier', () => {
    expect(shortcutFor({ key: 'c', target: { tagName: 'INPUT' } }, keys)).toBeNull();
    expect(
      shortcutFor({ key: 'c', target: { tagName: 'DIV', isContentEditable: true } }, keys),
    ).toBeNull();
    expect(shortcutFor({ key: 'p', metaKey: true, target: body }, keys)).toBeNull();
    expect(shortcutFor({ key: 'x', target: body }, keys)).toBeNull();
  });
  it('leaves Space to a focused button', () => {
    expect(shortcutFor({ key: ' ', target: { tagName: 'BUTTON' } }, keys)).toBeNull();
    expect(shortcutFor({ key: 'c', target: { tagName: 'BUTTON' } }, keys)).toBe('calibrate');
  });
});
