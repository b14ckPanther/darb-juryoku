import { useEffect, useState } from 'react';

export type ThemeName = 'dark' | 'light';
const KEY = 'juryoku.theme';

function initialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage can be blocked; fall back to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** The theme on <html data-theme>, starting from the system preference and remembered per viewer. */
export function useTheme(): [ThemeName, (t: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    // Keep the browser chrome on the page colour (the meta tag starts on night, the default theme).
    const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
    if (surface)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // A per-viewer convenience only.
    }
  }, [theme]);
  return [theme, setTheme];
}
