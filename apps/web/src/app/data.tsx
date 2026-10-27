import { createContext, use, useEffect, useReducer, useState, type ReactNode } from 'react';
import { copy } from '../copy';
import { loadSnapshot } from '../data/source';
import type { Calibration, DataSnapshot, Recording } from '../data/types';

export type DataAction =
  | { type: 'delete_day'; date: string }
  | { type: 'use_calibration'; id: string }
  | { type: 'add_calibration'; calibration: Omit<Calibration, 'active'> }
  | { type: 'use_model'; name: string | null }
  | { type: 'add_recording'; recording: Recording }
  | { type: 'delete_recording'; id: string }
  | { type: 'clear_recordings' }
  | { type: 'reset'; snapshot: DataSnapshot };

/** Changes the screens make. In demo mode they live in memory and a reload restores the seed. */
export function dataReducer(s: DataSnapshot, a: DataAction): DataSnapshot {
  const lib = s.library;
  switch (a.type) {
    case 'delete_day':
      return {
        ...s,
        buckets: s.buckets.filter((b) => b.day !== a.date),
        sessions: s.sessions.filter((x) => x.date !== a.date),
      };
    case 'reset':
      return a.snapshot;
  }
  if (!lib) return s;
  switch (a.type) {
    case 'use_calibration':
      return {
        ...s,
        library: {
          ...lib,
          calibrations: lib.calibrations.map((c) => ({ ...c, active: c.id === a.id })),
        },
      };
    case 'add_calibration':
      return {
        ...s,
        library: {
          ...lib,
          calibrations: [
            ...lib.calibrations.map((c) => ({ ...c, active: false })),
            { ...a.calibration, active: true },
          ],
        },
      };
    case 'use_model':
      return {
        ...s,
        library: { ...lib, models: lib.models.map((m) => ({ ...m, active: m.name === a.name })) },
      };
    case 'add_recording':
      return { ...s, library: { ...lib, recordings: [...lib.recordings, a.recording] } };
    case 'delete_recording':
      return {
        ...s,
        library: { ...lib, recordings: lib.recordings.filter((r) => r.id !== a.id) },
      };
    case 'clear_recordings':
      return { ...s, library: { ...lib, recordings: [] } };
  }
}

interface DataValue {
  data: DataSnapshot;
  dispatch: (a: DataAction) => void;
  /** The snapshot as first loaded, for "delete all" in the demo. */
  initial: DataSnapshot;
}

const DataContext = createContext<DataValue | null>(null);

type Status =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; snapshot: DataSnapshot };

export type Preview = 'loading' | 'error' | 'empty' | null;

/**
 * Loads the data once and serves it to every screen. `preview` forces the loading, error or empty
 * state so each can be reviewed (`?state=loading` and so on).
 */
export function DataProvider({
  demo,
  preview,
  children,
  renderLoading,
  renderError,
}: {
  demo: boolean;
  preview: Preview;
  children: ReactNode;
  renderLoading: () => ReactNode;
  renderError: (message: string, retry: () => void) => ReactNode;
}) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    if (preview === 'loading' || preview === 'error') return;
    loadSnapshot(demo)
      .then((snapshot) => {
        if (!live) return;
        const shown =
          preview === 'empty'
            ? {
                ...snapshot,
                buckets: [],
                sessions: [],
                library: snapshot.library && { ...snapshot.library, recordings: [], models: [] },
              }
            : snapshot;
        setStatus({ kind: 'ready', snapshot: shown });
      })
      .catch(
        (e: unknown) =>
          live && setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) }),
      );
    return () => {
      live = false;
    };
  }, [demo, preview, attempt]);

  const shown: Status =
    preview === 'loading'
      ? { kind: 'loading' }
      : preview === 'error'
        ? { kind: 'error', message: copy.states.error_preview }
        : status;
  if (shown.kind === 'loading') return renderLoading();
  if (shown.kind === 'error')
    return renderError(shown.message, () => {
      setStatus({ kind: 'loading' });
      setAttempt((n) => n + 1);
    });
  return <Loaded initial={shown.snapshot}>{children}</Loaded>;
}

function Loaded({ initial, children }: { initial: DataSnapshot; children: ReactNode }) {
  const [data, dispatch] = useReducer(dataReducer, initial);
  return <DataContext value={{ data, dispatch, initial }}>{children}</DataContext>;
}

export function useData(): DataValue {
  const value = use(DataContext);
  if (!value) throw new Error('useData needs a DataProvider');
  return value;
}
