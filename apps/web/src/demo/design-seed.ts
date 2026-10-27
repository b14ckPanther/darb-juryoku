import Ajv2020 from 'ajv/dist/2020';
import { parse } from 'yaml';
import seedSchema from '../../../../packages/schemas/config/seed/demo/design.schema.json';
import { ConfigError } from '../config/load-config';

type Strings<K extends string> = Record<K, string>;
export interface Fact {
  label: string;
  value: string;
}
interface Prompt {
  title: string;
  body: string;
  action: string;
}

/** Demo-only copy and sample data for the /design routes (config/seed/demo/design.yaml). */
export interface DesignSeed {
  banner: Strings<'demo' | 'demo_detail'>;
  nav: { label: string; home: string; links: { href: string; label: string }[] };
  home: Strings<'intro' | 'cta'>;
  theme_switch: { label: string; options: Strings<'dark' | 'light'> };
  directions: {
    title: string;
    intro: string;
    match_label: string;
    pick_label: string;
    notes: Record<string, string>;
    decision: Strings<'title' | 'body'>;
  };
  mirror: {
    states: Strings<'upright' | 'drifting' | 'forward_head'>;
    state_from: { upright: number; drifting: number };
    session_label: string;
    session_value: string;
    open_sentinel: string;
    pause: string;
    image_label: string;
  };
  today: {
    title: string;
    date: string;
    hero_value: string;
    hero_unit: string;
    hero_label: string;
    ribbon: {
      start: string;
      bucket_minutes: number;
      states: string;
      labels: Strings<'G' | 'D' | 'A'>;
      title: string;
    };
    facts: Fact[];
    observation: string;
    tabs: Strings<'today' | 'history' | 'live' | 'settings'>;
  };
  gallery: {
    title: string;
    intro: string;
    sections: Strings<
      'buttons' | 'controls' | 'lists' | 'feedback' | 'data' | 'model' | 'states' | 'glyphs'
    >;
    state_labels: Strings<'default' | 'disabled' | 'loading'>;
    buttons: Strings<
      | 'primary'
      | 'quiet'
      | 'destructive'
      | 'loading'
      | 'icon_pause'
      | 'icon_settings'
      | 'icon_sentinel'
    >;
    segmented: { label: string; options: string[] };
    toggle: Strings<'label' | 'detail'>;
    slider: { label: string; min: number; max: number; value: number; value_labels: string[] };
    settings_title: string;
    rows: Fact[];
    history_title: string;
    history_rows: Fact[];
    swipe_actions: Strings<'export' | 'delete'>;
    swipe_action_name: string;
    swipe_hint: string;
    sheet: { open: string; title: string; body: string; close: string; options: string[] };
    nudge: Strings<'title' | 'body' | 'primary' | 'secondary'>;
    toast: string;
    chime: string;
    banner_warning: string;
    chart_table_toggle: Strings<'show' | 'hide'>;
  };
  history: {
    bars_title: string;
    bars: { label: string; value: number }[];
    heatmap_title: string;
    heatmap: { rows: string[]; columns: string[]; values: number[][] };
  };
  model: {
    title: string;
    name: string;
    version: string;
    data_version: string;
    classes: string[];
    class_labels: Record<string, string>;
    facts: Fact[];
    confusion_title: string;
    confusion_axis: Strings<'actual' | 'predicted'>;
    confusion: number[][];
  };
  permission: Record<'prompt' | 'denied' | 'missing', Prompt>;
  empty: Prompt;
  glyphs: Strings<'upright' | 'slouch' | 'forward_head' | 'lean_side'>;
  overlay: {
    title: string;
    intro: string;
    match_label: string;
    renderer_label: string;
    renderers: Strings<'webgl' | 'canvas'>;
    motion_label: string;
    motion_options: Strings<'full' | 'reduced'>;
    figure_label: string;
  };
  mobile: { title: string; compact_title: string; sections: Strings<'day' | 'facts' | 'recent'> };
}

const validateSeed = new Ajv2020({ allErrors: true }).compile<DesignSeed>(seedSchema);

function shapeProblems(seed: DesignSeed): string[] {
  const problems: string[] = [];
  const { rows, columns, values } = seed.history.heatmap;
  if (values.length !== rows.length)
    problems.push(`heatmap has ${values.length} rows, needs ${rows.length}`);
  values.forEach((row, i) => {
    if (row.length !== columns.length)
      problems.push(`heatmap row ${i + 1} has ${row.length} values, needs ${columns.length}`);
  });
  const n = seed.model.classes.length;
  if (seed.model.confusion.length !== n)
    problems.push(`confusion has ${seed.model.confusion.length} rows, needs ${n}`);
  seed.model.confusion.forEach((row, i) => {
    if (row.length !== n)
      problems.push(`confusion row ${i + 1} has ${row.length} values, needs ${n}`);
  });
  for (const c of seed.model.classes) {
    if (!seed.model.class_labels[c]) problems.push(`class "${c}" has no label`);
  }
  const { min, max, value_labels } = seed.gallery.slider;
  if (value_labels.length !== max - min + 1) problems.push('slider needs one value label per step');
  return problems;
}

export function parseDesignSeed(rawYaml: string, source: string): DesignSeed {
  const data: unknown = parse(rawYaml);
  if (!validateSeed(data)) {
    const details = (validateSeed.errors ?? [])
      .map((e) => `${e.instancePath || '/'}: ${e.message ?? 'is invalid'}`)
      .join('; ');
    throw new ConfigError(`Invalid demo seed in ${source}: ${details}`);
  }
  const problems = shapeProblems(data);
  if (problems.length > 0)
    throw new ConfigError(`Invalid demo seed in ${source}: ${problems.join('; ')}`);
  return data;
}
