import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import { CircleAlert, Compass } from 'lucide-react';
import type { AppConfig } from '../config/app-config';
import { copy } from '../copy';
import { readDemoMode } from '../data/mode';
import { Notice, PageSkeleton } from '../screens/Page';
import { DataProvider, useData, type Preview } from './data';
import { PrefsProvider } from './prefs';
import { previewState } from './preview';
import { RouterProvider, useRouter } from './router';
import type { ScreenId } from './routes';
import { SentinelProvider } from './sentinel';
import { SessionProvider } from './session';
import { Shell } from './Shell';
import { ToastProvider } from './toast';

interface AppProps {
  config: AppConfig;
  path?: string;
  /** Overrides the URL and the remembered choice (tests). */
  demo?: boolean;
}

// The /design routes are the Phase 2 design-system surfaces; each loads on demand.
const designRoutes: Record<string, LazyExoticComponent<ComponentType>> = {
  '/design': lazy(() => import('../pages/design/Directions')),
  '/design/components': lazy(() => import('../pages/design/Gallery')),
  '/design/overlay': lazy(() => import('../pages/design/OverlayLab')),
  '/design/mobile': lazy(() => import('../pages/design/MobileToday')),
};

const screens: Record<
  Exclude<ScreenId, 'day' | 'today' | 'not_found'>,
  LazyExoticComponent<ComponentType>
> = {
  live: lazy(() => import('../screens/Live')),
  welcome: lazy(() => import('../screens/Welcome')),
  calibrate: lazy(() => import('../screens/Calibrate')),
  sentinel: lazy(() => import('../screens/Sentinel')),
  nudges: lazy(() => import('../screens/Nudges')),
  history: lazy(() => import('../screens/History')),
  studio: lazy(() => import('../screens/Studio')),
  lab: lazy(() => import('../screens/Lab')),
  settings: lazy(() => import('../screens/Settings')),
};
const Today = lazy(() => import('../screens/Report').then((m) => ({ default: m.Today })));
const Day = lazy(() => import('../screens/Report').then((m) => ({ default: m.Day })));

function Screen() {
  const { route } = useRouter();
  const { data } = useData();
  // Real mode has nothing to show until the camera pipeline lands, so first run starts at Welcome.
  const screen = route.screen === 'live' && !data.demo ? 'welcome' : route.screen;
  if (screen === 'not_found')
    return (
      <div className="pt-10">
        <Notice
          icon={Compass}
          title={copy.states.not_found_title}
          body={copy.states.not_found_body}
          action={copy.states.not_found_action}
          href="/"
        />
      </div>
    );
  if (screen === 'today') return <Today />;
  if (screen === 'day') return <Day date={route.params['date'] ?? ''} />;
  const Page = screens[screen];
  return <Page />;
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-5xl bg-surface px-(--space-gutter) text-text">
      {children}
    </div>
  );
}

export function App({ config, path = window.location.pathname, demo }: AppProps) {
  const route = path.replace(/\/+$/, '') || '/';
  const Design = designRoutes[route];
  if (Design) {
    return (
      <>
        <title>{config.name}</title>
        <Suspense fallback={<div className="min-h-dvh bg-surface" aria-busy="true" />}>
          <Design />
        </Suspense>
      </>
    );
  }

  const isDemo = demo ?? readDemoMode();
  const preview = previewState(isDemo);
  const dataPreview: Preview =
    preview === 'loading' || preview === 'error' || preview === 'empty' ? preview : null;

  return (
    <>
      <title>{config.name}</title>
      <ToastProvider>
        <DataProvider
          demo={isDemo}
          preview={dataPreview}
          renderLoading={() => (
            <Frame>
              <PageSkeleton label={copy.states.loading} />
            </Frame>
          )}
          renderError={(message, retry) => (
            <Frame>
              <div className="pt-16">
                <Notice
                  icon={CircleAlert}
                  tone="warning"
                  title={copy.states.error_title}
                  body={copy.states.error_body.replace('{detail}', message)}
                  action={copy.states.retry}
                  onAction={retry}
                />
              </div>
            </Frame>
          )}
        >
          <AppBody name={config.name} path={path} forceUnsupported={preview === 'unsupported'} />
        </DataProvider>
      </ToastProvider>
    </>
  );
}

function AppBody({
  name,
  path,
  forceUnsupported,
}: {
  name: string;
  path: string;
  forceUnsupported: boolean;
}) {
  const { data } = useData();
  const camera =
    data.library?.calibrations.find((c) => c.active)?.camera ?? data.library?.cameras[0] ?? '';
  return (
    <RouterProvider initialPath={path}>
      <PrefsProvider camera={camera}>
        <SessionProvider>
          <SentinelProvider forceUnsupported={forceUnsupported}>
            <Shell name={name}>
              <Suspense fallback={<PageSkeleton label={copy.states.loading} />}>
                <Screen />
              </Suspense>
            </Shell>
          </SentinelProvider>
        </SessionProvider>
      </PrefsProvider>
    </RouterProvider>
  );
}
