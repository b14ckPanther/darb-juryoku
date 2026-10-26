import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import { parse } from 'yaml';
import tokensSchema from '../../../../../packages/schemas/config/design/tokens.schema.json';
import { ConfigError } from '../../config/load-config';

type ColourRef = string;
export type Theme = Record<string, ColourRef>;
export interface Spring {
  stiffness: number;
  damping: number;
  mass: number;
}
export interface TypeStep {
  size: number;
  line: number;
  tracking: number;
}
export interface ContrastGroup {
  min: number;
  foregrounds?: string[];
  backgrounds?: string[];
  pairs?: [string, string][];
}
export interface Direction {
  label: string;
  theme: 'dark' | 'light';
  overrides: Theme;
  features: { frame_marks: boolean; scan_grid: boolean };
}

export interface DesignTokensFile {
  palette: Record<string, string>;
  themes: { dark: Theme; light: Theme };
  contrast: Record<string, ContrastGroup>;
  distinguishable: { min_oklab_delta: number; pairs: [string, string][] };
  directions: Record<string, Direction>;
  type: {
    families: { display: string; ui: string };
    weights: Record<string, number>;
    scale: Record<string, TypeStep>;
  };
  space: { base_px: number; gutter_px: number; section_px: number };
  radius: Record<string, string>;
  elevation: Record<string, string>;
  layers: Record<string, number>;
  touch: { min_target_px: number; press_scale: number };
  material: { blur_px: number; saturate: number };
  motion: {
    springs: { settle: Spring; snappy: Spring; gentle: Spring } & Record<string, Spring>;
    durations_ms: { fast: number; base: number; slow: number; reduced_fade: number } & Record<
      string,
      number
    >;
    easings: Record<string, string>;
    sheet: { detents: number[]; dismiss_fraction: number; dismiss_velocity_px_s: number };
    swipe: { reveal_px: number; commit_fraction: number };
  };
  glow: {
    outline_width_px: number;
    outline_opacity: number;
    outline_dash: [number, number];
    rim_width_px: number;
    rim_blur_px: number;
    drift_warm_from: number;
    motes_max: number;
    bloom: { strength: number; radius: number; threshold: number };
    exposure: number;
  };
  sound: {
    chime: {
      file: string;
      sample_rate: number;
      duration_s: number;
      partials: [number, number, number][];
      attack_s: number;
      peak_dbfs: number;
    };
  };
}

/** Tokens plus every named colour (brand and derived palette) resolved to hex. */
export interface DesignTokens extends DesignTokensFile {
  colours: Record<string, string>;
}

export interface BrandTokens {
  color: Record<string, { hex: string }>;
}

export interface ResolvedColour {
  hex: string;
  alpha: number;
}

const ajv = new Ajv2020({ allErrors: true });
const validateTokens = ajv.compile<DesignTokensFile>(tokensSchema);

function describeError(error: ErrorObject): string {
  const path = error.instancePath || '/';
  if (error.keyword === 'required') {
    return `${path}: missing key "${String(error.params['missingProperty'])}"`;
  }
  if (error.keyword === 'additionalProperties') {
    return `${path}: unknown key "${String(error.params['additionalProperty'])}"`;
  }
  return `${path}: ${error.message ?? 'is invalid'}`;
}

export function resolveColour(ref: string, colours: Record<string, string>): ResolvedColour {
  const [name = '', percent] = ref.split('/');
  const hex = name.startsWith('#') ? name.toUpperCase() : colours[name];
  if (!hex)
    throw new ConfigError(`Unknown colour "${name}" (not in the brand palette or tokens palette)`);
  return { hex, alpha: percent === undefined ? 1 : Number(percent) / 100 };
}

function themeRefs(file: DesignTokensFile): [string, string][] {
  const refs: [string, string][] = [];
  for (const [theme, roles] of Object.entries(file.themes)) {
    for (const [role, ref] of Object.entries(roles)) refs.push([`/themes/${theme}/${role}`, ref]);
  }
  for (const [dir, direction] of Object.entries(file.directions)) {
    for (const [role, ref] of Object.entries(direction.overrides))
      refs.push([`/directions/${dir}/overrides/${role}`, ref]);
  }
  return refs;
}

export function parseDesignTokens(
  rawYaml: string,
  brand: BrandTokens,
  source: string,
): DesignTokens {
  const data: unknown = parse(rawYaml);
  if (!validateTokens(data)) {
    const details = (validateTokens.errors ?? []).map(describeError).join('; ');
    throw new ConfigError(`Invalid design tokens in ${source}: ${details}`);
  }

  const colours: Record<string, string> = {};
  for (const [name, { hex }] of Object.entries(brand.color)) colours[name] = hex.toUpperCase();
  for (const [name, hex] of Object.entries(data.palette)) {
    if (name in colours)
      throw new ConfigError(`${source}: palette colour "${name}" shadows a brand colour`);
    colours[name] = hex.toUpperCase();
  }

  const problems: string[] = [];
  for (const [path, ref] of themeRefs(data)) {
    try {
      resolveColour(ref, colours);
    } catch (error) {
      problems.push(`${path}: ${(error as Error).message}`);
    }
  }
  const roles = Object.keys(data.themes.dark);
  for (const [dir, direction] of Object.entries(data.directions)) {
    for (const role of Object.keys(direction.overrides)) {
      if (!roles.includes(role))
        problems.push(`/directions/${dir}/overrides: "${role}" is not a theme role`);
    }
  }
  if (problems.length > 0)
    throw new ConfigError(`Invalid design tokens in ${source}: ${problems.join('; ')}`);

  return { ...data, colours };
}

/** The roles of a theme or direction scope with every colour resolved. */
export function resolveScope(tokens: DesignTokens, scope: string): Record<string, ResolvedColour> {
  const [kind, name = ''] = scope.split(':');
  let roles: Theme;
  if (kind === 'theme') {
    roles = tokens.themes[name as 'dark' | 'light'];
  } else {
    const direction = tokens.directions[name];
    if (!direction) throw new ConfigError(`Unknown direction "${name}"`);
    roles = { ...tokens.themes[direction.theme], ...direction.overrides };
  }
  return Object.fromEntries(
    Object.entries(roles).map(([role, ref]) => [role, resolveColour(ref, tokens.colours)]),
  );
}

export function scopes(tokens: DesignTokens): string[] {
  return [
    ...Object.keys(tokens.themes).map((t) => `theme:${t}`),
    ...Object.keys(tokens.directions).map((d) => `direction:${d}`),
  ];
}
