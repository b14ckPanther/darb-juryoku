import { useId, type InputHTMLAttributes } from 'react';
import { cx } from './cx';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

/** A labelled text input with an optional hint read with it. */
export function TextField({ label, hint, value, onChange, className, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = useId();
  return (
    <div className={cx('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-subhead font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? hintId : undefined}
        className="min-h-(--touch-min) rounded-field border border-control-border bg-surface-raised px-4 text-body text-text caret-accent outline-none transition-colors placeholder:text-text-secondary focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        {...rest}
      />
      {hint && (
        <p id={hintId} className="m-0 text-footnote text-text-secondary">
          {hint}
        </p>
      )}
    </div>
  );
}
