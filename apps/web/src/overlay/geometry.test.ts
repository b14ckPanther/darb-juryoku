import { describe, expect, it } from 'vitest';
import { ConfigError } from '../config/load-config';
import rawFixture from '../../../../config/seed/demo/pose-fixture.yaml?raw';
import {
  catmullRom,
  contour,
  mixPose,
  parsePoseFixture,
  rimIntensity,
  segmentWarmth,
} from './geometry';

const fixture = parsePoseFixture(rawFixture, 'pose-fixture.yaml');

describe('parsePoseFixture', () => {
  it('loads the synthetic demo pose', () => {
    expect(fixture.points[0]).toBe('l_arm');
    expect(fixture.ideal['head_top']).toEqual([0.5, 0.165]);
  });

  it('rejects a pose that misses a listed point', () => {
    const broken = rawFixture.replace(/\n {2}head_top: \[0\.5, 0\.24\]/, '');
    expect(() => parsePoseFixture(broken, 'pose.yaml')).toThrow(ConfigError);
    expect(() => parsePoseFixture(broken, 'pose.yaml')).toThrow(/drift.*head_top/);
  });
});

describe('mixPose', () => {
  it('returns the ideal pose at 0 and the drift pose at 1', () => {
    expect(mixPose(fixture, 0)['l_ear']).toEqual(fixture.ideal['l_ear']);
    expect(mixPose(fixture, 1)['l_ear']).toEqual(fixture.drift['l_ear']);
  });

  it('interpolates halfway', () => {
    const [x, y] = mixPose(fixture, 0.5)['head_top'] ?? [];
    expect(x).toBeCloseTo(0.5, 6);
    expect(y).toBeCloseTo((0.165 + 0.24) / 2, 6);
  });

  it('clamps outside 0..1', () => {
    expect(mixPose(fixture, 7)['head_top']).toEqual(fixture.drift['head_top']);
  });
});

describe('contour', () => {
  it('orders the points as the fixture lists them, in pixels', () => {
    const points = contour(fixture, fixture.ideal, 400, 300);
    expect(points).toHaveLength(fixture.points.length);
    expect(points[0]).toEqual([68, 300]);
  });
});

describe('catmullRom', () => {
  const control: [number, number][] = [
    [0, 0],
    [10, 5],
    [20, 0],
    [30, 5],
  ];

  it('passes through every control point', () => {
    const curve = catmullRom(control, 8);
    for (const p of control) expect(curve).toContainEqual(p);
  });

  it('samples the requested density', () => {
    expect(catmullRom(control, 8)).toHaveLength((control.length - 1) * 8 + 1);
  });
});

describe('rimIntensity', () => {
  it('is full at a perfect match, gone at none, and eases between', () => {
    expect(rimIntensity(1)).toBe(1);
    expect(rimIntensity(0)).toBe(0);
    expect(rimIntensity(0.5)).toBeLessThan(0.5);
  });
});

describe('segmentWarmth', () => {
  it('is zero for every segment while the match is good', () => {
    expect(segmentWarmth(fixture, 0.9, 0.25).every((w) => w === 0)).toBe(true);
  });

  it('warms the head and neck more than the arms when the head drifts forward', () => {
    const warmth = segmentWarmth(fixture, 0, 0.25);
    const at = (name: string) => warmth[fixture.points.indexOf(name)] ?? -1;
    expect(at('head_top')).toBeGreaterThan(at('l_arm'));
    expect(Math.max(...warmth)).toBeCloseTo(1, 6);
  });
});
