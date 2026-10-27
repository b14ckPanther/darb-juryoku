// Regenerates src/copy/copy.gen.ts from config/copy/en.yaml (`pnpm --filter web copy:types`).
import { readFileSync, writeFileSync } from 'node:fs';
import { copyTypeSource } from '../src/copy/copy-type';

const raw = readFileSync(new URL('../../../config/copy/en.yaml', import.meta.url), 'utf8');
const target = new URL('../src/copy/copy.gen.ts', import.meta.url);
writeFileSync(target, copyTypeSource(raw));
console.log(`Wrote ${target.pathname}`);
