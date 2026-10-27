// The app's screens by path. Pure, so matching and nav types are testable without a DOM.

export type ScreenId =
  | 'live'
  | 'welcome'
  | 'calibrate'
  | 'sentinel'
  | 'nudges'
  | 'today'
  | 'history'
  | 'day'
  | 'studio'
  | 'lab'
  | 'settings'
  | 'not_found';

export interface Match {
  screen: ScreenId;
  params: Record<string, string>;
}

const table: [RegExp, ScreenId, string[]][] = [
  [/^\/$/, 'live', []],
  [/^\/welcome$/, 'welcome', []],
  [/^\/calibrate$/, 'calibrate', []],
  [/^\/sentinel$/, 'sentinel', []],
  [/^\/nudges$/, 'nudges', []],
  [/^\/today$/, 'today', []],
  [/^\/history$/, 'history', []],
  [/^\/history\/(\d{4}-\d{2}-\d{2})$/, 'day', ['date']],
  [/^\/studio$/, 'studio', []],
  [/^\/lab$/, 'lab', []],
  [/^\/settings$/, 'settings', []],
];

export function matchRoute(pathname: string): Match {
  const path = pathname.replace(/\/+$/, '') || '/';
  for (const [re, screen, names] of table) {
    const m = re.exec(path);
    if (m) return { screen, params: Object.fromEntries(names.map((n, i) => [n, m[i + 1] ?? ''])) };
  }
  return { screen: 'not_found', params: {} };
}

/** Depth for directional transitions: a day report sits one level under History. */
const depth = (screen: ScreenId) => (screen === 'day' ? 1 : 0);

/** The view transition type for a navigation: forward or back in depth, else a lateral fade. */
export function navType(from: ScreenId, to: ScreenId): 'nav-forward' | 'nav-back' | 'nav-lateral' {
  const d = depth(to) - depth(from);
  return d > 0 ? 'nav-forward' : d < 0 ? 'nav-back' : 'nav-lateral';
}
