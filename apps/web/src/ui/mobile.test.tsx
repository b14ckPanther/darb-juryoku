import { act, render, screen } from '@testing-library/react';
import { CalendarDays, Sun } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { LargeTitle, TabBar } from './mobile';
import { ModelCard } from './model-card';

describe('LargeTitle', () => {
  it('is the page heading and shows the compact title only after it scrolls away', () => {
    let callback: IntersectionObserverCallback = () => undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<LargeTitle title="Today" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    const compact = screen.getAllByText('Today')[0] as HTMLElement;
    expect(compact).toHaveAttribute('aria-hidden', 'true');
    act(() =>
      callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(compact).toHaveAttribute('aria-hidden', 'false');
    vi.unstubAllGlobals();
  });
});

describe('TabBar', () => {
  it('is a navigation landmark that marks the current tab', () => {
    render(
      <TabBar
        label="Main"
        current="today"
        tabs={[
          { id: 'today', label: 'Today', icon: Sun, href: '#today' },
          { id: 'history', label: 'History', icon: CalendarDays, href: '#history' },
        ]}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'History' })).not.toHaveAttribute('aria-current');
  });
});

describe('ModelCard', () => {
  it('is an article named by the model and lists its metrics', () => {
    render(
      <ModelCard
        name="posture-tcn"
        version="v3"
        dataVersion="data-v2"
        classes={['upright']}
        classLabels={{ upright: 'Upright' }}
        facts={[{ label: 'Macro F1', value: '0.89' }]}
      />,
    );
    expect(screen.getByRole('article', { name: /posture-tcn/ })).toBeInTheDocument();
    expect(screen.getByText('0.89')).toBeInTheDocument();
  });
});
