import type { ReactNode } from 'react';
import markUrl from '../../../../../brand/exports/svg/mark-gold.svg?url';
import { useTheme, type ThemeName } from '../../app/theme';
import { designSeed } from '../../demo/seed';
import { SegmentedControl } from '../../ui/controls';
import { Banner } from '../../ui/feedback';

/** Frame for every /design page: skip link, brand, page links, theme switch and the demo banner. */
export function DesignShell({
  current,
  children,
  themeSwitch = true,
}: {
  current: string;
  children: ReactNode;
  themeSwitch?: boolean;
}) {
  const { nav, banner, theme_switch } = designSeed;
  const [theme, setTheme] = useTheme();
  const names = theme_switch.options;
  const byLabel = (label: string): ThemeName => (label === names.light ? 'light' : 'dark');

  return (
    <div className="min-h-dvh bg-surface text-text">
      <a
        href="#main"
        className="sr-only rounded-control bg-accent-fill px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-banner)"
      >
        {nav.label}
      </a>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-(--space-gutter) pt-5 pb-4">
        <a
          href="/"
          className="flex min-h-(--touch-min) items-center gap-2.5 text-text no-underline"
        >
          <img src={markUrl} alt="" width={28} height={28} />
          <span className="font-display text-title3">{nav.home}</span>
        </a>
        <nav
          aria-label={nav.label}
          className="order-3 w-full overflow-x-auto sm:order-none sm:w-auto sm:flex-1"
        >
          <ul className="m-0 flex list-none gap-1 p-0">
            {nav.links.map((link) => {
              const active = link.href === current;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'inline-flex min-h-(--touch-min) items-center rounded-control bg-surface-overlay px-4 text-subhead font-medium whitespace-nowrap text-text no-underline'
                        : 'inline-flex min-h-(--touch-min) items-center rounded-control px-4 text-subhead whitespace-nowrap text-text-secondary no-underline hover:text-text'
                    }
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        {themeSwitch && (
          <div className="ml-auto">
            <SegmentedControl
              label={theme_switch.label}
              options={[names.dark, names.light]}
              value={names[theme]}
              onChange={(label) => setTheme(byLabel(label))}
            />
          </div>
        )}
      </header>
      <div className="mx-auto max-w-6xl px-(--space-gutter)">
        <Banner tone="demo" detail={banner.demo_detail}>
          {banner.demo}
        </Banner>
      </div>
      <main id="main" className="mx-auto max-w-6xl px-(--space-gutter) pt-10 pb-24">
        {children}
      </main>
    </div>
  );
}
