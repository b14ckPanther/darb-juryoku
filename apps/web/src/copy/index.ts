import rawCopy from '../../../../config/copy/en.yaml?raw';
import copySchema from '../../../../packages/schemas/config/copy/en.schema.json';
import { makeConfigParser } from '../config/parse-config';
import type { Copy } from './copy.gen';

export type { Copy } from './copy.gen';

/** Every user-facing string (config/copy/en.yaml), validated at load and typed from the file. */
export const copy = makeConfigParser<Copy>(copySchema)(rawCopy, 'config/copy/en.yaml');

/** Fills `{name}` slots in a copy template. Numbers are written as given. */
export const t = (template: string, values: Record<string, string | number> = {}) =>
  template.replaceAll(/\{(\w+)\}/g, (slot, key: string) =>
    values[key] === undefined ? slot : String(values[key]),
  );
