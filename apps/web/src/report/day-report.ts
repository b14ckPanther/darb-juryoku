import { t, type Copy } from '../copy';
import type { ReportConfig } from '../config/runtime';
import {
  compareToAverage,
  dailySummaries,
  driftShareFrom,
  goodShare,
  longestDrift,
  pickObservation,
  ribbon,
  worstHour,
} from './engine';
import { clock, percent } from './format';
import type { MinuteBucket } from './types';

export interface DayReport {
  date: string;
  share: number | null;
  sittingMinutes: number;
  longestDrift: { minutes: number; start: number } | null;
  worstHour: { hour: number; share: number } | null;
  comparison: { average: number; delta: number } | null;
  ribbon: { start: number; states: string };
  observation: string | null;
}

/** Everything Today shows for one date, from all buckets (the average needs the days before it). */
export function buildDayReport(
  all: MinuteBucket[],
  date: string,
  config: ReportConfig,
  copy: Copy,
): DayReport {
  const day = all.filter((b) => b.day === date);
  const share = goodShare(day);
  const drift = longestDrift(day);
  const worst = worstHour(day, config.worst_hour_min_sitting_minutes);
  const comparison = compareToAverage(dailySummaries(all), date, config.average_window_days);
  const sittingSeconds = day.reduce((s, b) => s + b.good_s + b.drift_s, 0);
  const metrics = {
    good_share: share ?? undefined,
    delta_points: comparison ? Math.round(comparison.delta * 100) : undefined,
    afternoon_drift_share: driftShareFrom(day, config.afternoon_from_hour) ?? undefined,
    longest_drift_minutes: drift?.minutes,
    afternoon_drift_minutes:
      day
        .filter((b) => b.minute >= config.afternoon_from_hour * 60)
        .reduce((s, b) => s + b.drift_s, 0) / 60,
    worst_hour_share: worst?.share,
  };
  const slots = {
    afternoon_from: clock(config.afternoon_from_hour * 60),
    worst_hour: worst
      ? t(copy.units.clock_range, { from: clock(worst.hour * 60), to: clock(worst.hour * 60 + 60) })
      : copy.units.none,
    good_percent: share === null ? copy.units.none : `${percent(share)}%`,
  };
  return {
    date,
    share,
    sittingMinutes: sittingSeconds / 60,
    longestDrift: drift,
    worstHour: worst,
    comparison,
    ribbon: ribbon(day, config.ribbon_step_minutes),
    observation: share === null ? null : pickObservation(config.observations, metrics, slots),
  };
}
