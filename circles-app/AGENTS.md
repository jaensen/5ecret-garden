# AGENTS.md — circles-app

This file was reconstructed because no original `AGENTS.md` or `.clinerules/` files were present in the local checkout.

Source basis:

- `docs/ui-ux-patterns-audit-for-automated-tests.md`
- `docs/multi-step-flows-send-gold-standard-blueprint.md`
- `docs/component-library-extraction-plan.md`
- inspected shared primitives under `src/lib/shared/*`

Anything not backed by repository files must be marked `UNVERIFIED`.

## Hard Rules

1. Do not invent project facts.
   - Every architectural claim must reference a file path.
   - Unknown or missing information must be marked `UNVERIFIED`.

2. Do not introduce duplicate interaction primitives.
   Reuse existing shared primitives instead of reimplementing:
   - popup runtime: `src/lib/shared/state/popup/index.ts`
   - popup host: `src/lib/shared/ui/shell/PopupHost.svelte`
   - tabs: `src/lib/shared/ui/primitives/tabs/`
   - list keyboard navigation: `src/lib/shared/ui/lists/utils/keyboardListNavigator.ts`
   - focus policy: `src/lib/shared/ui/focus/focusPolicy.ts`
   - flow runtime: `src/lib/shared/flow/`
   - flow UI scaffold: `src/lib/shared/ui/flow/`

3. Do not introduce a second wallet connection architecture.
   Wallet, Circles SDK, Safe, wagmi, viem, and ethers integrations must be understood from existing code first.
   Relevant starting points include:
   - `src/config.ts`
   - `src/lib/shared/state/wallet.svelte.ts`
   - `src/lib/shared/state/circles.ts`
   - `src/lib/shared/integrations/wallet/`
   - `src/lib/shared/integrations/chain/gnosis.ts`

4. Keep navigation layers separate.
   Per `docs/multi-step-flows-send-gold-standard-blueprint.md`:
   - use `openStep` / `replaceStep` for forward popup-flow step transitions,
   - use `popupControls.back`, `popupControls.popTo`, `popupControls.close` for stack-aware behavior,
   - use route navigation only for page-level routing or explicit route-wrapped popup patterns.

   Do not use `goto()` or `history.back()` to emulate popup step navigation.

5. Treat the Send flow as the gold standard.
   The reference flow is under:
   - `src/lib/areas/wallet/flows/send/`

   New or refactored multi-step flows should match its standards for:
   - step orientation,
   - explicit focus targets,
   - keyboard paths,
   - review/edit loops,
   - derived validation,
   - async state handling,
   - progressive disclosure.

6. Prefer generic focus markers for new code.
   New steps should use:
   - `data-popup-initial-input`
   - `data-popup-initial-focus`

   Existing `data-send-step-initial-*` selectors are legacy compatibility markers read by `PopupHost.svelte` and should not be newly introduced.

7. Preserve popup keyboard and focus contracts.
   `PopupHost.svelte` owns:
   - focus trap,
   - focus restoration,
   - Escape close policy,
   - Backspace stack navigation safety,
   - Enter default-action fallback,
   - mounted-but-inactive page behavior via `inert` and `aria-hidden`.

8. Preserve tabs and list keyboard contracts.
   Tabs must preserve roving tabindex and semantic tab/panel linkage.
   Search/list UIs must preserve input-to-row handoff and row keyboard behavior.

9. Do not refactor production UI as part of component-library extraction.
   Per `docs/component-library-extraction-plan.md`, any future component library should be built in parallel under `packages/` and proven with a send-flow mock before adoption.

10. Run relevant checks before declaring implementation complete.
    Known package scripts:
    - `npm run check`
    - `npm run check:flow-contracts`
    - `npm run check:ui-tokens`
    - `npm run check:ui-tokens:strict`

    Note: in the inspected checkout, `circles-app/scripts/` was empty, while package scripts reference guardrail files there. Treat this as a repository inconsistency until verified.

## Development Approach

Work outside-in:

1. Read docs and rules first.
2. Inspect package/config/build setup.
3. Understand `areas/*` feature domains and `shared/*` reusable layers.
4. Identify existing reusable primitives before adding code.
5. Use Send flow as reference for multi-step UX.
6. Inspect Web3/wallet state before touching wallet, SDK, signer, transaction, or chain behavior.
7. Add or update tests around shared contracts where behavior changes.

For GitHub, CI/CD, versioning, branching, release, and PR workflow, follow:

- `docs/development-workflow.md`

Key workflow expectations:

- prefer small feature branches (`feat/*`, `fix/*`, `docs/*`, `chore/*`, `ci/*`),
- use Conventional Commit-style messages,
- require CI to pass before merging,
- run package publish dry-runs before publishing,
- treat deployment details not present in this checkout as `UNVERIFIED`.

## Architecture Boundaries

- `src/lib/areas/*` contains feature/domain UI and flows.
- `src/lib/shared/*` contains reusable primitives, state, models, utilities, config, guards, and cross-domain infrastructure.
- `src/routes/*` wires route surfaces and route-wrapped popups.
- `packages/*` is for package/library work and must not depend on app-specific domain state unless explicitly intended and documented.

## Required Documentation Discipline

When creating or updating architecture docs such as `memory-bank/PROJECT_MAP.md`:

- include file paths for every claim,
- list `UNVERIFIED` gaps,
- list files not read and why,
- mark outdated or missing docs explicitly,
- prefer smaller verified statements over broad assumptions.
