import { describe, expect, it } from 'vitest';
import {
  nudgeConfig,
  parseReportConfig,
  parseSettingsConfig,
  protocolConfig,
  reportConfig,
  settingsConfig,
} from './runtime';

describe('runtime config', () => {
  it('loads the committed files', () => {
    expect(reportConfig.observations.length).toBeGreaterThan(0);
    expect(nudgeConfig.notify_after_minutes).toBeGreaterThan(0);
    expect(settingsConfig.shortcuts.help).toHaveLength(1);
    expect(protocolConfig.steps.map((s) => s.label)).toContain('lean_side');
  });

  it('rejects a heatmap whose start is after its end', () => {
    const yaml = `ribbon_step_minutes: 10
average_window_days: 7
worst_hour_min_sitting_minutes: 20
streak_goal: 0.75
afternoon_from_hour: 15
heatmap_hours: { from: 20, to: 9 }
history_days: { week: 7, month: 21 }
observations: [{ when: [], text: x }]
`;
    expect(() => parseReportConfig(yaml, 'report.yaml')).toThrow(/heatmap_hours/);
  });

  it('rejects a default sensitivity outside its range', () => {
    const yaml = `sensitivity: { min: 1, max: 5, default: 9 }
sample_rates_hz: [5]
retention_days_options: [30]
calibration_hold_seconds: 3
budokai_enabled_default: false
shortcuts: { pause: ' ', calibrate: c, sentinel: p, help: '?' }
sentinel_window: { width: 240, height: 180 }
toast_seconds: 3
`;
    expect(() => parseSettingsConfig(yaml, 'settings.yaml')).toThrow(/sensitivity\.default/);
  });
});
