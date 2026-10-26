import { FlaskConical, Info, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { springTransition } from '../design';
import { Button, ICON_STROKE } from './button';
import { cx } from './cx';

interface BannerProps {
  tone: 'demo' | 'warning';
  children: ReactNode;
  detail?: string;
}

/** A persistent note across the top of a surface: demo data, or a capability warning. */
export function Banner({ tone, children, detail }: BannerProps) {
  const Icon: LucideIcon = tone === 'demo' ? FlaskConical : Info;
  return (
    <div
      role="note"
      className={cx(
        'flex items-center gap-3 rounded-container px-4 py-3 text-subhead',
        tone === 'demo'
          ? 'bg-accent-fill text-on-accent'
          : 'border border-drift bg-surface-raised text-text',
      )}
    >
      <Icon
        aria-hidden
        size={18}
        strokeWidth={ICON_STROKE}
        className={cx('shrink-0', tone === 'warning' && 'text-drift-text')}
      />
      <p className="m-0">
        <span className="font-medium">{children}</span>
        {detail && <span className="opacity-85"> {detail}</span>}
      </p>
    </div>
  );
}

/** A short confirmation that appears and needs no action. Announced politely. */
export function Toast({ children, icon: Icon }: { children: ReactNode; icon?: LucideIcon }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springTransition('settle', reduce)}
      className="material inline-flex min-h-(--touch-min) items-center gap-2 rounded-control px-5 text-subhead shadow-popover"
    >
      {Icon && (
        <Icon aria-hidden size={18} strokeWidth={ICON_STROKE} className="text-accent-text" />
      )}
      {children}
    </motion.div>
  );
}

interface NudgeProps {
  title: string;
  body: string;
  primary: string;
  secondary: string;
  glyph: ReactNode;
  onPrimary: () => void;
  onSecondary: () => void;
}

/** The gentle nudge: never modal, two plain actions, the drifting part of the body as a glyph. */
export function Nudge({
  title,
  body,
  primary,
  secondary,
  glyph,
  onPrimary,
  onSecondary,
}: NudgeProps) {
  const reduce = useReducedMotion();
  const titleId = useId();
  return (
    <motion.section
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition('settle', reduce)}
      className="material grid max-w-sm gap-4 rounded-container border border-rule p-4 shadow-popover"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-overlay text-drift-text">
          {glyph}
        </span>
        <div className="grid gap-0.5">
          <h3 id={titleId} className="font-ui text-subhead font-semibold">
            {title}
          </h3>
          <p className="m-0 text-subhead text-text-secondary">{body}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="quiet" onClick={onSecondary}>
          {secondary}
        </Button>
        <Button onClick={onPrimary}>{primary}</Button>
      </div>
    </motion.section>
  );
}
