import { render, screen } from '@testing-library/react';
import { App } from '../app/App';
import { appConfig } from '../config/app-config';

/** Renders the whole app at a path, in demo mode unless told otherwise, and waits for the data. */
export async function renderApp(path: string, { demo = true, search = '' } = {}) {
  window.history.replaceState(null, '', path + search);
  const result = render(<App config={appConfig} path={path} demo={demo} />);
  await screen.findByRole('main', {}, { timeout: 3000 });
  return result;
}
