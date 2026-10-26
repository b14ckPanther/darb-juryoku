import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';
import { Sheet } from './sheet';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Choose nudge style</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nudge style">
        <Button variant="quiet">Glow only</Button>
        <Button onClick={() => setOpen(false)}>Done</Button>
      </Sheet>
    </>
  );
}

describe('Sheet', () => {
  it('opens as a modal dialog named by its title and moves focus inside', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose nudge style' }));
    const dialog = screen.getByRole('dialog', { name: 'Nudge style' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Glow only' })).toHaveFocus();
  });

  it('keeps Tab inside the sheet', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose nudge style' }));
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Glow only' })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the opener', async () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Choose nudge style' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});
