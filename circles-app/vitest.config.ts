import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '@garden-ui/focus': fileURLToPath(new URL('../packages/ui-focus/src/index.ts', import.meta.url)),
      '@garden-ui/keyboard-list': fileURLToPath(new URL('../packages/ui-keyboard-list/src/index.ts', import.meta.url)),
      '@garden-ui/popup-runtime': fileURLToPath(new URL('../packages/ui-popup-runtime/src/index.ts', import.meta.url)),
      '@garden-ui/tabs': fileURLToPath(new URL('../packages/ui-tabs/src/index.ts', import.meta.url)),
      '@garden-ui/popup': fileURLToPath(new URL('../packages/ui-popup/src/index.ts', import.meta.url)),
      '@garden-ui/list-shell': fileURLToPath(new URL('../packages/ui-list-shell/src/index.ts', import.meta.url)),
      '@garden-ui/list-data': fileURLToPath(new URL('../packages/ui-list-data/src/index.ts', import.meta.url)),
      '@garden-ui/flow-step': fileURLToPath(new URL('../packages/ui-flow-step/src/index.ts', import.meta.url)),
    },
    conditions: ['browser'],
  },
  test: {
    globals: true,
    // Use the Node environment by default to avoid requiring a DOM implementation.
    // Individual test files can opt into jsdom via `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./tests/setup.ts']
  }
});
