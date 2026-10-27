import { LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

/** One stroke weight for every icon in the app (Lucide, ADR-030). */
export const ICON_STROKE = 1.75;

type Variant = 'primary' | 'quiet' | 'destructive';

const variants: Record<Variant, string> = {
  primary: 'bg-accent-fill text-on-accent hover:brightness-110',
  quiet: 'bg-transparent text-text border border-control-border hover:bg-surface-overlay',
  destructive:
    'bg-transparent text-danger border border-danger hover:bg-danger hover:text-on-danger',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  children: ReactNode;
}

/** A pill button. Loading keeps the label, shows a turning ring and blocks repeat presses. */
export function Button({
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <button
      type="button"
      {...rest}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={cx(
        'pressable inline-flex min-h-(--touch-min) items-center justify-center gap-2 rounded-control px-5',
        'text-subhead font-medium whitespace-nowrap select-none',
        'transition-[background-color,color,filter,transform] duration-(--duration-fast) ease-out',
        loading ? 'cursor-progress' : 'disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        className,
      )}
    >
      {loading ? (
        <LoaderCircle
          aria-hidden
          size={18}
          strokeWidth={ICON_STROKE}
          className="animate-spin motion-reduce:animate-none"
        />
      ) : (
        Icon && <Icon aria-hidden size={18} strokeWidth={ICON_STROKE} />
      )}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tone?: 'plain' | 'filled';
}

/** A 44 by 44 icon-only button. The label is required: it is the accessible name. */
export function IconButton({
  icon: Icon,
  label,
  tone = 'plain',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      {...rest}
      className={cx(
        'pressable inline-grid size-(--touch-min) place-items-center rounded-control',
        'transition-colors duration-(--duration-fast)',
        'disabled:cursor-not-allowed disabled:opacity-45',
        tone === 'filled'
          ? 'bg-surface-overlay text-text hover:bg-surface-raised'
          : 'text-text-secondary hover:bg-surface-overlay hover:text-text',
        className,
      )}
    >
      <Icon aria-hidden size={22} strokeWidth={ICON_STROKE} />
    </button>
  );
}
