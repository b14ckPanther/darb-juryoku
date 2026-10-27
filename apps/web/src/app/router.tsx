import {
  addTransitionType,
  createContext,
  startTransition,
  use,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { matchRoute, navType, type Match } from './routes';

interface RouterValue {
  path: string;
  /** Path and query string. */
  location: string;
  route: Match;
  navigate: (href: string) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

/**
 * A small history router. Navigations run in a transition tagged with their direction, so the page's
 * <ViewTransition> picks a slide into a day report, a slide back out, or a fade between tabs.
 */
export function RouterProvider({
  initialPath,
  children,
}: {
  initialPath: string;
  children: ReactNode;
}) {
  // The location is the path plus the query string, so a change in either re-renders.
  const [location, setLocation] = useState(() => initialPath + window.location.search);
  const path = new URL(location, 'http://x').pathname;
  const route = matchRoute(path);

  useEffect(() => {
    const onPop = () => {
      const next = window.location.pathname;
      startTransition(() => {
        addTransitionType(navType(matchRoute(path).screen, matchRoute(next).screen));
        setLocation(next + window.location.search);
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [path]);

  const navigate = (href: string) => {
    const url = new URL(href, window.location.href);
    const next = url.pathname + url.search;
    if (next === location) return;
    window.history.pushState(null, '', next + url.hash);
    startTransition(() => {
      addTransitionType(navType(route.screen, matchRoute(url.pathname).screen));
      setLocation(next);
    });
    window.scrollTo({ top: 0 });
  };

  return <RouterContext value={{ path, location, route, navigate }}>{children}</RouterContext>;
}

export function useRouter(): RouterValue {
  const value = use(RouterContext);
  if (!value) throw new Error('useRouter needs a RouterProvider');
  return value;
}

/** An in-app link: a real anchor (open in new tab still works) that navigates in place on a plain click. */
export function Link({
  href,
  onClick,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    navigate(href);
  };
  return (
    <a href={href} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
