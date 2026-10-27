import rawGolden from '../../../../ml/tests/fixtures/features.golden.json?raw';
import { describe, expect, it } from 'vitest';
import { featuresConfig, rawFeaturesYaml } from '../config/posture';
import {
  baseFeatures,
  calibrate,
  featureNames,
  featureVector,
  featuresHash,
  type Landmarks,
} from './features';

interface Golden {
  features_hash: string;
  names: string[];
  aspect: number;
  cases: { ideal: number[][]; landmarks: number[][]; vector: number[] }[];
}

const golden = JSON.parse(rawGolden) as Golden;

describe('features parity with the Python pipeline (ml/tests/fixtures/features.golden.json)', () => {
  it('hashes config/features.yaml exactly as Python does', async () => {
    expect(await featuresHash(rawFeaturesYaml)).toBe(golden.features_hash);
  });

  it('names the vector in the same order', () => {
    expect(featureNames(featuresConfig)).toEqual(golden.names);
  });

  it.each(golden.cases.map((c, i) => [i, c] as const))('case %i matches to 1e-9', (_, c) => {
    const ideal = baseFeatures(c.ideal as Landmarks, golden.aspect, featuresConfig);
    const got = featureVector(c.landmarks as Landmarks, ideal, golden.aspect, featuresConfig);
    expect(got).toHaveLength(c.vector.length);
    got.forEach((v, i) => expect(v).toBeCloseTo(c.vector[i] ?? NaN, 9));
  });
});

describe('calibrate', () => {
  it('takes the median of each coordinate', () => {
    const frame = (y: number): Landmarks => Array.from({ length: 33 }, () => [0.5, y, 0, 1]);
    expect(calibrate([frame(0.1), frame(0.2), frame(0.9)])[0]?.[1]).toBeCloseTo(0.2);
    expect(calibrate([frame(0.1), frame(0.2)])[0]?.[1]).toBeCloseTo(0.15);
  });

  it('refuses an empty hold', () => {
    expect(() => calibrate([])).toThrow();
  });
});
