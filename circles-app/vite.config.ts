import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    nodePolyfills({
      exclude: ['fs'],
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    }),
    sveltekit(),
  ],
  resolve: {
    alias: {
      // Map the local SDK package for dev/build without publishing
      '@circles-market/sdk': fileURLToPath(new URL('../packages/circles-market-sdk/src/index.ts', import.meta.url)),
      // Component packages during split (point to source shims)
      '@circles-market/core': fileURLToPath(new URL('../packages/circles-market-core/src/index.ts', import.meta.url)),
      '@circles-market/session': fileURLToPath(new URL('../packages/circles-market-session/src/index.ts', import.meta.url)),
      '@circles-market/catalog': fileURLToPath(new URL('../packages/circles-market-catalog/src/index.ts', import.meta.url)),
      '@circles-market/cart': fileURLToPath(new URL('../packages/circles-market-cart/src/index.ts', import.meta.url)),
      '@circles-market/orders': fileURLToPath(new URL('../packages/circles-market-orders/src/index.ts', import.meta.url)),
      '@circles-market/signers': fileURLToPath(new URL('../packages/circles-market-signers/src/index.ts', import.meta.url)),
      '@circles-market/auth': fileURLToPath(new URL('../packages/circles-market-auth/src/index.ts', import.meta.url)),
      '@circles-market/offers': fileURLToPath(new URL('../packages/circles-market-offers/src/index.ts', import.meta.url)),
      '@circles-market/sales': fileURLToPath(new URL('../packages/circles-market-sales/src/index.ts', import.meta.url)),
       '@garden-ui/focus': fileURLToPath(new URL('../packages/ui-focus/src/index.ts', import.meta.url)),
       '@garden-ui/keyboard-list': fileURLToPath(new URL('../packages/ui-keyboard-list/src/index.ts', import.meta.url)),
       '@garden-ui/popup-runtime': fileURLToPath(new URL('../packages/ui-popup-runtime/src/index.ts', import.meta.url)),
       '@garden-ui/tabs': fileURLToPath(new URL('../packages/ui-tabs/src/index.ts', import.meta.url)),
       '@garden-ui/popup': fileURLToPath(new URL('../packages/ui-popup/src/index.ts', import.meta.url)),
       '@garden-ui/list-shell': fileURLToPath(new URL('../packages/ui-list-shell/src/index.ts', import.meta.url)),
       '@garden-ui/list-data': fileURLToPath(new URL('../packages/ui-list-data/src/index.ts', import.meta.url)),
       '@garden-ui/flow-step': fileURLToPath(new URL('../packages/ui-flow-step/src/index.ts', import.meta.url)),
       '@garden-ui/row': fileURLToPath(new URL('../packages/ui-row/src/index.ts', import.meta.url)),
       '@garden-ui/avatar': fileURLToPath(new URL('../packages/ui-avatar/src/index.ts', import.meta.url)),
      // Map the local profile core package
      '@circles-profile/core': fileURLToPath(new URL('../packages/circles-profile-core/src/index.ts', import.meta.url)),
    },
  },
});
