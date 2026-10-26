import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url));

// The dev server may read only these folders outside apps/web (never data/ or models/).
const allowedOutsideApp = [
  'apps/web',
  'node_modules',
  'config',
  'packages/schemas',
  'brand/src',
].map(fromRoot);

// COOP/COEP are required for multi-threaded WASM (SharedArrayBuffer), see ARCHITECTURE section 10.
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: isolationHeaders, fs: { allow: allowedOutsideApp } },
  preview: { headers: isolationHeaders },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
