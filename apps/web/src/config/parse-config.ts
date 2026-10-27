import Ajv2020 from 'ajv/dist/2020';
import { parse } from 'yaml';
import { ConfigError, describeError } from './load-config';

const ajv = new Ajv2020({ allErrors: true });

/**
 * A parser for one config file: YAML, validated against its JSON Schema, then an optional check for
 * rules a schema cannot express (lengths that must match, keys that must exist elsewhere).
 * Bad config fails fast with the file, the path and the problem.
 */
export function makeConfigParser<T>(schema: object, check?: (data: T) => string[]) {
  const validate = ajv.compile<T>(schema);
  return (rawYaml: string, source: string): T => {
    const data: unknown = parse(rawYaml);
    if (!validate(data)) {
      const details = (validate.errors ?? []).map(describeError).join('; ');
      throw new ConfigError(`Invalid config in ${source}: ${details}`);
    }
    const problems = check?.(data) ?? [];
    if (problems.length > 0) throw new ConfigError(`${source}: ${problems.join('; ')}`);
    return data;
  };
}
