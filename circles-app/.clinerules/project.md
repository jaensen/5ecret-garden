# Cline Workspace Rules — circles-app

These rules were reconstructed from repository docs and inspected code because the original `.clinerules/` directory was missing in the local checkout.

## Evidence First

- Do not invent project facts.
- Every architecture claim must be backed by a file path.
- Mark unknowns as `UNVERIFIED`.
- If required docs or files are missing, stop and report that instead of guessing.

## Read Order

Before analysis or implementation, read:

1. `AGENTS.md`
2. `docs/ui-ux-patterns-audit-for-automated-tests.md`
3. `docs/multi-step-flows-send-gold-standard-blueprint.md`
4. `docs/component-library-extraction-plan.md`
5. relevant source files for the task.

## Reusable Primitives Are Contracts

Do not duplicate these systems:

- Popup state/runtime: `src/lib/shared/state/popup/index.ts`
- Popup shell/focus/keyboard: `src/lib/shared/ui/shell/PopupHost.svelte`
- Tabs primitive: `src/lib/shared/ui/primitives/tabs/`
- List keyboard navigation: `src/lib/shared/ui/lists/utils/keyboardListNavigator.ts`
- Focus policy: `src/lib/shared/ui/focus/focusPolicy.ts`
- Flow runtime: `src/lib/shared/flow/`
- Flow UI components: `src/lib/shared/ui/flow/`

New code must consume these where applicable.

## Multi-Step Flow Rules

Use the Send flow as the reference:

- `src/lib/areas/wallet/flows/send/`

Navigation layers must stay separate:

- Flow runtime: `openStep`, `replaceStep`, `popToOrOpen`
- Popup stack: `popupControls.back`, `popupControls.popTo`, `popupControls.close`
- Route/page layer: SvelteKit navigation only for real route navigation

Forbidden:

- `goto()` or `history.back()` as popup-step navigation.
- opening unrelated domain steps into the same stack without an explicit reset/close boundary.
- adding new send-specific focus markers.

For new steps use:

- `data-popup-initial-input`
- `data-popup-initial-focus`

## Popup UX Rules

Preserve these `PopupHost.svelte` contracts:

- focus trap inside popup,
- focus restore after close,
- desktop-aware initial input focus,
- non-input focus fallback for touch/small screens,
- Escape follows dismiss policy,
- Backspace never hijacks text editing and never closes the last popup,
- Enter default action only fires when safe,
- only top popup page is interactive.

## Tabs/List UX Rules

Tabs must preserve:

- `role="tablist"`, `role="tab"`, `role="tabpanel"`,
- roving tabindex,
- ArrowLeft/ArrowRight/Home/End behavior,
- disabled-tab skipping,
- panel linkage via `aria-controls` / `aria-labelledby`.

Search/list UIs must preserve:

- ArrowDown from input to first row,
- ArrowUp from first row back to input,
- Escape from row back to input without closing parent popup,
- Enter/Space activation only when the row itself owns the event,
- nested interactive controls keep native behavior.

## Web3 / Wallet Rules

Do not add a second wallet connection or SDK initialization pattern.

Inspect existing code first:

- `src/config.ts`
- `src/lib/shared/state/wallet.svelte.ts`
- `src/lib/shared/state/circles.ts`
- `src/lib/shared/integrations/wallet/`
- `src/lib/shared/integrations/chain/gnosis.ts`
- transaction helpers under `src/lib/shared/utils/`

Before changing wallet/transaction behavior, identify:

- where the SDK/client is initialized,
- where signer/provider comes from,
- how Gnosis chain switching is handled,
- how user rejection and transaction failures surface,
- where addresses and ABIs are defined.

## Svelte/SvelteKit Rules

- Follow existing Svelte 5 runes style where present (`$state`, `$derived`, `$effect`, `$props`).
- Keep route concerns in `src/routes/*`.
- Keep reusable cross-domain logic in `src/lib/shared/*`.
- Keep feature-specific flows and UI in `src/lib/areas/*`.
- Avoid moving app-specific domain state into future library packages.

## Component Library Rule

If working on package extraction:

- build new packages in parallel under `packages/`,
- do not refactor current app UI in place,
- define contracts first,
- implement behavior foundations before visual packages,
- prove behavior with a send-flow mock and tests before app adoption.

## Checks

Before completion, run relevant checks when available:

- `npm run check`
- `npm run check:flow-contracts`
- `npm run check:ui-tokens`
- `npm run check:ui-tokens:strict`

If a script references missing files, report that as a repository inconsistency instead of ignoring it.

## GitHub / CI / Versioning Workflow

Follow the repository workflow guide:

- `docs/development-workflow.md`

Defaults:

- use small GitHub-flow branches from `dev` or `main`,
- use Conventional Commit-style messages,
- keep PRs focused and layer-aware (`routes`, `areas`, `shared`, `packages`),
- require GitHub Actions CI before merge,
- run package publish dry-runs before real npm publish,
- use Semantic Versioning for publishable packages under `packages/*`,
- mark deployment assumptions as `UNVERIFIED` unless backed by repository files.
