import { t, type Copy } from '../copy';

/** 09:05 for minute 545 of the day. */
export const clock = (minute: number) =>
  `${String(Math.floor(minute / 60) % 24).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

/** 50 min, 1 h, 1 h 12 min. */
export function duration(minutes: number, units: Copy['units']) {
  const m = Math.round(minutes);
  if (m < 60) return t(units.minutes, { n: m });
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? t(units.hours_even, { h }) : t(units.hours, { h, m: m % 60 });
}

/** +11 points or −4 points, from a share difference (0.11). */
export function points(delta: number, units: Copy['units']) {
  const n = Math.round(delta * 100);
  return t(units.points, { sign: n > 0 ? units.plus : n < 0 ? units.minus : '', n: Math.abs(n) });
}

export const percent = (share: number) => Math.round(share * 100);

/** Monday, 26 October, in the copy's locale. */
export const longDate = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

/** 26 Oct. */
export const shortDate = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );

export const weekdayName = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );

/** The clock time `minutes` from now, for "Snoozed until 15:42". */
export const clockAfter = (minutes: number, now: Date = new Date()) =>
  clock(now.getHours() * 60 + now.getMinutes() + minutes);

/** The date `n` days after a local date ('2026-10-26'), as a date string. */
export const addDays = (date: string, n: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
