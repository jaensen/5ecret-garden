# Circles App UI Architecture Guardrails

**Application:** `circles-app`
**Audience:** developers building or changing UI components, shared libraries, wrappers, flows, and feature surfaces
**Purpose:** define the architecture, ownership model, and reuse rules for UI work in this repository
**Scope:** architecture and interaction patterns only — no visual styling guidance

---

## 1. Why this document exists

This document is the architectural guardrail for UI development in `circles-app`.

It exists to protect the current system from drifting into:

- feature-local one-off components
- duplicated interaction logic
- wrapper bypasses
- inconsistent popup/list/flow behavior
- accidental movement of responsibilities into the wrong layer

Use this document when deciding:

- where a new UI behavior belongs
- whether to create a package primitive, app wrapper, or feature component
- how to extend an existing flow
- how to add tests around UI contracts

This is not a styling guide.
It is a **layering, ownership, and composition guide**.

---

## 2. The architecture in one sentence

The Circles UI is built from:

1. **workspace package primitives** for reusable interaction behavior
2. **app-owned wrappers** for Circles-specific configuration and integration
3. **feature composition** for product flows, pages, and domain-specific screens

That layering should be preserved.

---

## 3. The three UI layers

## 3.1 Package primitives

Workspace packages under `packages/` provide reusable interaction contracts.

Important current examples include:

- `@garden-ui/tabs`
- `@garden-ui/popup`
- `@garden-ui/popup-runtime`
- `@garden-ui/row`
- `@garden-ui/list-shell`
- `@garden-ui/keyboard-list`
- `@garden-ui/flow-step`
- `@garden-ui/list-data`
- `@garden-ui/avatar`

These packages are the right place for behavior that is:

- reusable across multiple app areas
- not specific to Circles product wiring
- testable as a stable interaction contract
- likely to be reused by multiple features or apps

Typical package-level responsibilities:

- keyboard behavior
- focus behavior
- state-machine-like interaction rules
- generic row/list/tab/flow contracts
- reusable accessibility semantics

### Rule

If the problem is a generic interaction problem, prefer solving it in a package primitive rather than in app feature code.

---

## 3.2 App-owned wrappers

`circles-app` contains wrappers that adapt package primitives to the application.

Important examples:

- `src/lib/shared/ui/primitives/RowFrame.svelte`
- `src/lib/shared/ui/flow/FlowStepScaffold.svelte`
- `src/lib/shared/ui/shell/PopupHost.svelte`
- `src/lib/shared/ui/shell/PageScaffold.svelte`

These wrappers are the correct layer for:

- app-wide selector policies
- app-wide default behavior
- product-specific integration with popup/runtime/page concerns
- cross-feature conventions that should not be reimplemented in every feature

Typical app-wrapper responsibilities:

- choosing the default focus selectors for popups
- defining popup dismissal policy integration
- connecting shared primitives to app runtime/state
- standardizing flow step scaffolding
- standardizing page shell behavior
- standardizing app-facing row composition

### Rule

If a reusable package already exists but the app needs product-level defaults or integration, add or extend an app wrapper instead of teaching every feature to configure the primitive manually.

---

## 3.3 Feature composition

Feature code should compose package primitives and app wrappers into product surfaces.

Examples:

- send flow
- trust flows
- gateway flows
- contacts search/select screens
- groups and balances lists
- settings tabs and sections

Feature code is the right place for:

- domain-specific view logic
- screen-level data wiring
- flow transition decisions
- composition of reusable building blocks
- product-specific validation and recovery actions

Feature code is **not** the right place for:

- inventing new generic keyboard behavior
- replacing shared popup behavior locally
- duplicating list-shell logic
- creating competing row/tab/step abstractions without a strong reason

### Rule

Feature code should compose the system, not redefine it.

---

## 4. The decision order for new UI work

Before creating anything new, ask these questions in order:

1. **Is this already a package primitive problem?**
2. **Is there already an app wrapper that should own this?**
3. **Is this only feature composition?**

This ordering matters.

### Use the highest reusable layer that matches the problem

- If it is generic and reusable, prefer the package layer.
- If it is app-specific but cross-feature, prefer the app wrapper/shared layer.
- If it is domain-specific, keep it in the feature.

### Do not move higher than necessary

Not every feature concern should become a package.
Not every local screen concern needs a new wrapper.

The goal is:

- **maximum reuse where appropriate**
- **minimum abstraction where unnecessary**

---

## 5. Reuse defaults for common UI problems

These are the default choices for common UI work.

- tabs → `@garden-ui/tabs`
- popup host behavior → app `PopupHost` wrapper
- rows and summary rows → app `RowFrame` wrapper
- multi-step flow surfaces → app `FlowStepScaffold` wrapper
- searchable list shell → `@garden-ui/list-shell`
- list controller behavior → `@garden-ui/list-data`
- keyboard list behavior → `@garden-ui/keyboard-list`
- route/page shell → `PageScaffold`

### Rule

When a shared solution already exists, use it first and justify any deviation explicitly.

---

## 6. Package vs wrapper vs feature: practical decision guide

## 6.1 Add or change a package primitive when...

- the behavior is generic
- it appears in multiple features
- it should have its own proof tests
- it is not inherently tied to Circles domain language
- the app wrapper would otherwise become a thin pass-through for repeated feature hacks

Examples:

- keyboard handoff behavior
- tab focus behavior
- popup focus trap mechanics
- generic flow-step helper composition

## 6.2 Add or change an app wrapper when...

- the primitive already exists but needs app-specific defaults
- multiple features need the same app-level policy
- runtime integration belongs to the app
- the concern is shared across the product but not generic enough for the package layer

Examples:

- popup selector policy
- popup dirty-state conventions
- app-facing row composition API
- flow-step defaults used across Circles flows

## 6.3 Keep it in feature code when...

- the concern is domain-specific
- it only exists in one flow or one product surface
- it is about data and transition logic, not generic interaction behavior
- extracting it would hide important domain meaning

Examples:

- send route recovery logic
- recipient selection flow transitions
- gateway creation step decisions
- group-specific management actions

---

## 7. Core interaction architecture patterns

## 7.1 Popup-first flow architecture

Popups are a primary navigation and task surface in this app.

They are used for:

- multi-step flows
- inspect/detail interactions
- edit flows
- confirm flows
- layered popup stacks

This means popup behavior is architecture, not just convenience UI.

### Guardrails

- use the shared popup host architecture
- respect popup runtime/state behavior
- do not create feature-local popup systems
- do not bypass popup dismissal/focus/default-action conventions without strong reason

If a new task is popup-shaped, build it on the popup system rather than inventing a route-local modal pattern.

---

## 7.2 Searchable list architecture

Searchable lists are built from cooperating concerns, not a single monolithic component.

Current separation:

- list controller/data behavior → `@garden-ui/list-data`
- shell/layout/state handling → `@garden-ui/list-shell`
- keyboard handoff/navigation → `@garden-ui/keyboard-list`
- app-specific row rendering / virtualization / placeholders → app or feature code

### Guardrails

- preserve the separation of shell, data, and keyboard behavior
- do not bury keyboard-list behavior inside one feature component
- do not rebuild empty/loading/no-match state handling ad hoc when the shell pattern already fits
- keep row rendering composable

---

## 7.3 Row-based composition architecture

Rows are a major structural primitive in this app.
They are used for:

- interactive list items
- passive grouped rows
- selection rows
- compact summary cards
- editable review rows inside flows

The app-facing row abstraction is `RowFrame`, which wraps `@garden-ui/row`.

### Guardrails

- treat row behavior as a shared contract
- use `RowFrame` for app-facing row composition
- do not create feature-local clones of row semantics
- keep row interaction behavior compatible with the shared contract

If something is structurally “a compact interactive summary or list row,” start from `RowFrame`.

---

## 7.4 Flow-step architecture

Serious multi-step tasks should use the shared flow-step system via the app wrapper.

The shared path is:

- package primitive → `@garden-ui/flow-step`
- app wrapper → `src/lib/shared/ui/flow/FlowStepScaffold.svelte`
- feature composition → send/trust/gateway/group flows

### Guardrails

- do not build important multi-step flows out of disconnected local forms if the flow-step pattern fits
- keep progress, actions, review summaries, and step transitions legible through the scaffold pattern
- prefer shared step helpers over one-off step structure

---

## 7.5 Page-shell architecture

Route-level pages should be scaffold-driven.

`PageScaffold` is the page-shell standard for structured route surfaces.

### Guardrails

- use `PageScaffold` when building route-level pages that match the app shell model
- avoid rebuilding header/collapsed-header/page-shell logic per route
- keep shell behavior centralized

---

## 8. Interaction contracts are part of the architecture

Keyboard and focus behavior are not optional polish.
They are architectural contracts.

If you change them, you are changing the UI system.

## 8.1 Popup focus contract

The popup host currently supports multiple initial-focus markers, including generic and legacy ones.

Supported selector families include:

- `data-ui-*`
- `data-popup-*`
- legacy send-step markers

### Guardrails

- prefer generic markers for new work when possible
- preserve compatibility when extending older flows
- do not create new one-off focus marker conventions without a system-level reason

---

## 8.2 Popup default action contract

Popup Enter behavior depends on shared default-action resolution.

### Guardrails

- mark intentional primary/default actions in ways compatible with the popup system
- do not add feature-local Enter handling that fights the host contract
- preserve predictable dialog submission behavior

---

## 8.3 Popup dirty-state and dismissal contract

Dismissal policy and dirty-state handling are centralized concerns.

### Guardrails

- if the user can lose work, use the popup contract
- avoid custom close hacks when shared dismiss behavior already covers the use case
- keep explicit-dismiss and recovery semantics within the host system

---

## 8.4 Keyboard list handoff contract

Searchable list keyboard behavior is standardized.

Examples include:

- ArrowDown from input into rows
- Escape from row back to input
- row-to-row navigation behavior
- activation on the row itself

### Guardrails

- searchable lists should preserve keyboard handoff behavior
- do not implement click-only picker experiences when they match the shared list model
- do not change keyboard behavior in one feature without considering the shared contract

---

## 8.5 Interaction-pattern guardrails for keyboard usability

Keyboard usability is a core architectural requirement in this app.

New components, wrappers, and flows must preserve the principle that the full interaction should remain usable without a pointer whenever the surface is interactive.

This applies especially to:

- popup flows
- searchable pickers
- row-based lists
- tabbed surfaces
- review/edit loops
- step-based transactional flows

### Guardrails

- keyboard support is not an enhancement layer; it is part of the baseline contract
- pointer and keyboard behavior should lead to the same meaningful outcomes
- focus should move intentionally, not incidentally
- interactive surfaces should expose predictable activation semantics
- escape, enter, space, arrow, and backspace behavior should not conflict across nested surfaces

### What this means in practice

- if a user can click a row, they should usually be able to focus and activate it from the keyboard
- if a flow starts with an input, there should be a predictable path from input into result rows and back again
- if a popup has a clear primary action, Enter behavior should remain consistent with the shared popup contract
- if a step has a meaningful back-navigation shortcut, it must not interfere with text editing behavior
- if focus returns to a previous step or control, it should return intentionally to a useful target

---

## 8.6 Focus-management guardrails

Focus movement must be designed explicitly whenever UI state changes.

Typical state changes that require focus consideration:

- opening a popup
- moving between steps in a flow
- returning from a deeper step to a previous step
- changing from input mode to result-list mode
- closing a popup or nested popup
- displaying inline recovery actions after an error

### Guardrails

- every popup and flow step should have an intentional initial focus target
- when moving forward in a flow, focus should land where the next action naturally starts
- when moving backward, focus should return to the control or input that lets the user continue immediately
- when list rows take focus from an input, there should be a predictable way back to the input
- focus restoration should be treated as part of flow correctness, not a convenience detail

Avoid relying on browser-default focus behavior when the UI is dynamically changing.

---

## 8.7 Activation semantics guardrails

Interactive components should preserve consistent activation rules.

### Guardrails

- Enter and Space should activate interactive rows and controls only where the shared pattern expects them to
- nested trailing controls inside rows must not accidentally trigger parent row activation
- passive containers must not pretend to be interactive
- button-like surfaces should expose button-like behavior consistently
- feature-local key handlers should not override shared activation rules without a strong system-level reason

This is especially important for shared row and list patterns because users should not have to relearn activation behavior between screens.

---

## 8.8 Escape, Backspace, and arrow-key guardrails

Several important surfaces rely on non-trivial keyboard behavior.

These keys must be treated as shared interaction territory:

- `Escape`
- `Backspace`
- `ArrowUp`
- `ArrowDown`
- `ArrowLeft`
- `ArrowRight`
- `Home`
- `End`

### Guardrails

- Escape should not be repurposed casually inside popups because it participates in popup dismissal and list-return behavior
- Backspace shortcuts must never interfere with normal text editing expectations
- arrow keys should preserve shared navigation models in tabs and keyboard lists
- Home and End behavior in tab systems should remain aligned with the shared tabs contract
- any feature-local keyboard shortcut must be checked against popup, input, list, and tab behavior before being introduced

If a new shortcut competes with an existing shared interaction model, the shortcut is the thing that should be reconsidered first.

---

## 8.9 Interaction recovery guardrails

Error and recovery states must remain keyboard-usable too.

### Guardrails

- if an inline recovery action is offered, it must remain reachable and operable from the keyboard
- recovery UI should appear in a place the user can reach without losing their working context
- focus should not get stranded on removed or disabled elements after validation or async state changes
- users should be able to repair a flow in place rather than being forced into pointer-only detours

This matters most in transactional flows like send, trust, gateway, and other multi-step popup work.

---

## 8.10 Review/edit-loop guardrails

Review steps often link back to earlier decisions.

Those edit loops are part of the interaction architecture.

### Guardrails

- editable summary rows should behave consistently as keyboard-reachable edit entry points
- moving from review back to an earlier step should restore a usable focus target in that earlier step
- returning forward again should preserve the user’s sense of position in the flow
- do not create review screens that are easy to scan visually but frustrating to operate from the keyboard

---

## 9. The send flow as the architectural reference implementation

The send flow remains the best reference for how the current system is composed.

Primary reference files:

- `src/lib/areas/wallet/flows/send/1_To.svelte`
- `src/lib/areas/wallet/flows/send/3_Amount.svelte`
- `src/lib/areas/wallet/flows/send/4_Send.svelte`

Supporting shared references:

- `src/lib/shared/ui/flow/FlowStepScaffold.svelte`
- `src/lib/shared/ui/shell/PopupHost.svelte`
- `src/lib/shared/ui/primitives/RowFrame.svelte`

### Why this flow matters

It demonstrates:

- popup-first composition
- search-first selection
- step-to-step transition logic
- editable summary rows
- inline recovery
- review/edit loops
- final confirmation behavior
- keyboard-specific interaction choices

If you are designing a new serious user flow, study send first.

---

## 10. How to build new things without damaging the architecture

## 10.1 New component

Before creating a new component, determine whether it is:

- a shared primitive
- an app wrapper/shared component
- a feature component

### Guardrails

- do not create a shared-looking component inside a feature unless it is truly feature-only
- do not create app-local clones of package primitives
- if the component exposes a reusable interaction model, consider whether it belongs in a package or wrapper

## 10.1.1 Experimentation guardrail for proven components

When a change is exploratory or may alter a proven component substantially, protect the existing component first.

This applies especially when the change would significantly alter:

- layout
- interaction shape
- review/edit ergonomics
- keyboard behavior
- focus flow
- public composition surface

### Guardrails

- prefer creating a parallel experimental component instead of rewriting a known-good component in place
- use the experimental component to explore the new direction until the behavior and structure are stable
- replace the old component only once the new component has proven itself and is likely to survive
- avoid mixing high-risk experiments directly into established shared components unless the user explicitly wants that tradeoff

### Agent instruction

If the requested change sounds like a significant redesign or experiment, ask the user whether they want:

1. a parallel experimental component first, or
2. direct modification of the proven component

Default to recommending the parallel experimental component approach when the existing component is already trusted and widely reused.

## 10.2 New shared library/package

Create or extend a package when the problem is truly reusable and interaction-centric.

### Guardrails

- keep package APIs generic
- avoid Circles-domain naming in generic primitives
- add proof tests for behavior contracts
- do not extract prematurely just because two screens look similar

## 10.3 New app wrapper

Create or extend an app wrapper when multiple features need the same app-level policy or integration.

### Guardrails

- wrappers should reduce duplication across features
- wrappers should encode product-level defaults cleanly
- wrappers should not become opaque dumping grounds for unrelated behavior

## 10.4 New feature flow

When building a new feature flow:

- start from popup and flow-step patterns if the task is multi-step
- use rows for compact selections/review/edit loops where appropriate
- keep recovery actions in context
- rely on existing keyboard/focus conventions

### Guardrails

- do not eject users to unrelated routes if in-flow recovery fits
- do not bypass shared step scaffolding for complex flows without strong reason
- keep the feature domain logic in the feature, but the interaction model in the shared layers

---

## 11. Testing strategy as an architecture guardrail

Tests show where the architecture’s stable contracts live.

Important anchor tests include:

- `tests/ui-tabs.package.test.ts`
- `tests/ui-popup-host.package.test.ts`
- `tests/ui-row.package.test.ts`
- `tests/ui-keyboard-list.package.test.ts`
- `tests/ui-flow-step.package.test.ts`
- `tests/ui-list-data.package.test.ts`
- `tests/send-flow-route-sync.test.ts`
- `tests/popup.history-sync.test.ts`

### What these tests mean architecturally

They indicate that:

- interaction behavior is increasingly stabilized at package or wrapper level
- features are expected to compose those contracts rather than replace them

### Guardrails

- when adding reusable behavior, prefer contract-level tests first
- add feature-level tests when domain composition adds product-specific behavior
- if a change breaks a package/wrapper proof test, treat that as an architectural change, not a casual refactor

---

## 12. Anti-patterns to avoid

Avoid these unless there is a deliberate, reviewed reason.

- rebuilding tabs locally instead of using `@garden-ui/tabs`
- creating feature-local modal/popup behavior that bypasses `PopupHost`
- duplicating row semantics instead of using `RowFrame`
- embedding generic keyboard list logic inside one feature component
- inventing a new multi-step surface instead of using the shared flow-step path
- scattering app-wide policies across many features instead of centralizing them in wrappers
- extracting domain-specific feature logic into generic packages prematurely
- changing keyboard/focus behavior locally without understanding shared contracts
- shipping interactive UI that is only truly usable with a pointer
- adding shortcuts that conflict with popup, input, tab, or list behavior
- failing to restore useful focus after step transitions, popup transitions, or inline recovery states

---

## 13. Recommended files to study before major UI work

### Shared architecture

- `src/lib/shared/ui/shell/PageScaffold.svelte`
- `src/lib/shared/ui/shell/PopupHost.svelte`
- `src/lib/shared/ui/primitives/RowFrame.svelte`
- `src/lib/shared/ui/flow/FlowStepScaffold.svelte`

### Feature reference

- `src/lib/areas/wallet/flows/send/1_To.svelte`
- `src/lib/areas/wallet/flows/send/3_Amount.svelte`
- `src/lib/areas/wallet/flows/send/4_Send.svelte`
- `src/lib/areas/contacts/ui/pages/SearchAvatar.svelte`
- `src/routes/settings/+layout.svelte`

### Behavior proof

- `tests/ui-tabs.package.test.ts`
- `tests/ui-popup-host.package.test.ts`
- `tests/ui-row.package.test.ts`
- `tests/ui-keyboard-list.package.test.ts`
- `tests/ui-flow-step.package.test.ts`
- `tests/ui-list-data.package.test.ts`

---

## 14. Bottom line

The Circles UI architecture should be protected by these rules:

- solve generic interaction problems in package primitives
- solve app-wide product integration in app wrappers
- solve domain-specific composition in feature code
- reuse the shared popup, row, list, tab, page-shell, and flow-step systems by default
- treat keyboard, focus, dismissal, and default-action behavior as system contracts
- use tests to protect the shared boundaries

If you are unsure where new UI work belongs, the safest default is:

> **reuse the highest existing shared layer that matches the problem, and only create a new layer when the current ones cannot responsibly own the behavior.**
