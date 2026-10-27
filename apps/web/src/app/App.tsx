import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import type { AppConfig } from '../config/app-config';
import { Home } from '../pages/Home';

interface AppProps {
  config: AppConfig;
  path?: string;
}

// The /design routes are demo surfaces for the Phase 2 design system; each loads on demand.
const designRoutes: Record<string, LazyExoticComponent<ComponentType>> = {
  '/design': lazy(() => import('../pages/design/Directions')),
  '/design/components': lazy(() => import('../pages/design/Gallery')),
  '/design/overlay': lazy(() => import('../pages/design/OverlayLab')),
  '/design/mobile': lazy(() => import('../pages/design/MobileToday')),
};

export function App({ config, path = window.location.pathname }: AppProps) {
  const route = path.replace(/\/+$/, '') || '/';
  const Page = designRoutes[route];
  return (
    <>
      <title>{config.name}</title>
      {Page ? (
        <Suspense fallback={<div className="min-h-dvh bg-surface" aria-busy="true" />}>
          <Page />
        </Suspense>
      ) : (
        <Home name={config.name} />
      )}
    </>
  );
}
