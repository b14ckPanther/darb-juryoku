import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { designTokens, springTransition } from '../design';
import { nearestDetent, sheetShouldDismiss } from './gestures';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A bottom sheet with detents from tokens. Drag the grabber or title down past the dismiss threshold
 * (or flick) to close; the content scrolls normally. Escape and the scrim close it too. Focus moves in,
 * stays in, and returns to the opener; the page behind is inert while it is open.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <SheetPanel onClose={onClose} title={title}>
          {children}
        </SheetPanel>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SheetPanel({ onClose, title, children }: Omit<SheetProps, 'open'>) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  const { detents, dismiss_fraction, dismiss_velocity_px_s, elastic_top, elastic_bottom } =
    designTokens.motion.sheet;
  const tallest = Math.max(...detents);
  const lowest = Math.min(...detents);
  const [viewport, setViewport] = useState(() => window.innerHeight);
  const detent = useRef(lowest);
  const height = tallest * viewport;
  const offsetFor = (d: number) => (tallest - d) * viewport;
  const y = useMotionValue(height);
  const scrim = useTransform(y, [offsetFor(lowest), height], [1, 0]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const onResize = () => setViewport(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      root?.removeAttribute('inert');
      opener?.focus();
    };
  }, []);

  // Rest on the current detent: on open, and again whenever the viewport height changes
  // (rotation, the mobile address bar).
  useEffect(() => {
    const controlsAnim = animate(
      y,
      (tallest - detent.current) * viewport,
      springTransition('snappy', reduce),
    );
    return () => controlsAnim.stop();
  }, [viewport, tallest, reduce, y]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    if (!firstItem || !lastItem) return;
    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  };

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const belowLowest = y.get() - offsetFor(lowest);
    const thresholds = { dismiss_fraction, dismiss_velocity_px_s };
    if (sheetShouldDismiss(belowLowest, info.velocity.y, lowest * viewport, thresholds)) {
      onClose();
      return;
    }
    const detentNow = tallest - y.get() / viewport;
    detent.current = nearestDetent(detentNow, info.velocity.y, detents, dismiss_velocity_px_s);
    animate(y, offsetFor(detent.current), springTransition('snappy', reduce));
  };

  return (
    <div className="fixed inset-0 z-(--z-sheet)">
      {/* The outer layer fades in and out; the inner one follows the drag. A derived motion value
          cannot itself be animated, so the two jobs live on separate elements. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div className="absolute inset-0 bg-scrim" style={{ opacity: scrim }} />
      </motion.div>
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="material absolute inset-x-0 bottom-0 mx-auto flex max-w-xl flex-col rounded-t-sheet shadow-sheet outline-none"
        style={{ y, height }}
        exit={{ y: height }}
        transition={springTransition('snappy', reduce)}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: height }}
        dragElastic={{ top: elastic_top, bottom: elastic_bottom }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        {/* Only the grabber and title start a drag, so the content below scrolls on touch. */}
        <div
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
        >
          <div className="grid place-items-center pt-2 pb-1" aria-hidden>
            <span className="h-1.5 w-10 rounded-control bg-text-secondary/40" />
          </div>
          <h2 id={titleId} className="px-6 pt-2 pb-3 text-title2">
            {title}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
        {/* The part of the panel pushed below the screen: the scroll area ends where the screen does,
            so the last item is always reachable and focus never lands on something hidden. */}
        <motion.div aria-hidden className="shrink-0" style={{ height: y }} />
      </motion.div>
    </div>
  );
}
