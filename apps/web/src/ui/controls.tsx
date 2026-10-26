import { motion, useReducedMotion } from 'motion/react';
import { useId, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { springTransition } from '../design';
import { cx } from './cx';

interface SegmentedProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

/** A segmented control: one radio group, arrow keys move the choice, the thumb springs across. */
export function SegmentedControl({ label, options, value, onChange }: SegmentedProps) {
  const reduce = useReducedMotion();
  const group = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (event: KeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : step === undefined
            ? null
            : (index + step + options.length) % options.length;
    if (target === null) return;
    event.preventDefault();
    const next = options[target];
    if (next !== undefined) onChange(next);
    refs.current[target]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative inline-grid auto-cols-fr grid-flow-col rounded-control bg-surface-overlay p-1"
    >
      {options.map((option, i) => {
        const selected = option === value;
        return (
          <button
            key={option}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option)}
            onKeyDown={(e) => move(e, i)}
            className={cx(
              'pressable relative min-h-[calc(var(--touch-min)-0.5rem)] rounded-control px-4 text-subhead font-medium',
              'transition-colors duration-(--duration-base)',
              selected ? 'text-on-accent' : 'text-text-secondary hover:text-text',
            )}
          >
            {selected && (
              <motion.span
                layoutId={`${group}-thumb`}
                transition={springTransition('snappy', reduce)}
                className="absolute inset-0 rounded-control bg-accent-fill shadow-raised"
                aria-hidden
              />
            )}
            <span className="relative">{option}</span>
          </button>
        );
      })}
    </div>
  );
}

interface ToggleProps {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** An on/off switch with its label; the whole row is the hit target. */
export function Toggle({ label, detail, checked, onChange, disabled }: ToggleProps) {
  const reduce = useReducedMotion();
  const labelId = useId();
  const detailId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={detail ? detailId : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group flex min-h-(--touch-min) w-full items-center justify-between gap-4 text-left disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="grid">
        <span id={labelId} className="text-body">
          {label}
        </span>
        {detail && (
          <span id={detailId} className="text-footnote text-text-secondary">
            {detail}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cx(
          'relative flex h-8 w-[3.25rem] shrink-0 items-center rounded-control border p-0.5 transition-colors duration-(--duration-base)',
          checked
            ? 'justify-end border-accent-fill bg-accent-fill'
            : 'justify-start border-control-border bg-surface-overlay',
        )}
      >
        <motion.span
          layout
          transition={springTransition('snappy', reduce)}
          className={cx(
            'block size-[1.625rem] rounded-full shadow-raised',
            checked ? 'bg-on-accent' : 'bg-text-secondary',
          )}
        />
      </span>
    </button>
  );
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  valueLabels: string[];
  onChange: (value: number) => void;
}

/** A stepped slider that names its value in words, for sight and for screen readers. */
export function Slider({ label, min, max, value, valueLabels, onChange }: SliderProps) {
  const id = useId();
  const words = valueLabels[value - min] ?? String(value);
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-body">
          {label}
        </label>
        <output htmlFor={id} className="text-subhead text-accent-text">
          {words}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={words}
        onChange={(e) => onChange(Number(e.target.value))}
        className="jr-slider"
        style={{ '--fill': `${fill}%` } as CSSProperties}
      />
    </div>
  );
}
