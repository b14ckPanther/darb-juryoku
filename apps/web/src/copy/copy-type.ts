import { parse } from 'yaml';

const HEADER = `// Generated from config/copy/en.yaml by \`pnpm --filter web copy:types\`. Do not edit by hand.
`;

const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);

function shape(value: unknown, indent: string): string {
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return 'string[]';
  const entries = Object.entries(value as Record<string, unknown>);
  const inner = `${indent}  `;
  return `{\n${entries.map(([k, v]) => `${inner}${key(k)}: ${shape(v, inner)};`).join('\n')}\n${indent}}`;
}

/** The TypeScript shape of the copy file, so a missing or misspelt string fails the typecheck. */
export function copyTypeSource(rawYaml: string): string {
  return `${HEADER}export interface Copy ${shape(parse(rawYaml), '')}\n`;
}
