import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import { parse } from 'yaml';
import appSchema from '../../../../packages/schemas/config/app.schema.json';

export interface AppConfig {
  name: string;
  sample_hz: number;
  camera: { width: number; height: number };
  classify_every_samples: number;
  window_samples: number;
  retention_days: number;
}

export class ConfigError extends Error {
  override name = 'ConfigError';
}

const ajv = new Ajv2020({ allErrors: true });
const validateApp = ajv.compile<AppConfig>(appSchema);

function describeError(error: ErrorObject): string {
  const path = error.instancePath || '/';
  if (error.keyword === 'additionalProperties') {
    return `${path}: unknown key "${String(error.params['additionalProperty'])}"`;
  }
  if (error.keyword === 'required') {
    return `${path}: missing key "${String(error.params['missingProperty'])}"`;
  }
  return `${path}: ${error.message ?? 'is invalid'}`;
}

export function parseAppConfig(rawYaml: string, source: string): AppConfig {
  const data: unknown = parse(rawYaml);
  if (!validateApp(data)) {
    const details = (validateApp.errors ?? []).map(describeError).join('; ');
    throw new ConfigError(`Invalid config in ${source}: ${details}`);
  }
  return data;
}
