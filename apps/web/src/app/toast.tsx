import { CircleCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { settingsConfig } from '../config/runtime';
import { springTransition } from '../design';
import { ICON_STROKE } from '../ui/button';

const ToastContext = createContext<(text: string) => void>(() => undefined);

/**
 * One toast at a time, announced from a live region that is always in the page (a region that mounts
 * with its text is often missed by screen readers).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const reduce = useReducedMotion();
  const timer = useRef(0);
  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text });
    timer.current = window.setTimeout(() => setToast(null), settingsConfig.toast_seconds * 1000);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-(--z-toast) flex justify-center px-(--space-gutter) lg:bottom-8"
      >
        <AnimatePresence>
          {toast && (
            <motion.p
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }}
              transition={springTransition('settle', reduce)}
              className="material m-0 inline-flex min-h-(--touch-min) items-center gap-2 rounded-control border border-rule px-5 text-subhead text-text shadow-popover"
            >
              <CircleCheck
                aria-hidden
                size={18}
                strokeWidth={ICON_STROKE}
                className="text-accent-text"
              />
              {toast.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}

export const useToast = () => use(ToastContext);
