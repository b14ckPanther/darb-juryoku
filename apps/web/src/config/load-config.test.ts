import { describe, expect, it } from 'vitest';
import { ConfigError, parseAppConfig } from './load-config';

const validYaml = `
name: Test App
sample_hz: 5
camera: { width: 640, height: 480 }
classify_every_samples: 1
window_samples: 10
retention_days: 30
`;

describe('parseAppConfig', () => {
  it('returns typed config for valid yaml', () => {
    const config = parseAppConfig(validYaml, 'app.yaml');
    expect(config.name).toBe('Test App');
    expect(config.camera.width).toBe(640);
  });

  it('rejects a config with a missing required key and names the key', () => {
    const yaml = validYaml.replace('name: Test App\n', '');
    expect(() => parseAppConfig(yaml, 'app.yaml')).toThrow(ConfigError);
    expect(() => parseAppConfig(yaml, 'app.yaml')).toThrow(/app\.yaml.*name/);
  });

  it('rejects a non-positive sample rate and names the path', () => {
    const yaml = validYaml.replace('sample_hz: 5', 'sample_hz: 0');
    expect(() => parseAppConfig(yaml, 'app.yaml')).toThrow(/\/sample_hz/);
  });

  it('rejects a wrong type', () => {
    const yaml = validYaml.replace('width: 640', 'width: wide');
    expect(() => parseAppConfig(yaml, 'app.yaml')).toThrow(/\/camera\/width/);
  });

  it('rejects unknown keys so typos fail fast', () => {
    expect(() => parseAppConfig(`${validYaml}sampel_hz: 4\n`, 'app.yaml')).toThrow(/sampel_hz/);
  });

  it('rejects yaml that is not a mapping', () => {
    expect(() => parseAppConfig('- just\n- a list\n', 'app.yaml')).toThrow(ConfigError);
  });
});
