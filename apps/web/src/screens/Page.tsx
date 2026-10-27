import type { LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Link } from '../app/router';
import { Button, ICON_STROKE } from '../ui/button';
import { LargeTitle } from '../ui/mobile';

/** A screen: the large title (compact bar on scroll), an optional line under it, then content. */
export function Page({
  title,
  subtitle,
  trailing,
  children,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:pt-2">
      <LargeTitle title={title} subtitle={subtitle} trailing={trailing} />
      {children}
    </div>
  );
}

/** What is missing, why, and the one action that fixes it. Links or presses. */
export function Notice({
  icon: Icon,
  title,
  body,
  action,
  href,
  onAction,
  tone = 'plain',
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: string;
  href?: string;
  onAction?: () => void;
  tone?: 'plain' | 'warning';
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="grid max-w-md justify-items-start gap-3 rounded-container bg-surface-raised p-6"
    >
      <span
        className={
          tone === 'warning'
            ? 'grid size-12 place-items-center rounded-control bg-surface-overlay text-drift-text'
            : 'grid size-12 place-items-center rounded-control bg-surface-overlay text-accent-text'
        }
      >
        <Icon aria-hidden size={24} strokeWidth={ICON_STROKE} />
      </span>
      <h2 id={titleId} className="text-title3">
        {title}
      </h2>
      <p className="m-0 text-subhead text-text-secondary">{body}</p>
      {action && href && (
        <Link
          href={href}
          className="pressable mt-1 inline-flex min-h-(--touch-min) items-center rounded-control bg-accent-fill px-5 text-subhead font-medium text-on-accent no-underline"
        >
          {action}
        </Link>
      )}
      {action && onAction && (
        <Button onClick={onAction} className="mt-1">
          {action}
        </Button>
      )}
    </section>
  );
}

/** A quiet placeholder while a screen loads: the shapes of what is coming, never a spinner alone. */
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="grid gap-6 pt-14 motion-safe:animate-pulse"
    >
      <span className="h-9 w-40 rounded-container bg-surface-raised" />
      <span className="h-28 w-56 rounded-container bg-surface-raised" />
      <span className="h-40 rounded-container bg-surface-raised" />
      <span className="h-56 rounded-container bg-surface-raised" />
    </div>
  );
}
