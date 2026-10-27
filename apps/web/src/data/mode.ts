const KEY = 'juryoku.demo';

interface ModeInput {
  search: string;
  /** The remembered choice, if any ('1' or '0'). */
  stored: string | null;
  /** True when the build runs in Vite's demo mode (`vite --mode demo`). */
  buildDefault: boolean;
}

/**
 * Demo mode: `?demo=1` turns it on and `?demo=0` off (and the choice is remembered); otherwise the
 * remembered choice, otherwise the build's default. Real data is never mixed with seed data.
 */
export function resolveDemo({ search, stored, buildDefault }: ModeInput): boolean {
  const asked = new URLSearchParams(search).get('demo');
  if (asked === '1' || asked === '0') return asked === '1';
  if (stored === '1' || stored === '0') return stored === '1';
  return buildDefault;
}

export function readDemoMode(): boolean {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch {
    // Storage can be blocked; the URL and the build default still decide.
  }
  const demo = resolveDemo({
    search: window.location.search,
    stored,
    buildDefault: import.meta.env.MODE === 'demo',
  });
  rememberDemoMode(demo);
  return demo;
}

export function rememberDemoMode(demo: boolean) {
  try {
    localStorage.setItem(KEY, demo ? '1' : '0');
  } catch {
    // A per-viewer convenience only.
  }
}
