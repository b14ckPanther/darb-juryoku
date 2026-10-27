// Runtime config other than app.yaml: report rules, nudges, settings defaults and the guided protocol.
// Each file is validated at load against its schema in packages/schemas/config.
import rawNudges from '../../../../config/nudges.yaml?raw';
import rawProtocol from '../../../../config/protocols/guided.yaml?raw';
import rawReport from '../../../../config/report.yaml?raw';
import rawSettings from '../../../../config/settings.yaml?raw';
import nudgesSchema from '../../../../packages/schemas/config/nudges.schema.json';
import protocolSchema from '../../../../packages/schemas/config/protocols/guided.schema.json';
import reportSchema from '../../../../packages/schemas/config/report.schema.json';
import settingsSchema from '../../../../packages/schemas/config/settings.schema.json';
import type { ObservationRule } from '../report/engine';
import type { PostureClass } from '../report/types';
import { makeConfigParser } from './parse-config';

export interface ReportConfig {
  ribbon_step_minutes: number;
  average_window_days: number;
  worst_hour_min_sitting_minutes: number;
  streak_goal: number;
  afternoon_from_hour: number;
  heatmap_hours: { from: number; to: number };
  history_days: { week: number; month: number };
  observations: ObservationRule[];
}

export interface NudgeConfig {
  notify_after_minutes: number;
  cooldown_minutes: number;
  snooze_minutes: number;
  max_visible: 1;
  style_default: 'glow' | 'glow_notify';
  chime_default: boolean;
  quiet_hours_default: { enabled: boolean; from: string; to: string };
}

export interface SettingsConfig {
  sensitivity: { min: number; max: number; default: number };
  sample_rates_hz: number[];
  retention_days_options: number[];
  calibration_hold_seconds: number;
  budokai_enabled_default: boolean;
  shortcuts: { pause: string; calibrate: string; sentinel: string; help: string };
  sentinel_window: { width: number; height: number };
}

export interface ProtocolConfig {
  id: string;
  steps: { id: string; label: PostureClass; side?: 'left' | 'right'; seconds: number }[];
  passive: { prompts_per_hour: { min: number; max: number; default: number } };
  lighting: string[];
  chairs: string[];
  cameras: string[];
}

const inRange = (r: { min: number; max: number; default: number }, name: string) =>
  r.min <= r.default && r.default <= r.max ? [] : [`${name}.default must lie between min and max`];

export const parseReportConfig = makeConfigParser<ReportConfig>(reportSchema, (c) =>
  c.heatmap_hours.from <= c.heatmap_hours.to
    ? []
    : ['heatmap_hours.from is after heatmap_hours.to'],
);
export const parseNudgeConfig = makeConfigParser<NudgeConfig>(nudgesSchema);
export const parseSettingsConfig = makeConfigParser<SettingsConfig>(settingsSchema, (c) =>
  inRange(c.sensitivity, 'sensitivity'),
);
export const parseProtocolConfig = makeConfigParser<ProtocolConfig>(protocolSchema, (c) =>
  inRange(c.passive.prompts_per_hour, 'passive.prompts_per_hour'),
);

export const reportConfig = parseReportConfig(rawReport, 'config/report.yaml');
export const nudgeConfig = parseNudgeConfig(rawNudges, 'config/nudges.yaml');
export const settingsConfig = parseSettingsConfig(rawSettings, 'config/settings.yaml');
export const protocolConfig = parseProtocolConfig(rawProtocol, 'config/protocols/guided.yaml');
