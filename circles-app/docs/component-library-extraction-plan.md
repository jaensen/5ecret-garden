# Component Library Extraction Plan

**Goal:** build a new package-based component library, without modifying the current app UI, that preserves the important interaction quality of the current system — especially keyboard navigation, focus behavior, popup behavior, and default actions — and proves this by re-creating and testing a send-flow mockup.

**Non-goal:** preserving current styling one-to-one. The new library should ship with basic usable default styles and strong customization points.

---

## 1. Executive decision

The safest way to make this land is **not** to extract existing app components in place.

Instead, we should:

1. build a **new UI library in parallel** inside the monorepo,
2. define **formal interaction contracts first**,
3. implement foundational packages before visual packages,
4. create a **send-flow mockup app surface** using only the new packages,
5. prove parity with a focused keyboard/focus/behavior test suite,
6. only then consider real app adoption.

This avoids regressions in production code while giving us a clean, stable library design.

---

## 2. Success criteria

The extraction effort counts as successful only if all of the following are true:

### 2.1 Library architecture success

- The new library exists as workspace packages under `packages/`.
- Each package has a **single clear responsibility**.
- Package dependencies are acyclic and minimal.
- No package depends on app-specific domain logic, routes, or stores.

### 2.2 Interaction-quality success

- Keyboard navigation matches or improves on the audited app patterns.
- Focus trap, focus restoration, initial focus selection, and row/input handoff all work predictably.
- Default actions on `Enter` work consistently and intentionally.
- Popup Backspace/Escape behavior is safe and test-covered.

### 2.3 Styling/customization success

- Components have usable default styles.
- Styles are easily overridden without forking behavior code.
- Consumers can theme via class props, CSS variables, slot structure, and/or render hooks.

### 2.4 Proof-of-landing success

- A mock send flow is recreated using only the new library packages plus mock data/state.
- The mockup supports the important behaviors from the current send flow.
- The mockup has automated tests proving the features landed.

### 2.5 Stabilization success

- Shared behavior packages have unit tests.
- Component packages have contract tests.
- The send-flow mockup has integration tests.
- Accessibility semantics are asserted in key places.

---

## 3. Constraints and principles

## 3.1 Hard constraints

- Do **not** refactor or replace the current app UI during library creation.
- Treat the app as a **reference implementation**, not the extraction target.
- New library packages must remain free of Circles-specific domain state.

## 3.2 Design principles

1. **Behavior first, visuals second**
2. **Contracts first, implementation second**
3. **Small packages, but not absurdly tiny packages**
4. **Headless or style-light by default**
5. **Test the interaction contracts directly**
6. **Mock the send flow before app adoption**

---

## 4. Target package architecture

The right granularity is **one package per meaningful component family**, including its direct helpers and subcomponents.

## 4.1 Foundational packages

### `packages/ui-focus`

**Responsibility**

- focus helpers
- focusable-element discovery helpers
- initial-focus policy helpers
- focus restoration helpers

**Owns**

- `focusElement`
- `shouldAutoFocusTextInput`
- generic focusable selector helpers
- maybe focus scope utilities

**Must not own**

- popup runtime
- tabs logic
- app-specific selectors

---

### `packages/ui-keyboard-list`

**Responsibility**

- input-to-list handoff
- row keyboard navigation
- row activation rules
- focus return to search input

**Owns**

- `createKeyboardListNavigator`
- `createListInputArrowDownHandler`
- optional shared row contracts/types

**Must not own**

- visual list container
- domain row implementations

---

### `packages/ui-popup-runtime`

**Responsibility**

- popup stack state
- popup open/back/replace/close semantics
- history sync
- dirty-state propagation model
- popup content type definitions

**Owns**

- popup state store/runtime
- stack semantics
- history sync logic
- dismiss policy resolution

**Must not own**

- concrete popup shell UI
- app-specific confirm dialog content

---

## 4.2 Primitive component packages

### `packages/ui-tabs`

**Responsibility**

- tablist/tab/tabpanel system
- roving tabindex
- keyboard navigation
- controlled/uncontrolled selection

**Owns**

- `Tabs.svelte`
- `Tab.svelte`
- tabs context
- stable semantic contracts

**Customization**

- variant props
- slot-based labels/panels if needed
- class hooks / CSS vars

---

### `packages/ui-popup`

**Responsibility**

- popup host shell
- focus trap
- focus restoration integration
- default-action on Enter
- safe Escape/Backspace handling
- top-page activation focus behavior

**Depends on**

- `ui-focus`
- `ui-popup-runtime`

**Must not own**

- domain confirm steps
- business copy

---

### `packages/ui-list-shell`

**Responsibility**

- search toolbar
- state wrapper (loading, empty, error)
- container semantics

**Depends on**

- maybe `ui-focus`
- maybe `ui-keyboard-list`

**Must not own**

- domain search behavior
- row content implementations

---

### `packages/ui-virtual-list`

**Responsibility**

- virtual/paginated list rendering
- placeholder strategy
- overscan/loading behavior

**Must not own**

- keyboard policy
- row semantics beyond API requirements

---

## 4.3 Flow and step packages

### `packages/ui-flow-step`

**Responsibility**

- step scaffold
- step header
- progress labels
- action bar
- review row
- section wrapper
- alert patterns

**Depends on**

- maybe `ui-focus`

**Must not own**

- popup runtime
- send-specific flow logic

---

## 4.4 Demo/mock package or app surface

### `packages/ui-flow-send-mock` or `circles-app/src/routes/kitchen-sink/library-send-mock`

**Responsibility**

- re-create the send-flow UX using only new packages and mock state/data

This is not meant to be reusable product code; it is the **proof harness**.

---

## 5. Dependency rules that prevent failure

To make this land, package dependencies must be controlled strictly.

## 5.1 Allowed dependency direction

Allowed:

- `ui-focus` → nothing UI-specific
- `ui-keyboard-list` → `ui-focus` optional
- `ui-popup-runtime` → no visual package
- `ui-tabs` → `ui-focus` optional only if truly needed
- `ui-popup` → `ui-popup-runtime`, `ui-focus`
- `ui-list-shell` → `ui-keyboard-list`, `ui-focus`
- `ui-flow-step` → `ui-focus` only if needed
- mock send flow → all of the above

## 5.2 Forbidden dependency direction

Forbidden:

- foundational packages depending on visual packages
- any library package depending on `circles-app/src/lib/shared/state/*`
- any library package depending on SvelteKit routing APIs
- `ui-popup-runtime` depending on `ui-popup`
- list packages depending on tabs package directly, except via semantic DOM contracts

## 5.3 Why this matters

This is the difference between a real library and a disguised app extraction. If the dependency graph is clean, the library can stabilize independently.

---

## 6. Interaction contracts that must be formalized

The current app relies on implicit conventions. The new library must turn them into explicit contracts.

## 6.1 Popup contract

### Required behaviors

- Focus is trapped within popup while open.
- Focus is restored to trigger/source when popup closes.
- Initial focus follows explicit priority rules.
- `Escape` obeys dismiss mode.
- `Backspace` never breaks text editing.
- `Enter` can trigger a default action intentionally.
- Only the top popup page is active.

### Required public concepts

- popup content definition type
- dismiss policy enum/type
- dirty-state flag or interface
- explicit default-action marker
- explicit initial-input and initial-focus markers

## 6.2 Tabs contract

### Required behaviors

- roving tabindex
- ArrowLeft/ArrowRight navigation
- Home/End support
- optional focus above/below integration
- disabled tabs skipped in traversal
- semantic tab-to-panel linkage

### Required public concepts

- `selected`
- `defaultValue`
- `onChange`
- `disabled`
- stable IDs or ID generation strategy

## 6.3 List keyboard contract

### Required behaviors

- `ArrowDown` from input enters first row
- `ArrowUp` from first row returns to input
- `Escape` on row returns focus to input and prevents accidental outer-close
- `Enter` / `Space` activate row unless nested control owns event
- row click focuses row

### Required public concepts

- row selector / row contract
- input scope contract
- activation callback
- nested interactive exemption

## 6.4 Default action on Enter contract

This must be especially explicit because it is easy to regress.

### Rules

1. Never override Enter in editable fields.
2. Never override Enter on naturally interactive elements already expected to react.
3. Only invoke default action when focus is inside current active popup/page scope.
4. Default action discovery order must be documented.
5. Consumers must be able to opt out.

### API recommendation

- `data-ui-default-action`
- optional `defaultActionSelector` prop on popup shell
- optional `enableEnterDefaultAction` boolean

## 6.5 Focus markers contract

Use a **single canonical attribute family** from the start.

Recommended:

- `data-ui-initial-input`
- `data-ui-initial-focus`

Avoid carryover of send-specific or legacy markers.

---

## 7. Styling and customization strategy

You said style matters less right now, but components should still be usable and customizable. The best way to do that is **style-light, semantic defaults + explicit extension points**.

## 7.1 Recommendation: basic default styles, not headless-only

Pure headless is flexible but slows adoption and makes demos harder.

Recommended approach:

- ship **basic default styles**,
- keep visuals intentionally minimal,
- expose customization hooks aggressively.

This gives immediate usability while keeping long-term flexibility.

## 7.2 Customization mechanisms

Use all four of these:

### A. Class props

Examples:

- `class`
- `panelClass`
- `tabClass`
- `toolbarClass`
- `overlayClass`

### B. CSS variables

Examples:

- radius
- spacing
- border color
- focus ring color
- backdrop color
- panel width/height

### C. Slots / snippets

Examples:

- custom tab label content
- custom toolbar actions
- custom empty state / error state
- custom popup header/footer actions

### D. Behavioral props distinct from styling props

Examples:

- `trapFocus`
- `closeOnEscape`
- `closeOnBackdrop`
- `enableEnterDefaultAction`
- `restoreFocusOnClose`

This prevents visual customization from accidentally altering behavior.

## 7.3 Default style philosophy

The library should visually read as:

- obvious buttons,
- obvious selected tabs,
- obvious focus rings,
- obvious popup shell,
- obvious list states.

Nothing more is needed initially.

## 7.4 Accessibility styling requirements

Even with minimal styling, the library must include:

- visible focus state
- disabled state differentiation
- selected state differentiation
- warning/error contrast
- non-color-only signaling where relevant

---

## 8. Delivery plan that will actually land

This is the most important section.

## Phase 0 — Define contracts before code

### Deliverables

- package inventory document
- dependency graph
- keyboard/focus contracts document
- API naming conventions document

### Why

Without this phase, the library will drift into ad hoc package decisions.

### Exit criteria

- all foundational package responsibilities approved
- canonical attribute names approved
- default-action rules approved

---

## Phase 1 — Build the foundational behavior packages

### Packages

- `ui-focus`
- `ui-keyboard-list`
- `ui-popup-runtime`

### Deliverables

- tested utilities
- public types
- README for each package

### Must-have tests

- focus utility behavior
- row navigation behavior
- input handoff behavior
- popup depth/history behavior
- dismiss policy behavior

### Exit criteria

- no visual package exists yet that duplicates these behaviors internally
- all higher-level packages are forced to consume these foundations

---

## Phase 2 — Build primitive visual packages

### Packages

- `ui-tabs`
- `ui-popup`
- `ui-list-shell`
- `ui-virtual-list`

### Deliverables

- components with basic default styles
- documented customization API
- Story/demo usage examples

### Must-have tests

- tabs keyboard tests
- popup focus trap and Enter-default tests
- list shell integration with keyboard-list package
- virtual list basic rendering and pagination tests

### Exit criteria

- packages work without app code
- package tests prove behavioral contracts

---

## Phase 3 — Build flow-step packages

### Packages

- `ui-flow-step`

### Deliverables

- step scaffold
- step header
- alert
- action bar
- review row
- section wrapper

### Must-have tests

- initial-focus fallback behavior in scaffold
- progress/header semantics
- action bar loading/disabled/default action compatibility
- review row interaction behavior

### Exit criteria

- enough primitives exist to build the send-flow mockup cleanly

---

## Phase 4 — Re-create the send-flow mockup

### Scope

Build a mock send flow using only:

- new popup package
- new tabs/list/focus packages where relevant
- new flow-step package
- mock data and mock route/pathfinding state

### Mockup should include

1. **Recipient step**
   - search input
   - list of recipients
   - ArrowDown handoff
   - Enter single-result select

2. **Amount step**
   - selected recipient summary row
   - amount input
   - `Enter` to continue
   - Backspace-at-empty return behavior
   - warnings/errors
   - advanced options disclosure

3. **Review step**
   - change recipient
   - change route/asset
   - change amount
   - final send action

4. **Popup stack behaviors**
   - back
   - close
   - focus restoration
   - default action behavior

### What does not need to be real yet

- actual Circles SDK pathfinding
- actual blockchain transaction submission
- actual app styling

### Exit criteria

- mockup demonstrates all critical interactions end-to-end

---

## Phase 5 — Stabilization and proof

This is where most extractions fail if skipped.

### Deliverables

- package contract test suite
- mock send-flow integration suite
- accessibility smoke suite
- stabilization notes / known edge cases

### Required test categories

#### Unit tests

- focus helpers
- keyboard-list utilities
- popup runtime/history

#### Component contract tests

- tabs
- popup host
- list shell
- flow scaffold

#### Integration tests

- send-flow mock happy path
- send-flow invalid states
- send-flow return/edit loops
- popup close/back behavior

#### Accessibility tests

- dialog semantics
- tab semantics
- focus visibility
- keyboard-only completion path

### Exit criteria

- all critical interaction paths are test-covered
- no high-severity keyboard/focus regressions remain

---

## 9. Detailed keyboard/focus review checklist

This checklist must be used during implementation review.

## 9.1 Popup review checklist

- [ ] Popup traps focus correctly.
- [ ] Popup restores focus on close.
- [ ] Initial input is preferred only in desktop-like contexts.
- [ ] Non-input initial focus works on small/touch contexts.
- [ ] `Escape` obeys dismiss mode.
- [ ] `Backspace` never hijacks text editing.
- [ ] `Backspace` never closes the last popup unintentionally.
- [ ] `Enter` default action fires only when safe.
- [ ] Only active popup page is interactive.

## 9.2 Tabs review checklist

- [ ] Only active tab is tabbable.
- [ ] Arrow keys navigate enabled tabs only.
- [ ] Home/End work.
- [ ] Selected tab/panel linkage is correct.
- [ ] Overflow behavior does not break keyboard use.

## 9.3 List review checklist

- [ ] Input ArrowDown enters list.
- [ ] First row ArrowUp returns to input.
- [ ] Row Escape returns to input.
- [ ] Nested controls keep native Enter/Space behavior.
- [ ] Row click moves focus to row.

## 9.4 Flow-step review checklist

- [ ] Each step has an explicit initial focus target or scaffold fallback.
- [ ] CTA default action behavior is intentional.
- [ ] Error/warning states are local and visible.
- [ ] Progressive disclosure is keyboard reachable.
- [ ] Review “Change” actions return to exact intended step.

---

## 10. Send-flow mockup test plan

This is the proof that the library really preserves the UX quality.

## 10.1 Recipient step tests

- opens with search input focused on desktop-like context
- ArrowDown focuses first result row
- Enter on input auto-selects single result
- Enter/Space on row activates row
- Escape from row returns focus to input

## 10.2 Amount step tests

- opens with intended initial target
- Enter on amount input continues only when valid
- invalid amount blocks continue
- Backspace at empty input returns to recipient step
- recipient input regains focus after return
- warning state for route unavailable shows recovery actions
- advanced options toggle exposes extra controls

## 10.3 Review step tests

- change recipient returns to recipient step
- change amount returns to amount step
- context is preserved through edit-return loop
- final submit button can be Enter-default action when safe

## 10.4 Popup-shell integration tests

- Tab loops inside flow popup
- Escape closes according to policy
- Backspace goes back one step when not editing text
- closing final popup restores focus to trigger

## 10.5 Accessibility tests

- popup has accessible name
- tabs have proper roles
- buttons and rows have accessible labels
- focusable path exists through entire flow without mouse

---

## 11. Stabilization strategy: how to guarantee no regressions

Since we are not replacing the app immediately, “no regressions” means two things:

1. **No regressions in current production app** because it is untouched.
2. **No regressions inside the new library** because we stabilize behavior before adoption.

## 11.1 Practical strategy

### A. Freeze contracts before implementation churn

Do not let API names and behaviors drift mid-build.

### B. Test the behavior packages directly

This catches regressions before they surface in visuals.

### C. Use the send-flow mockup as the integration oracle

If the mockup keeps working, the library remains coherent.

### D. Delay real app adoption until mockup passes fully

Do not partially swap library components into production screens too early.

### E. Introduce adoption only behind explicit checkpoints

Suggested checkpoints:

- Foundation complete
- Primitive complete
- Send mockup complete
- Stabilization complete
- Adoption-ready review complete

---

## 12. Recommended implementation order

If the objective is “this will definitely land,” the order should be:

1. **Write package contracts and naming conventions**
2. **Build `ui-focus`**
3. **Build `ui-keyboard-list`**
4. **Build `ui-popup-runtime`**
5. **Build `ui-tabs`**
6. **Build `ui-popup`**
7. **Build `ui-list-shell` + `ui-virtual-list`**
8. **Build `ui-flow-step`**
9. **Build send-flow mockup**
10. **Run stabilization suite and close gaps**
11. **Only then discuss app adoption**

This order minimizes circular design mistakes.

---

## 13. Recommended deliverables by milestone

## Milestone A — Architecture ready

- extraction contracts doc
- package dependency map
- package scaffolds created

## Milestone B — Foundations ready

- focus package shipped
- keyboard-list package shipped
- popup-runtime package shipped

## Milestone C — Primitives ready

- tabs package shipped
- popup package shipped
- list packages shipped

## Milestone D — Flow-ready UI shipped

- flow-step package shipped
- minimal default theme shipped

## Milestone E — Proof harness shipped

- send-flow mockup working
- all contract tests green

## Milestone F — Adoption-ready

- stabilization report
- known issues list empty or accepted
- adoption guide written

---

## 14. Recommended documentation per package

Each package should include:

1. **Purpose**
2. **Public API**
3. **Keyboard/focus guarantees**
4. **Customization API**
5. **Accessibility semantics**
6. **Examples**
7. **Non-goals**

This is especially important for packages like popup and tabs, where behavior matters more than visuals.

---

## 15. Final recommendation

Yes — this is absolutely achievable, and the best way to ensure it lands is:

- build a **new library in parallel**,
- structure it around **behavioral foundations first**,
- keep **default styles minimal but real**,
- expose **strong customization hooks**,
- and use a **send-flow mockup with automated tests** as the proof that all critical keyboard and focus behavior survived the extraction.

If we follow this exact order, the project stays low-risk, the current app stays stable, and the new library earns trust before any adoption work begins.

---

## 16. Immediate next step

The very next implementation step should be:

1. scaffold the new package set under `packages/`,
2. write the package contracts/READMEs,
3. implement `ui-focus`, `ui-keyboard-list`, and `ui-popup-runtime` first,
4. add tests immediately with each foundational package.

That is the shortest path to a library effort that actually lands.
