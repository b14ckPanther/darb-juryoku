import { type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { designTokens } from '../design';
import { ICON_STROKE } from './button';
import { cx } from './cx';

interface LargeTitleProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

/**
 * The SwiftUI large title: big at the top of the page, and a compact centred title in a translucent bar
 * once it scrolls away. An IntersectionObserver watches the big title; no scroll listeners.
 */
export function LargeTitle({ title, subtitle, trailing }: LargeTitleProps) {
  const big = useRef<HTMLHeadingElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = big.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCompact(!(entry?.isIntersecting ?? true)), {
      rootMargin: '-44px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        className={cx(
          'sticky top-0 z-(--z-sticky) -mx-(--space-gutter) flex h-[calc(2.75rem+env(safe-area-inset-top))] items-center justify-center px-(--space-gutter) pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-(--duration-base)',
          compact ? 'material border-b border-rule' : 'border-b border-transparent',
        )}
      >
        <span
          aria-hidden={!compact}
          className={cx(
            'font-ui text-subhead font-semibold transition-opacity duration-(--duration-base)',
            compact ? 'opacity-100' : 'opacity-0',
          )}
        >
          {title}
        </span>
        {trailing && <div className="absolute right-(--space-gutter)">{trailing}</div>}
      </div>
      <div className="pt-1 pb-4">
        <h1 ref={big} className="text-large-title">
          {title}
        </h1>
        {subtitle && <p className="m-0 mt-1 text-subhead text-text-secondary">{subtitle}</p>}
      </div>
    </>
  );
}

export interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

/** The bottom tab bar: translucent material, safe-area aware, the current tab marked for assistive tech. */
export function TabBar({
  tabs,
  current,
  label,
  onNavigate,
}: {
  tabs: Tab[];
  current: string;
  label: string;
  /** In-app navigation for a plain click; without it the links load the page. */
  onNavigate?: (href: string) => void;
}) {
  return (
    <nav
      aria-label={label}
      className="material fixed inset-x-0 bottom-0 z-(--z-tabbar) border-t border-rule pb-[env(safe-area-inset-bottom)]"
    >
      <ul
        className="m-0 mx-auto grid max-w-xl list-none p-0"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ id, label: tabLabel, icon: Icon, href }) => {
          const active = id === current;
          return (
            <li key={id}>
              <a
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  if (!onNavigate || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  onNavigate(href);
                }}
                className={cx(
                  'pressable flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 text-tab font-medium no-underline',
                  active ? 'text-accent-text' : 'text-text-secondary hover:text-text',
                )}
              >
                <Icon
                  aria-hidden
                  size={24}
                  strokeWidth={active ? designTokens.icons.stroke_active : ICON_STROKE}
                />
                {tabLabel}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
