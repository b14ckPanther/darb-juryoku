import { createContext, use, useState, type ReactNode } from 'react';
import { appConfig } from '../config/app-config';
import { nudgeConfig, settingsConfig } from '../config/runtime';

export interface Prefs {
  camera: string;
  sensitivity: number;
  style: 'glow' | 'glow_notify';
  chime: boolean;
  quiet: { enabled: boolean; from: string; to: string };
  sampleHz: number;
  retentionDays: number;
  budokai: { enabled: boolean; url: string; key: string; secret: string };
}

/** Settings start from config; the user's changes override them (kept in memory until Phase 8 stores them). */
export const defaultPrefs = (camera: string): Prefs => ({
  camera,
  sensitivity: settingsConfig.sensitivity.default,
  style: nudgeConfig.style_default,
  chime: nudgeConfig.chime_default,
  quiet: nudgeConfig.quiet_hours_default,
  sampleHz: appConfig.sample_hz,
  retentionDays: appConfig.retention_days,
  budokai: { enabled: settingsConfig.budokai_enabled_default, url: '', key: '', secret: '' },
});

const PrefsContext = createContext<[Prefs, (p: Partial<Prefs>) => void] | null>(null);

export function PrefsProvider({ camera, children }: { camera: string; children: ReactNode }) {
  const [prefs, setPrefs] = useState(() => defaultPrefs(camera));
  const update = (p: Partial<Prefs>) => setPrefs((old) => ({ ...old, ...p }));
  return <PrefsContext value={[prefs, update]}>{children}</PrefsContext>;
}

export function usePrefs() {
  const value = use(PrefsContext);
  if (!value) throw new Error('usePrefs needs a PrefsProvider');
  return value;
}
