import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { copy, t } from '../copy';
import { reportConfig, settingsConfig } from '../config/runtime';
import { loadDemoSnapshot } from '../data/demo-seed';
import { buildDayReport } from '../report/day-report';
import { longDate, percent } from '../report/format';
import { renderApp } from '../test/render-app';

const demo = loadDemoSnapshot();

describe('Live', () => {
  it('shows the mirror, the state and the session tally', async () => {
    await renderApp('/');
    expect(await screen.findByRole('img', { name: copy.live.image_label })).toBeInTheDocument();
    expect(screen.getByText(copy.live.session_label)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.live.open_sentinel })).toBeInTheDocument();
  });

  it('ends a session only after confirming in a sheet', async () => {
    await renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: copy.live.end }));
    const sheet = await screen.findByRole('dialog', { name: copy.live.end_title });
    await userEvent.click(within(sheet).getByRole('button', { name: copy.live.end_confirm }));
    expect(await screen.findByRole('heading', { name: copy.live.ended_title })).toBeInTheDocument();
  });

  it('previews the away and heuristic fallback states', async () => {
    await renderApp('/', { search: '?state=fallback' });
    expect(await screen.findByText(copy.live.fallback)).toBeInTheDocument();
  });
});

describe('Today', () => {
  it('shows the share, the observation and the facts computed from the seed', async () => {
    await renderApp('/today');
    const r = buildDayReport(demo.buckets, demo.today, reportConfig, copy);
    expect(await screen.findByText(String(percent(r.share ?? 0)))).toBeInTheDocument();
    expect(screen.getByText(r.observation ?? '')).toBeInTheDocument();
    const facts = screen.getByRole('region', { name: copy.today.facts_title });
    expect(within(facts).getAllByRole('listitem')).toHaveLength(4);
  });

  it('shows the empty state when there are no minutes', async () => {
    await renderApp('/today', { search: '?state=empty' });
    expect(
      await screen.findByRole('heading', { name: copy.today.empty_title }),
    ).toBeInTheDocument();
  });
});

describe('History', () => {
  it('opens a day report and comes back', async () => {
    await renderApp('/history');
    const name = longDate(demo.today, copy.locale);
    await userEvent.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) }));
    expect(await screen.findByRole('heading', { level: 1, name })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: copy.nav.back }));
    expect(
      await screen.findByRole('heading', { level: 1, name: copy.history.title }),
    ).toBeInTheDocument();
  });

  it('deletes a day after confirming', async () => {
    await renderApp('/history');
    const name = longDate(demo.today, copy.locale);
    const del = t(copy.history.swipe_action_name, { action: copy.history.delete, row: name });
    await userEvent.click(await screen.findByRole('button', { name: del }));
    const sheet = await screen.findByRole('dialog');
    await userEvent.click(within(sheet).getByRole('button', { name: copy.history.delete_confirm }));
    expect(screen.queryByRole('button', { name: del })).not.toBeInTheDocument();
    expect(await screen.findByText(t(copy.history.deleted, { day: name }))).toBeInTheDocument();
  });

  it('switches between week and month', async () => {
    await renderApp('/history');
    const before = (await screen.findAllByRole('button', { name: /%/ })).length;
    await userEvent.click(screen.getByRole('radio', { name: copy.history.month }));
    expect(screen.getAllByRole('button', { name: /%/ }).length).toBeGreaterThan(before);
  });
});

describe('Calibrate', () => {
  it('frames, holds for the configured seconds, confirms and saves', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await renderApp('/calibrate');
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.click(await screen.findByRole('button', { name: copy.calibrate.ready }));
      expect(
        screen.getByRole('heading', { name: copy.calibrate.steps.hold_title }),
      ).toBeInTheDocument();
      // One act per second: each tick re-arms the countdown after React commits.
      for (let i = 0; i < settingsConfig.calibration_hold_seconds; i += 1)
        await act(() => vi.advanceTimersByTimeAsync(1000));
      expect(
        screen.getByRole('heading', { name: copy.calibrate.steps.confirm_title }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: copy.calibrate.use }));
      const sheet = await screen.findByRole('dialog', { name: copy.calibrate.save_title });
      await user.click(within(sheet).getByRole('button', { name: copy.calibrate.save }));
      expect(await screen.findByText(copy.calibrate.saved)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Sentinel', () => {
  it('explains the fallback when the browser cannot keep a window on top', async () => {
    await renderApp('/sentinel');
    expect(
      await screen.findByRole('heading', { name: copy.sentinel.unsupported_title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: copy.sentinel.preview_label })).toBeInTheDocument();
  });
});

describe('Nudges', () => {
  it('shows the escalation in order and answers the example nudge', async () => {
    await renderApp('/nudges');
    const steps = await screen.findAllByRole('heading', { level: 3 });
    expect(steps.map((h) => h.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining(copy.nudge.glow_title)]),
    );
    await userEvent.click(screen.getByRole('button', { name: copy.nudge.primary }));
    expect(await screen.findByText(copy.nudge.sitting_up)).toBeInTheDocument();
  });
});

describe('Welcome', () => {
  it('shows the privacy promise and the blocked-camera fix', async () => {
    await renderApp('/welcome', { search: '?state=denied' });
    expect(
      await screen.findByRole('heading', { name: copy.welcome.privacy_title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: copy.welcome.permission.denied.title }),
    ).toBeInTheDocument();
  });
});

describe('Dataset Studio', () => {
  it('records, stops without saving, and lists the recordings', async () => {
    await renderApp('/studio');
    const list = await screen.findByRole('region', { name: copy.studio.recordings_title });
    expect(within(list).getAllByRole('listitem')).toHaveLength(
      demo.library?.recordings.length ?? 0,
    );
    await userEvent.click(screen.getByRole('button', { name: copy.studio.start }));
    expect(screen.getByText(copy.studio.recording)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: copy.studio.stop }));
    expect(await screen.findByText(copy.studio.stopped)).toBeInTheDocument();
  });

  it('clears recordings after confirming, then shows the empty state', async () => {
    await renderApp('/studio');
    await userEvent.click(await screen.findByRole('button', { name: copy.studio.clear }));
    const sheet = await screen.findByRole('dialog');
    await userEvent.click(within(sheet).getByRole('button', { name: copy.studio.clear_confirm }));
    expect(
      await screen.findByRole('heading', { name: copy.studio.empty_title }),
    ).toBeInTheDocument();
  });
});

describe('Model Lab', () => {
  it('shows the gates for a model and switches to the heuristic', async () => {
    await renderApp('/lab');
    expect(await screen.findByRole('region', { name: copy.lab.gates_title })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: copy.lab.heuristic }));
    expect(screen.getByText(copy.lab.heuristic_note)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: t(copy.lab.use, { name: copy.lab.heuristic }) }),
    );
    expect(
      await screen.findByText(t(copy.lab.now_using, { name: copy.lab.heuristic })),
    ).toBeInTheDocument();
  });

  it('runs the latency benchmark', async () => {
    await renderApp('/lab');
    await userEvent.click(await screen.findByRole('button', { name: copy.lab.bench_run }));
    expect(
      await screen.findByRole('rowheader', { name: copy.lab.wasm }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});

describe('Settings', () => {
  it('reveals the Darb Budokai fields only when switched on, with secrets masked', async () => {
    await renderApp('/settings');
    expect(screen.queryByLabelText(copy.settings.budokai_secret)).not.toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole('switch', { name: copy.settings.budokai_toggle }),
    );
    expect(screen.getByLabelText(copy.settings.budokai_secret)).toHaveAttribute('type', 'password');
  });

  it('chooses a nudge style in a sheet', async () => {
    await renderApp('/settings');
    await userEvent.click(
      await screen.findByRole('button', { name: new RegExp(copy.settings.nudge_style) }),
    );
    const sheet = await screen.findByRole('dialog', { name: copy.settings.nudge_style });
    await userEvent.click(
      within(sheet).getByRole('radio', { name: copy.settings.nudge_styles.glow }),
    );
    await userEvent.keyboard('{Escape}');
    expect(
      screen.getByRole('button', { name: new RegExp(copy.settings.nudge_styles.glow) }),
    ).toBeInTheDocument();
  });
});
