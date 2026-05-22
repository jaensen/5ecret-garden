// The app currently runs in SPA mode.
// Most routes depend on browser-only wallet/session state and interactive client flows,
// so we disable SSR at the root layout to make that policy explicit for the whole route tree.
export const ssr = false;
