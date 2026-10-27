import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { matchAt } from '../live/playback';
import { useData } from './data';

interface SessionValue {
  /** When this session started (performance.now); changes on restart. */
  startedAt: number;
  paused: boolean;
  ended: boolean;
  togglePause: () => void;
  end: () => void;
  restart: () => void;
  /** Seconds of playback so far, frozen while paused. */
  elapsed: () => number;
}

const SessionContext = createContext<SessionValue | null>(null);

/** The running session. In the demo it drives the synthetic playback; Phase 4 drives it from the camera. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [clock, setClock] = useState(() => ({
    start: performance.now(),
    pausedAt: null as number | null,
    pausedFor: 0,
    ended: false,
  }));
  const elapsed = useCallback(
    () => ((clock.pausedAt ?? performance.now()) - clock.start - clock.pausedFor) / 1000,
    [clock],
  );
  const value = useMemo<SessionValue>(
    () => ({
      startedAt: clock.start,
      paused: clock.pausedAt !== null,
      ended: clock.ended,
      togglePause: () =>
        setClock((c) =>
          c.ended
            ? c
            : c.pausedAt === null
              ? { ...c, pausedAt: performance.now() }
              : { ...c, pausedAt: null, pausedFor: c.pausedFor + performance.now() - c.pausedAt },
        ),
      end: () =>
        setClock((c) => ({ ...c, ended: true, pausedAt: c.pausedAt ?? performance.now() })),
      restart: () =>
        setClock({ start: performance.now(), pausedAt: null, pausedFor: 0, ended: false }),
      elapsed,
    }),
    [clock, elapsed],
  );
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession needs a SessionProvider');
  return value;
}

/** The match the mirror shows now, refreshed a few times a second; null without playback (real mode). */
export function useLiveMatch(view: Window = window): number | null {
  const { data } = useData();
  const session = useSession();
  const playback = data.library?.playback ?? null;
  const [match, setMatch] = useState(() =>
    playback ? matchAt(playback, session.elapsed()) : null,
  );
  const { paused, elapsed } = session;
  useEffect(() => {
    if (!playback || paused) return;
    // The overlay springs between targets, so a few updates a second look continuous. The timer runs
    // in the window that shows the mirror, so the sentinel keeps time while the opener tab is hidden.
    const id = view.setInterval(() => setMatch(matchAt(playback, elapsed())), playback.tick_ms);
    return () => view.clearInterval(id);
  }, [playback, paused, elapsed, view]);
  return match;
}
