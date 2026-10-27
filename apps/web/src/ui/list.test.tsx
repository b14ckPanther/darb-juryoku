import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Download, Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { GroupedList, ListRow, SwipeRow } from './list';

describe('GroupedList and ListRow', () => {
  it('is a list section named by its title, with value rows', () => {
    render(
      <GroupedList title="Settings">
        <ListRow label="Camera" value="FaceTime HD Camera" />
        <ListRow label="Quiet hours" value="22:00 to 08:00" />
      </GroupedList>,
    );
    const section = screen.getByRole('region', { name: 'Settings' });
    expect(within(section).getAllByRole('listitem')).toHaveLength(2);
    expect(within(section).getByText('FaceTime HD Camera')).toBeInTheDocument();
  });

  it('makes a row with an action a button reachable by keyboard', async () => {
    const onPress = vi.fn();
    render(
      <GroupedList>
        <ListRow label="Camera" value="FaceTime HD Camera" onPress={onPress} />
      </GroupedList>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Camera/ })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalled();
  });
});

describe('SwipeRow', () => {
  it('exposes its swipe actions as buttons in the tab order', async () => {
    const onDelete = vi.fn();
    render(
      <GroupedList>
        <SwipeRow
          label="Monday"
          value="80%"
          actions={[
            {
              label: 'Export',
              accessibleName: 'Export, Monday',
              icon: Download,
              tone: 'neutral',
              onPress: vi.fn(),
            },
            {
              label: 'Delete',
              accessibleName: 'Delete, Monday',
              icon: Trash2,
              tone: 'danger',
              onPress: onDelete,
            },
          ]}
        />
      </GroupedList>,
    );
    await userEvent.tab();
    // Each action names its row, so "Delete" is never ambiguous to a screen reader.
    expect(screen.getByRole('button', { name: 'Export, Monday' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onDelete).toHaveBeenCalled();
  });
});
