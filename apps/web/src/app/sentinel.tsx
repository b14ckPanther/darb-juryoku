import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { settingsConfig } from '../config/runtime';
import { copy } from '../copy';
import { SentinelView } from '../live/SentinelView';

interface PipApi {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
}

interface SentinelValue {
  supported: boolean;
  isOpen: boolean;
  open: () => Promise<void>;
  close: () => void;
}

const SentinelContext = createContext<SentinelValue | null>(null);

const pipApi = (): PipApi | null =>
  (window as unknown as { documentPictureInPicture?: PipApi }).documentPictureInPicture ?? null;

/** Copies the app's styles into the PiP window so the sentinel looks like the app. */
function adoptStyles(target: Document) {
  for (const sheet of [...document.styleSheets]) {
    try {
      const style = target.createElement('style');
      style.textContent = [...sheet.cssRules].map((r) => r.cssText).join('\n');
      target.head.append(style);
    } catch {
      if (sheet.href) {
        const link = target.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        target.head.append(link);
      }
    }
  }
}

/**
 * The sentinel window (Document Picture-in-Picture, Chrome and Edge). The view renders through a
 * portal, so it shares the session with the main window. `forceUnsupported` previews the fallback.
 */
export function SentinelProvider({
  children,
  forceUnsupported,
}: {
  children: ReactNode;
  forceUnsupported: boolean;
}) {
  const [pip, setPip] = useState<Window | null>(null);
  const supported = !forceUnsupported && pipApi() !== null;

  const open = useCallback(async () => {
    const api = pipApi();
    if (!api || forceUnsupported) return;
    if (pip) {
      pip.focus();
      return;
    }
    const win = await api.requestWindow(settingsConfig.sentinel_window);
    win.document.title = copy.app.pip_title;
    win.document.documentElement.dataset['theme'] = 'dark';
    win.document.documentElement.lang = document.documentElement.lang;
    adoptStyles(win.document);
    win.document.body.style.margin = '0';
    win.addEventListener('pagehide', () => setPip(null), { once: true });
    setPip(win);
  }, [pip, forceUnsupported]);

  const close = useCallback(() => {
    pip?.close();
    setPip(null);
  }, [pip]);

  useEffect(() => () => pip?.close(), [pip]);

  return (
    <SentinelContext value={{ supported, isOpen: pip !== null, open, close }}>
      {children}
      {pip &&
        createPortal(
          <div className="h-dvh w-dvw bg-surface">
            <SentinelView />
          </div>,
          pip.document.body,
        )}
    </SentinelContext>
  );
}

export function useSentinel(): SentinelValue {
  const value = use(SentinelContext);
  if (!value) throw new Error('useSentinel needs a SentinelProvider');
  return value;
}
