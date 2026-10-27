import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BarChart, ConfusionMatrix, Heatmap, TimelineRibbon } from './charts';

const toggle = { show: 'Show as table', hide: 'Hide table' };

describe('TimelineRibbon', () => {
  const ribbon = (
    <TimelineRibbon
      title="The day in 10-minute steps"
      start="09:00"
      bucketMinutes={10}
      states="GGGGGGDDDAAA"
      labels={{ G: 'Good posture', D: 'Drift', A: 'Away' }}
      toggle={toggle}
    />
  );

  it('is a figure named by its title with a legend that names every state', () => {
    render(ribbon);
    const figure = screen.getByRole('figure', { name: 'The day in 10-minute steps' });
    for (const label of ['Good posture', 'Drift', 'Away'])
      expect(within(figure).getAllByText(label).length).toBeGreaterThan(0);
  });

  it('opens a table of minutes per hour with the toggle', async () => {
    render(ribbon);
    const button = screen.getByRole('button', { name: 'Show as table' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(screen.getByRole('button', { name: 'Hide table' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const rows = screen.getAllByRole('row');
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['60 min', '0 min', '0 min']);
    expect(
      within(rows[2] as HTMLElement)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['0 min', '30 min', '30 min']);
  });
});

describe('BarChart', () => {
  it('labels only the latest day directly and lists every day in its table', async () => {
    render(
      <BarChart
        title="Good posture by day"
        unit="%"
        toggle={toggle}
        bars={[
          { label: '25 Oct', value: 81 },
          { label: '26 Oct', value: 80 },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(screen.getByRole('rowheader', { name: '25 Oct' })).toBeInTheDocument();
    expect(screen.getAllByText('80%')).toHaveLength(2);
  });
});

describe('Heatmap', () => {
  it('has a header per hour and a row per weekday in its table', async () => {
    render(
      <Heatmap
        title="By hour"
        unit="%"
        toggle={toggle}
        rows={['Mon', 'Tue']}
        columns={['09', '10']}
        values={[
          [80, 70],
          [60, 50],
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['09', '10']);
    expect(screen.getByRole('rowheader', { name: 'Tue' })).toBeInTheDocument();
  });
});

describe('Heatmap with empty cells', () => {
  it('names a cell without data instead of shading it as zero', async () => {
    render(
      <Heatmap
        title="By hour"
        unit="%"
        toggle={toggle}
        emptyLabel="No sitting"
        rows={['Mon']}
        columns={['09', '10']}
        values={[[80, null]]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }));
    const row = screen.getByRole('rowheader', { name: 'Mon' }).closest('tr');
    expect(
      within(row as HTMLElement)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['80', 'No sitting']);
  });
});

describe('ConfusionMatrix', () => {
  it('uses class labels, not ids, and keeps every count in the table', async () => {
    render(
      <ConfusionMatrix
        title="Confusion matrix"
        classes={['upright', 'slouch']}
        labels={{ upright: 'Upright', slouch: 'Slouch' }}
        matrix={[
          [40, 2],
          [3, 30],
        ]}
        axis={{ actual: 'Actual', predicted: 'Predicted' }}
        toggle={toggle}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }));
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Slouch' })).toBeInTheDocument();
    expect(
      within(table)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['40', '2', '3', '30']);
  });
});
