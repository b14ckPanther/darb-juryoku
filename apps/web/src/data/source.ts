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
type RealLoader = (now: Date) => Promise<DataSnapshot>;

/** Real mode reads what the live session stored on this device; no storage means nothing yet. */
const readReal: RealLoader = async (now) => {
  try {
    const [{ db }, { readSnapshot }] = await Promise.all([
      import('../storage/db'),
      import('../storage/minutes'),
    ]);
    return await readSnapshot(db(), now);
  } catch {
    return emptySnapshot(now);
  }
};

const importDemo: DemoLoader = async () => (await import('./demo-seed')).loadDemoSnapshot();

/** The data the app runs on. The demo seed is loaded only in demo mode. */
export async function loadSnapshot(
  demo: boolean,
  now: Date = new Date(),
  loadDemo: DemoLoader = importDemo,
  loadReal: RealLoader = readReal,
): Promise<DataSnapshot> {
  return demo ? loadDemo() : loadReal(now);
}
