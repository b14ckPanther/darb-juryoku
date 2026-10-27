import { ChevronRight, type LucideIcon } from 'lucide-react';
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { designTokens, springTransition } from '../design';
import { ICON_STROKE } from './button';
import { cx } from './cx';
import { swipeSettle } from './gestures';

interface GroupedListProps {
  title?: string;
  /** Heading level for the title, so it fits the page outline. */
  level?: 2 | 3;
  footer?: string;
  children: ReactNode;
}

/** An inset grouped list, as in iOS Settings: an optional small title, rounded rows, hairline separators. */
export function GroupedList({ title, footer, children, level = 3 }: GroupedListProps) {
  const titleId = useId();
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section aria-labelledby={title ? titleId : undefined} className="grid gap-2">
      {title && (
        <Heading
          id={titleId}
          className="px-4 font-ui text-footnote font-medium text-text-secondary"
        >
          {title}
        </Heading>
      )}
      <ul className="overflow-hidden rounded-container bg-surface-raised [&>li+li]:border-t [&>li+li]:border-rule">
        {children}
      </ul>
      {footer && <p className="px-4 text-footnote text-text-secondary">{footer}</p>}
    </section>
  );
}

interface ListRowProps {
  label: string;
  value?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  accessory?: ReactNode;
}

/** One row: label on the left, value or accessory on the right. Pressable rows show a chevron. */
export function ListRow({ label, value, icon: Icon, onPress, accessory }: ListRowProps) {
  const body = (
    <>
      {Icon && (
        <Icon
          aria-hidden
          size={20}
          strokeWidth={ICON_STROKE}
          className="shrink-0 text-accent-text"
        />
      )}
      <span className={cx('text-body', value ? 'shrink-0' : 'min-w-0 flex-1')}>{label}</span>
      {value && (
        <span className="num min-w-0 flex-1 truncate text-right text-body text-text-secondary">
          {value}
        </span>
      )}
      {accessory}
      {onPress && (
        <ChevronRight
          aria-hidden
          size={18}
          strokeWidth={ICON_STROKE}
          className="shrink-0 text-text-secondary"
        />
      )}
    </>
  );
  const row = 'flex min-h-(--touch-min) w-full items-center gap-3 px-4 py-2.5 text-left';
  return (
    <li>
      {onPress ? (
        <button
          type="button"
          onClick={onPress}
          className={cx(row, 'pressable transition-colors hover:bg-surface-overlay')}
        >
          {body}
        </button>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  );
}

export interface SwipeAction {
  label: string;
  /** What a screen reader hears, naming the row too (for example "Delete, Monday"). */
  accessibleName: string;
  icon: LucideIcon;
  tone: 'neutral' | 'danger';
  onPress: () => void;
}

interface SwipeRowProps {
  label: string;
  value?: string;
  actions: SwipeAction[];
  /** Makes the row itself a button (for example, open the day). It comes before the actions. */
  onOpen?: () => void;
}

/**
 * A row that slides left to reveal actions. The actions are real buttons after the row in the tab
 * order, so keyboard and screen reader users reach them without swiping; focusing one opens the row.
 */
export function SwipeRow({ label, value, actions, onOpen }: SwipeRowProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { reveal_px, commit_fraction, elastic, projection_s } = designTokens.motion.swipe;
  const width = reveal_px * actions.length;
  const settle = (to: number) => animate(x, to, springTransition('snappy', reduce));

  const body = (
    <>
      <span className="min-w-0 flex-1 truncate text-body">{label}</span>
      {value && <span className="num text-body text-text-secondary">{value}</span>}
    </>
  );

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    settle(swipeSettle(x.get(), info.velocity.x, width, commit_fraction, projection_s));
  };

  return (
    <li
      className="relative overflow-hidden"
      onFocus={(e) => {
        if (e.target instanceof HTMLElement && e.target.dataset['swipeAction'] !== undefined)
          settle(-width);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) settle(0);
      }}
    >
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -width, right: 0 }}
        dragElastic={elastic}
        onDragEnd={onDragEnd}
        style={{ x }}
        className="relative z-[1] bg-surface-raised touch-pan-y select-none"
      >
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="pressable flex min-h-(--touch-min) w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-overlay"
          >
            {body}
            <ChevronRight
              aria-hidden
              size={18}
              strokeWidth={ICON_STROKE}
              className="shrink-0 text-text-secondary"
            />
          </button>
        ) : (
          <div className="flex min-h-(--touch-min) items-center gap-3 px-4 py-2.5">{body}</div>
        )}
      </motion.div>
      {/* The actions sit after the row in the DOM so the row comes first in the tab order. */}
      <div className="absolute inset-y-0 right-0 z-0 flex" style={{ width }}>
        {actions.map(({ label: actionLabel, accessibleName, icon: Icon, tone, onPress }) => (
          <button
            key={actionLabel}
            type="button"
            aria-label={accessibleName}
            data-swipe-action=""
            onClick={() => {
              onPress();
              settle(0);
            }}
            className={cx(
              'grid flex-1 place-content-center justify-items-center gap-1 text-caption font-medium',
              tone === 'danger' ? 'bg-danger text-on-danger' : 'bg-surface-overlay text-text',
            )}
          >
            <Icon aria-hidden size={20} strokeWidth={ICON_STROKE} />
            {actionLabel}
          </button>
        ))}
      </div>
    </li>
  );
}
