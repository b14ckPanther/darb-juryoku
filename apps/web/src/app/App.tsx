import type { AppConfig } from '../config/app-config';

interface AppProps {
  config: AppConfig;
}

export function App({ config }: AppProps) {
  return (
    <main>
      <h1>{config.name}</h1>
    </main>
  );
}
