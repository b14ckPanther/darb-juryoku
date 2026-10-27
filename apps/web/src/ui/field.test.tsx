import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { TextField } from './field';

function Harness() {
  const [v, setV] = useState('');
  return <TextField label="Name" hint="Where you sit" value={v} onChange={setV} />;
}

describe('TextField', () => {
  it('is named by its label, described by its hint, and edits its value', async () => {
    render(<Harness />);
    const box = screen.getByRole('textbox', { name: 'Name' });
    expect(box).toHaveAccessibleDescription('Where you sit');
    await userEvent.type(box, 'Desk');
    expect(box).toHaveValue('Desk');
  });
});
