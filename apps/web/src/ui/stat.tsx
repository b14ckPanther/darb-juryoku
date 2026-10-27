interface StatProps {
  value: string;
  unit?: string;
  label: string;
  size?: 'hero' | 'display';
}

/** One number that matters, in the display face, with what it measures under it. */
export function Stat({ value, unit, label, size = 'hero' }: StatProps) {
  return (
    <p className="m-0 grid gap-1">
      <span
        className={
          size === 'hero'
            ? 'num font-display text-hero text-accent-text'
            : 'num font-display text-display text-accent-text'
        }
      >
        {value}
        {unit && <span className="ml-0.5 text-[0.42em] align-[0.95em]">{unit}</span>}
      </span>
      <span className="text-subhead text-text-secondary">{label}</span>
    </p>
  );
}
