import type { DataSnapshot } from './types';

export const localDate = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Real mode until the session engine stores minutes (Phase 4 and 8): nothing recorded yet. */
export const emptySnapshot = (now: Date): DataSnapshot => ({
  demo: false,
  today: localDate(now),
  sessions: [],
  buckets: [],
  library: null,
});

type DemoLoader = () => Promise<DataSnapshot>;

const importDemo: DemoLoader = async () => (await import('./demo-seed')).loadDemoSnapshot();

/** The data the app runs on. The demo seed is loaded only in demo mode. */
export async function loadSnapshot(
  demo: boolean,
  now: Date = new Date(),
  loadDemo: DemoLoader = importDemo,
): Promise<DataSnapshot> {
  return demo ? loadDemo() : emptySnapshot(now);
}
