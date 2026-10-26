import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl, Slider, Toggle } from './controls';

function Segmented() {
  const [value, setValue] = useState('Day');
  return (
    <SegmentedControl
      label="Report range"
      options={['Day', 'Week', 'Month']}
      value={value}
      onChange={setValue}
    />
  );
}

describe('SegmentedControl', () => {
  it('is a radio group with one checked option', () => {
    render(<Segmented />);
    expect(screen.getByRole('radiogroup', { name: 'Report range' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true');
  });

  it('moves the choice and focus with arrow keys, wrapping at the ends', async () => {
    render(<Segmented />);
    screen.getByRole('radio', { name: 'Day' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps only the checked option in the tab order', () => {
    render(<Segmented />);
    expect(screen.getAllByRole('radio').map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });
});

describe('Toggle', () => {
  it('is a switch named by its label that flips with Space', async () => {
    const onChange = vi.fn();
    render(
      <Toggle
        label="Play a sound with nudges"
        detail="Off by default"
        checked={false}
        onChange={onChange}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Play a sound with nudges' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAccessibleDescription('Off by default');
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('can be disabled', () => {
    render(<Toggle label="Sound" checked onChange={vi.fn()} disabled />);
    expect(screen.getByRole('switch', { name: 'Sound' })).toBeDisabled();
  });
});

describe('Slider', () => {
  it('names its value in words', () => {
    render(
      <Slider
        label="Sensitivity"
        min={1}
        max={5}
        value={3}
        valueLabels={['a', 'b', 'Balanced', 'd', 'e']}
        onChange={vi.fn()}
      />,
    );
    const slider = screen.getByRole('slider', { name: 'Sensitivity' });
    expect(slider).toHaveAttribute('aria-valuetext', 'Balanced');
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });
});
