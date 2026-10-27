import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pause } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Button, IconButton } from './button';

describe('Button', () => {
  it('is a button named by its label and fires on Enter and Space', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Start session</Button>);
    const button = screen.getByRole('button', { name: 'Start session' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('blocks presses and reports busy while loading, without dropping focus', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    button.focus();
    expect(button).toHaveFocus();
    await userEvent.click(button);
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(
      <Button disabled variant="destructive">
        Delete all data
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Delete all data' })).toBeDisabled();
  });
});

describe('IconButton', () => {
  it('is named by its label, not by the icon', () => {
    render(<IconButton icon={Pause} label="Pause" />);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
});
