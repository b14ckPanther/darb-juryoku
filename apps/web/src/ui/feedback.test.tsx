import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Banner, Nudge, Toast } from './feedback';
import { PostureGlyph } from './glyphs';
import { Stat } from './stat';
import { EmptyState, PermissionPrompt } from './states';
import { Inbox } from 'lucide-react';

describe('feedback', () => {
  it('shows the demo banner as a note', () => {
    render(
      <Banner tone="demo" detail="Every number is sample data.">
        Demo data
      </Banner>,
    );
    expect(screen.getByRole('note')).toHaveTextContent('Demo data');
  });

  it('announces a toast politely', () => {
    render(<Toast>Calibration saved</Toast>);
    expect(screen.getByRole('status')).toHaveTextContent('Calibration saved');
  });

  it('gives a nudge a heading and two keyboard-reachable actions, never a modal', async () => {
    const onPrimary = vi.fn();
    render(
      <Nudge
        title="Shoulders forward for 4 minutes"
        body="Roll them back?"
        primary="Sitting up"
        secondary="Snooze 15 min"
        glyph={<PostureGlyph posture="slouch" />}
        onPrimary={onPrimary}
        onSecondary={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('region', { name: 'Shoulders forward for 4 minutes' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onPrimary).toHaveBeenCalled();
  });
});

describe('states', () => {
  it('explains a blocked camera with a fix-it action', async () => {
    const onAction = vi.fn();
    render(
      <PermissionPrompt
        state="denied"
        title="Camera access is blocked"
        body="Allow it in site settings."
        action="Try again"
        onAction={onAction}
      />,
    );
    expect(screen.getByRole('region', { name: 'Camera access is blocked' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('gives an empty state a way to start', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No sessions yet"
        body="Start one."
        action="Start session"
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument();
  });

  it('reads a stat as its number and what it measures', () => {
    render(<Stat value="80" unit="%" label="of sitting time in good posture" />);
    expect(screen.getByText('of sitting time in good posture').parentElement).toHaveTextContent(
      '80%of sitting time in good posture',
    );
  });

  it('labels a posture glyph only when asked to', () => {
    const { container } = render(<PostureGlyph posture="upright" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    render(<PostureGlyph posture="forward_head" label="Head forward" />);
    expect(screen.getByRole('img', { name: 'Head forward' })).toBeInTheDocument();
  });
});
