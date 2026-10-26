import Ajv2020 from 'ajv/dist/2020';
import { parse } from 'yaml';
import fixtureSchema from '../../../../packages/schemas/config/seed/demo/pose-fixture.schema.json';
import { ConfigError } from '../config/load-config';

export type Point = [number, number];
export type Pose = Record<string, Point>;
export type Region = 'head' | 'neck' | 'shoulders';

export interface PoseFixture {
  frame: { width: number; height: number };
  points: string[];
  regions: Record<string, Region>;
  ideal: Pose;
  drift: Pose;
}

const validateFixture = new Ajv2020({ allErrors: true }).compile<PoseFixture>(fixtureSchema);

export function parsePoseFixture(rawYaml: string, source: string): PoseFixture {
  const data: unknown = parse(rawYaml);
  if (!validateFixture(data)) {
    const details = (validateFixture.errors ?? [])
      .map((e) => `${e.instancePath || '/'}: ${e.message ?? 'is invalid'}`)
      .join('; ');
    throw new ConfigError(`Invalid pose fixture in ${source}: ${details}`);
  }
  const missing: string[] = [];
  for (const name of data.points) {
    for (const key of ['ideal', 'drift', 'regions'] as const) {
      if (!(name in data[key])) missing.push(`${key} has no "${name}"`);
    }
  }
  if (missing.length > 0)
    throw new ConfigError(`Invalid pose fixture in ${source}: ${missing.join('; ')}`);
  return data;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** The sitter between their ideal pose (t = 0) and the drift pose (t = 1). */
export function mixPose(fixture: PoseFixture, t: number): Pose {
  const k = clamp01(t);
  const pose: Pose = {};
  for (const name of fixture.points) {
    const [ax, ay] = fixture.ideal[name] ?? [0, 0];
    const [bx, by] = fixture.drift[name] ?? [0, 0];
    pose[name] = k === 0 ? [ax, ay] : k === 1 ? [bx, by] : [ax + (bx - ax) * k, ay + (by - ay) * k];
  }
  return pose;
}

/** Contour points in drawing order, scaled to a width x height canvas. */
export function contour(fixture: PoseFixture, pose: Pose, width: number, height: number): Point[] {
  return fixture.points.map((name) => {
    const [x, y] = pose[name] ?? [0, 0];
    return [Math.round(x * width * 1000) / 1000, Math.round(y * height * 1000) / 1000];
  });
}

/** Uniform Catmull-Rom spline through every control point, `samples` steps per span. */
export function catmullRom(control: Point[], samples: number): Point[] {
  if (control.length < 2) return [...control];
  const at = (i: number): Point => control[Math.min(control.length - 1, Math.max(0, i))] ?? [0, 0];
  const out: Point[] = [];
  for (let i = 0; i < control.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < samples; s++) {
      const t = s / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push(
        s === 0 ? [p1[0], p1[1]] : [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])],
      );
    }
  }
  const last = control[control.length - 1] ?? [0, 0];
  out.push([last[0], last[1]]);
  return out;
}

/** How strongly the body edge glows for a match strength m: eased so a half match reads as clearly dimmer. */
export function rimIntensity(m: number): number {
  const k = clamp01(m);
  return k * k;
}

/**
 * Per contour point, how far the outline has warmed toward the drift colour (0..1). Nothing warms until
 * drift (1 - m) passes `warmFrom`; then the points that moved furthest from the ideal warm first.
 */
export function segmentWarmth(fixture: PoseFixture, m: number, warmFrom: number): number[] {
  const drift = 1 - clamp01(m);
  const ramp = clamp01((drift - warmFrom) / (1 - warmFrom));
  const distances = fixture.points.map((name) => {
    const [ax, ay] = fixture.ideal[name] ?? [0, 0];
    const [bx, by] = fixture.drift[name] ?? [0, 0];
    return Math.hypot((bx - ax) * fixture.frame.width, (by - ay) * fixture.frame.height);
  });
  const max = Math.max(...distances) || 1;
  return distances.map((d) => (ramp === 0 ? 0 : (d / max) * ramp));
}
