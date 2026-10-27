import { stringify } from 'yaml';
import type { SeedSessions } from './generate-sessions';

const HEADER = `# Demo only. GENERATED from recipe.yaml by \`pnpm --filter web seed\`; do not edit by hand.
# A synthetic sitter, not a real person. One letter per minute of each session; \`codes\` names them.
`;

/** The text of config/seed/demo/sessions.yaml for a generated seed. */
export const sessionsYaml = (seed: SeedSessions) => HEADER + stringify(seed, { lineWidth: 0 });
