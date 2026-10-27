import {
  Activity,
  CalendarDays,
  Database,
  FlaskConical,
  Keyboard,
  PictureInPicture2,
  ScanFace,
  Settings,
  Sun,
  Video,
  BellRing,
  type LucideIcon,
} from 'lucide-react';
import { ViewTransition, useEffect, useState, type ReactNode } from 'react';
import markUrl from '../../../../brand/exports/svg/mark-gold.svg?url';
import { settingsConfig } from '../config/runtime';
import { copy } from '../copy';
import { SegmentedControl } from '../ui/controls';
import { cx } from '../ui/cx';
import { Banner } from '../ui/feedback';
import { TabBar } from '../ui/mobile';
import { Sheet } from '../ui/sheet';
import { useData } from './data';
import { Link, useRouter } from './router';
import type { ScreenId } from './routes';
import { useSentinel } from './sentinel';
import { useSession } from './session';
import { shortcutFor } from './shortcuts';
import { useTheme, type ThemeName } from './theme';

interface NavItem {
  id: ScreenId;
  href: string;
  label: string;
  icon: LucideIcon;
}

const primary: NavItem[] = [
  { id: 'live', href: '/', label: copy.nav.live, icon: Video },
  { id: 'today', href: '/today', label: copy.nav.today, icon: Sun },
  { id: 'history', href: '/history', label: copy.nav.history, icon: CalendarDays },
  { id: 'studio', href: '/studio', label: copy.nav.studio, icon: Database },
  { id: 'lab', href: '/lab', label: copy.nav.lab, icon: FlaskConical },
  { id: 'settings', href: '/settings', label: copy.nav.settings, icon: Settings },
];

const session: NavItem[] = [
  { id: 'calibrate', href: '/calibrate', label: copy.nav.calibrate, icon: ScanFace },
  { id: 'sentinel', href: '/sentinel', label: copy.nav.sentinel, icon: PictureInPicture2 },
  { id: 'nudges', href: '/nudges', label: copy.nav.nudges, icon: BellRing },
];

// The phone keeps the four tabs of UI_DESIGN section 6; other screens light the tab they belong to.
const tabFor: Partial<Record<ScreenId, string>> = {
  live: 'live',
  calibrate: 'live',
  sentinel: 'live',
  nudges: 'live',
  today: 'today',
  history: 'history',
  day: 'history',
  settings: 'settings',
  studio: 'settings',
  lab: 'settings',
};

export function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const byLabel = (label: string): ThemeName => (label === copy.theme.light ? 'light' : 'dark');
  return (
    <SegmentedControl
      label={copy.theme.label}
      options={[copy.theme.dark, copy.theme.light]}
      value={copy.theme[theme]}
      onChange={(l) => setTheme(byLabel(l))}
    />
  );
}

function SideNav({
  current,
  name,
  onHelp,
}: {
  current: ScreenId;
  name: string;
  onHelp: () => void;
}) {
  const item = ({ id, href, label, icon: Icon }: NavItem) => {
    const active = id === current || (id === 'history' && current === 'day');
    return (
      <li key={id}>
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          className={cx(
            'pressable flex min-h-(--touch-min) items-center gap-3 rounded-control px-3 text-subhead no-underline transition-colors',
            active
              ? 'bg-surface-overlay font-medium text-text'
              : 'text-text-secondary hover:bg-surface-overlay/60 hover:text-text',
          )}
        >
          <Icon
            aria-hidden
            size={20}
            strokeWidth={1.75}
            className={active ? 'text-accent-text' : undefined}
          />
          {label}
        </Link>
      </li>
    );
  };
  return (
    <aside className="fixed inset-y-0 left-0 z-(--z-sticky) hidden w-64 flex-col border-r border-rule bg-surface lg:flex">
      <Link href="/" className="flex min-h-16 items-center gap-3 px-6 pt-4 text-text no-underline">
        <img src={markUrl} alt="" width={30} height={30} />
        <span translate="no" className="font-display text-title3">
          {name}
        </span>
      </Link>
      <nav
        aria-label={copy.nav.label}
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-6"
      >
        <ul className="m-0 grid list-none gap-0.5 p-0">{primary.map(item)}</ul>
        <ul className="m-0 grid list-none gap-0.5 border-t border-rule p-0 pt-6">
          {session.map(item)}
        </ul>
      </nav>
      <div className="grid gap-3 px-5 pt-4 pb-6">
        <button
          type="button"
          onClick={onHelp}
          className="pressable flex min-h-(--touch-min) items-center gap-2 text-footnote text-text-secondary hover:text-text"
        >
          <Keyboard aria-hidden size={18} strokeWidth={1.75} />
          {copy.shortcuts.open}
          <kbd className="ml-auto rounded-[6px] border border-rule px-1.5 font-ui text-caption">
            {settingsConfig.shortcuts.help}
          </kbd>
        </button>
        <ThemeSwitch />
      </div>
    </aside>
  );
}

const shortcutRows = [
  ['pause', copy.shortcuts.space],
  ['calibrate', settingsConfig.shortcuts.calibrate.toUpperCase()],
  ['sentinel', settingsConfig.shortcuts.sentinel.toUpperCase()],
  ['help', settingsConfig.shortcuts.help],
] as const;

export function ShortcutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={copy.shortcuts.title}>
      <dl className="m-0 grid gap-0 overflow-hidden rounded-container bg-surface-raised">
        {shortcutRows.map(([action, key]) => (
          <div
            key={action}
            className="flex min-h-(--touch-min) items-center justify-between gap-4 border-rule px-4 py-2 [&+&]:border-t"
          >
            <dt className="text-body">{copy.shortcuts[action]}</dt>
            <dd className="m-0">
              <kbd className="inline-grid min-w-9 place-items-center rounded-[8px] border border-control-border bg-surface-overlay px-2 py-1 font-ui text-footnote font-medium">
                {key}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 mb-4 text-footnote text-text-secondary">{copy.shortcuts.note}</p>
    </Sheet>
  );
}

/** The frame around every screen: navigation (sidebar on desktop, tab bar on the phone), the demo banner and shortcuts. */
export function Shell({ name, children }: { name: string; children: ReactNode }) {
  const { route, path, navigate } = useRouter();
  const { data } = useData();
  const sentinel = useSentinel();
  const live = useSession();
  const [help, setHelp] = useState(false);
  useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      const action = shortcutFor(
        {
          key: e.key,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          target: e.target as HTMLElement | null,
        },
        settingsConfig.shortcuts,
      );
      if (!action) return;
      e.preventDefault();
      if (action === 'help') setHelp(true);
      if (action === 'calibrate') navigate('/calibrate');
      if (action === 'pause' && data.library) live.togglePause();
      if (action === 'sentinel') {
        if (sentinel.supported && data.library) void sentinel.open();
        else navigate('/sentinel');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, sentinel, live, data.library]);

  const tabs = [
    { id: 'today', label: copy.nav.today, icon: Sun, href: '/today' },
    { id: 'history', label: copy.nav.history, icon: CalendarDays, href: '/history' },
    { id: 'live', label: copy.nav.live, icon: Activity, href: '/' },
    { id: 'settings', label: copy.nav.settings, icon: Settings, href: '/settings' },
  ];

  return (
    <div className="min-h-dvh bg-surface text-text">
      <a
        href="#main"
        className="sr-only rounded-control bg-accent-fill px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-banner)"
      >
        {copy.app.skip}
      </a>
      <SideNav current={route.screen} name={name} onHelp={() => setHelp(true)} />
      <div className="lg:pl-64">
        {data.demo && (
          <div className="mx-auto max-w-5xl px-(--space-gutter) pt-[max(0.75rem,env(safe-area-inset-top))] lg:pt-5">
            <Banner tone="demo" detail={copy.demo.detail}>
              {copy.demo.banner}
            </Banner>
          </div>
        )}
        <main
          id="main"
          className="mx-auto max-w-5xl px-(--space-gutter) pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-20"
        >
          <ViewTransition
            key={path}
            default="none"
            enter={{
              'nav-forward': 'nav-forward',
              'nav-back': 'nav-back',
              'nav-lateral': 'nav-fade',
              default: 'none',
            }}
            exit={{
              'nav-forward': 'nav-forward',
              'nav-back': 'nav-back',
              'nav-lateral': 'nav-fade',
              default: 'none',
            }}
          >
            <div>{children}</div>
          </ViewTransition>
        </main>
      </div>
      <div className="lg:hidden">
        <TabBar
          label={copy.nav.tabs_label}
          current={tabFor[route.screen] ?? ''}
          tabs={tabs}
          onNavigate={navigate}
        />
      </div>
      <ShortcutSheet open={help} onClose={() => setHelp(false)} />
    </div>
  );
}
