import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appConfig } from '../config/app-config';
import { copy } from '../copy';
import { renderApp } from '../test/render-app';

describe('App shell', () => {
  it('sets the document title and the brand from config', async () => {
    await renderApp('/today');
    expect(document.title).toBe(appConfig.name);
    expect(screen.getAllByText(appConfig.name).length).toBeGreaterThan(0);
  });

  it('always shows the demo banner in demo mode', async () => {
    await renderApp('/today');
    expect(screen.getByRole('note')).toHaveTextContent(copy.demo.banner);
  });

  it('never shows demo data or the banner outside demo mode, and starts at Welcome', async () => {
    await renderApp('/', { demo: false });
    expect(
      await screen.findByRole('heading', { level: 1, name: copy.welcome.title }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.demo.banner)).not.toBeInTheDocument();
  });

  it('shows an empty Today outside demo mode', async () => {
    await renderApp('/today', { demo: false });
    expect(
      await screen.findByRole('heading', { name: copy.today.empty_title }),
    ).toBeInTheDocument();
  });

  it('marks the current screen in the navigation', async () => {
    await renderApp('/history');
    const nav = screen.getByRole('navigation', { name: copy.nav.label });
    expect(within(nav).getByRole('link', { name: copy.nav.history })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('navigates in place from the side navigation', async () => {
    await renderApp('/today');
    const nav = screen.getByRole('navigation', { name: copy.nav.label });
    await userEvent.click(within(nav).getByRole('link', { name: copy.nav.settings }));
    expect(
      await screen.findByRole('heading', { level: 1, name: copy.settings.title }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/settings');
  });

  it('shows a way back for an unknown address', async () => {
    await renderApp('/nowhere');
    expect(
      await screen.findByRole('heading', { name: copy.states.not_found_title }),
    ).toBeInTheDocument();
  });
});

describe('loading and error states', () => {
  it('shows the loading skeleton', async () => {
    window.history.replaceState(null, '', '/today?state=loading');
    const { App } = await import('./App');
    const { render } = await import('@testing-library/react');
    render(<App config={appConfig} path="/today" demo />);
    expect(screen.getByLabelText(copy.states.loading)).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the error with a retry that loads the data', async () => {
    window.history.replaceState(null, '', '/today?state=error');
    const { App } = await import('./App');
    const { render } = await import('@testing-library/react');
    render(<App config={appConfig} path="/today" demo />);
    expect(
      await screen.findByRole('heading', { name: copy.states.error_title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.states.retry })).toBeInTheDocument();
  });
});

describe('keyboard shortcuts', () => {
  it('? opens the shortcut sheet', async () => {
    await renderApp('/today');
    await userEvent.keyboard('?');
    expect(await screen.findByRole('dialog', { name: copy.shortcuts.title })).toBeInTheDocument();
  });

  it('C opens calibration', async () => {
    await renderApp('/today');
    await userEvent.keyboard('c');
    expect(
      await screen.findByRole('heading', { level: 1, name: copy.calibrate.title }),
    ).toBeInTheDocument();
  });

  it('Space pauses and resumes the session', async () => {
    await renderApp('/');
    await screen.findByRole('button', { name: copy.live.pause });
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.keyboard(' ');
    expect(await screen.findByRole('button', { name: copy.live.resume })).toBeInTheDocument();
    await userEvent.keyboard(' ');
    expect(await screen.findByRole('button', { name: copy.live.pause })).toBeInTheDocument();
  });

  it('P goes to the sentinel when the browser has no picture-in-picture window', async () => {
    await renderApp('/today');
    await userEvent.keyboard('p');
    await waitFor(() => expect(window.location.pathname).toBe('/sentinel'));
    expect(
      await screen.findByRole('heading', { name: copy.sentinel.unsupported_title }),
    ).toBeInTheDocument();
  });
});
