import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { appConfig } from '../config/app-config';
import { App } from './App';

describe('App', () => {
  it('shows the app name from the loaded config as the main heading', () => {
    render(<App config={appConfig} />);
    expect(screen.getByRole('heading', { level: 1, name: appConfig.name })).toBeInTheDocument();
  });

  it('takes its name from config, not from the code', () => {
    render(<App config={{ ...appConfig, name: 'Fixture Name' }} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Fixture Name' })).toBeInTheDocument();
  });

  it('sets the document title from config', () => {
    render(<App config={{ ...appConfig, name: 'Fixture Title' }} />);
    expect(document.title).toBe('Fixture Title');
  });
});
