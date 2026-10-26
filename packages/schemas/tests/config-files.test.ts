import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const configDir = join(repoRoot, 'config');
const schemaDir = join(repoRoot, 'packages/schemas/config');

// Every YAML file under config/ (any depth) has a schema at the same relative path under packages/schemas/config/.
const configFiles = (readdirSync(configDir, { recursive: true }) as string[])
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => relative(configDir, join(configDir, f)))
  .sort();
const schemaFor = (file: string) => join(schemaDir, file.replace(/\.yaml$/, '.schema.json'));

describe('config files', () => {
  it('finds the config files, including nested ones', () => {
    expect(configFiles).toContain('app.yaml');
    expect(configFiles).toContain('design/tokens.yaml');
  });

  it.each(configFiles)('%s has a schema and validates against it', (file) => {
    const schema: object = JSON.parse(readFileSync(schemaFor(file), 'utf8'));
    const validate = new Ajv2020({ allErrors: true }).compile(schema);
    const data: unknown = parse(readFileSync(join(configDir, file), 'utf8'));
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });
});
