import { describe, expect, it } from 'vitest';
import { ConfigError } from './load-config';
import { makeConfigParser } from './parse-config';

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['minutes'],
  properties: { minutes: { type: 'integer', minimum: 1 } },
};

describe('makeConfigParser', () => {
  const parse = makeConfigParser<{ minutes: number }>(schema);

  it('returns typed data for valid yaml', () => {
    expect(parse('minutes: 4\n', 'x.yaml').minutes).toBe(4);
  });

  it('names the file, the path and the problem', () => {
    expect(() => parse('minutes: 0\n', 'nudges.yaml')).toThrow(ConfigError);
    expect(() => parse('minutes: 0\n', 'nudges.yaml')).toThrow(/nudges\.yaml.*\/minutes/);
  });

  it('names unknown and missing keys', () => {
    expect(() => parse('minutes: 1\nminuets: 2\n', 'a.yaml')).toThrow(/unknown key "minuets"/);
    expect(() => parse('{}\n', 'a.yaml')).toThrow(/missing key "minutes"/);
  });

  it('runs an extra check after the schema passes', () => {
    const strict = makeConfigParser<{ minutes: number }>(schema, (d) =>
      d.minutes > 10 ? ['minutes is more than 10'] : [],
    );
    expect(() => strict('minutes: 11\n', 'a.yaml')).toThrow(/a\.yaml: minutes is more than 10/);
  });
});
