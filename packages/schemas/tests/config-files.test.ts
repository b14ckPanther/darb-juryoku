import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const configDir = join(repoRoot, 'config');
const schemaDir = join(repoRoot, 'packages/schemas/config');

const configFiles = readdirSync(configDir).filter((f) => f.endsWith('.yaml'));
const schemaFor = (file: string) => join(schemaDir, `${basename(file, '.yaml')}.schema.json`);

describe('config files', () => {
  it('finds at least one config file', () => {
    expect(configFiles.length).toBeGreaterThan(0);
  });

  it.each(configFiles)('%s has a schema and validates against it', (file) => {
    const schema: object = JSON.parse(readFileSync(schemaFor(file), 'utf8'));
    const validate = new Ajv2020({ allErrors: true }).compile(schema);
    const data: unknown = parse(readFileSync(join(configDir, file), 'utf8'));
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });
});
