# UI/UX Patterns Audit for Automated Testing

**Application:** `circles-app`  
**Audit scope:** tabs, lists, popups/dialogs, menus, route-wrapped popups, and the send flow  
**Purpose:** provide an authoritative, implementation-grounded reference for automated test design, especially keyboard usability and interaction contracts.

---

## 1. Executive summary

The app already implements a fairly coherent keyboard-usable interaction system built around a few shared primitives:

- **Popup runtime + host** for modal flows and inspect/detail popups
- **Tabs primitive** with roving tabindex and arrow-key navigation
- **List/search keyboard helpers** for input-to-list handoff and row navigation
- **Flow scaffolding** for multi-step popups, with explicit focus markers
- **Popup history synchronization** that maps popup depth to browser history

The **send flow** is the strongest production example because it combines:

- explicit step structure,
- popup focus behavior,
- search/list keyboard navigation,
- targeted review/edit loops,
- validation and async states,
- advanced disclosure,
- and route/routing-dependent error recovery.

For automated tests, the most important fact is that many behaviors are **intentional shared contracts**, not incidental DOM behavior.

---

## 2. Audited implementation sources

This document is based on the current implementation in these files:

### Shared primitives and runtime

- `src/lib/shared/ui/primitives/tabs/Tabs.svelte`
- `src/lib/shared/ui/primitives/tabs/Tab.svelte`
- `src/lib/shared/ui/shell/PopupHost.svelte`
- `src/lib/shared/state/popup/index.ts`
- `src/lib/shared/ui/lists/utils/keyboardListNavigator.ts`
- `src/lib/shared/ui/focus/focusPolicy.ts`
- `src/lib/shared/ui/flow/FlowStepScaffold.svelte`

### Send flow and related UI

- `src/lib/areas/wallet/flows/send/1_To.svelte`
- `src/lib/areas/wallet/flows/send/2_Asset.svelte`
- `src/lib/areas/wallet/flows/send/3_Amount.svelte`
- `src/lib/areas/wallet/flows/send/4_Send.svelte`
- `src/lib/areas/contacts/ui/pages/SearchAvatar.svelte`
- `src/lib/shared/ui/avatar-search/AvatarSearchList.svelte`
- `src/lib/areas/wallet/ui/pages/SelectAmount.svelte`
- `src/lib/areas/wallet/ui/pages/Send.svelte`

### Representative route-level surfaces

- `src/routes/DefaultHeader.svelte`
- `src/routes/settings/+layout.svelte`
- `src/routes/sales/orders/[orderId]/+page.svelte`

### Existing test and UX specification anchors

- `tests/popup.history-sync.test.ts`
- `tests/send-flow-route-sync.test.ts`
- `docs/multi-step-flows-send-gold-standard-blueprint.md`

---

## 3. Core architecture patterns

### 3.1 Popup-first interaction architecture

Many complex tasks are implemented as **bottom-sheet style popups** rather than full page transitions.

Observed characteristics:

- Popup shell covers the viewport with backdrop + sheet.
- Popup content is rendered in a shared host (`PopupHost.svelte`).
- Popups can be stacked; only the **top page** is visible and interactive.
- Previous popup pages remain mounted but become `inert` and `aria-hidden`.
- Browser history is synchronized to popup depth.

**Testing implication:** modal flows must be tested as stateful stacks, not as isolated single dialogs.

### 3.2 Step-flow architecture

Production flows use shared flow runtime concepts:

- `openStep(...)` for forward transitions within a popup flow
- `popupControls.back()` for stack back navigation
- `popTo(...)` / `popToOrOpen(...)` for deterministic review-edit return paths
- `openFlowPopup(...)` as the top-level flow entry point

**Testing implication:** “Back” and “Change” actions are not generic navigation; they are specific stack operations with predictable targets.

### 3.3 Page-scoped tabs + section panels

Settings and other areas use a reusable tabs primitive with proper tab semantics:

- `role="tablist"`
- `role="tab"`
- `role="tabpanel"`
- roving tabindex
- arrow-key navigation
- optional URL-backed selected tab state

**Testing implication:** tab behavior should be asserted at both DOM semantics level and app state level.

### 3.4 Search/list selection architecture

Search-heavy flows use a repeatable pattern:

1. search input
2. arrow-key handoff to results
3. focusable rows
4. Enter/Space activation
5. Escape return to input

**Testing implication:** keyboard tests should verify full handoff loops, not just row clicks.

---

## 4. Keyboard usability patterns

## 4.1 Global shortcuts

### Ctrl/Cmd+K opens search

Implemented in `src/routes/DefaultHeader.svelte`.

Behavior:

- `Ctrl+K` / `Cmd+K` opens the global search popup.
- Shortcut is ignored if:
  - a popup is already open,
  - focus is inside typing/editing context (`input`, `textarea`, `select`, contenteditable, ARIA textbox).

**Tests to write**

- Opens search when no popup is active.
- Does not open while typing in an input.
- Does not open on top of an existing popup.

## 4.2 Popup keyboard contract

Implemented in `PopupHost.svelte`.

### Tab / Shift+Tab trap focus inside popup

- `Tab` cycles to first focusable when on last focusable.
- `Shift+Tab` cycles to last focusable when on first focusable.
- Focus is prevented from escaping the dialog.

### Escape dismisses according to popup dismiss policy

- `Escape` triggers close behavior through `attemptClose('escape')`.
- Actual result depends on popup `dismiss` mode and dirty-state rules.

### Enter triggers popup default action only as fallback

- Only applies when focus is in the top popup page.
- Ignored for editable targets.
- Ignored for already interactive activation targets.
- If focus is on a non-interactive element, popup looks for default action in this order:
  1. `[data-popup-default-action]`
  2. `.btn-primary`
  3. `button[type="submit"]`
  4. `input[type="submit"]`

### Backspace pops popup stack, but only in safe cases

- Ignored in editable targets.
- Ignored with modifier keys.
- If popup stack depth > 1, Backspace triggers `popupControls.back()`.
- If only one popup page remains, Backspace does **not** close it.

**Tests to write**

- Tab loop stays within popup.
- Escape closes inspect popup.
- Escape on explicit/dirty flow opens confirm step when appropriate.
- Backspace on non-input top step goes back one popup page.
- Backspace inside text input does not navigate.
- Enter on non-interactive focused wrapper clicks primary/default CTA.

## 4.3 Menu keyboard behavior

Observed in `DefaultHeader.svelte` using a native `<details>` dropdown.

Behavior:

- `Escape` closes the menu.
- When closed by Escape, focus is restored to the menu trigger (`summary`).
- Menu also closes on outside click and route changes.

**Tests to write**

- Escape closes menu and restores trigger focus.
- Route changes collapse menu.
- Outside click collapses menu.

## 4.4 Tabs keyboard behavior

Implemented in `Tabs.svelte`.

### Supported keys

- `ArrowRight`: next enabled tab
- `ArrowLeft`: previous enabled tab
- `Home`: first enabled tab
- `End`: last enabled tab
- `ArrowDown`: move focus into first focusable item below tabs
- `ArrowUp`: move focus to last focusable item above tabs

### Roving tabindex

- Active tab gets `tabindex=0`
- Inactive tabs get `tabindex=-1`

### Disabled tabs

- Excluded from keyboard traversal
- Button is disabled

### Overflowed tab rows

- Tabs can scroll horizontally.
- Active tab is centered into view automatically.
- Scroll nudge buttons exist visually but are removed from normal keyboard order (`tabindex=-1`).

**Tests to write**

- Arrow navigation skips disabled tabs.
- Home/End land on first/last enabled tab.
- Only active tab is tabbable.
- `aria-selected`, `aria-controls`, and tabpanel linkage stay consistent.
- URL-backed tabs (e.g. settings) reflect selected tab correctly.

## 4.5 Search input to list handoff

Implemented through `createListInputArrowDownHandler(...)` and `createKeyboardListNavigator(...)`.

Behavior:

- `ArrowDown` in search input focuses first row.
- `ArrowUp` in search input attempts to focus active tab above when present.

**Tests to write**

- `ArrowDown` from search lands on first visible row.
- `ArrowUp` from list search can return to parent tab region where applicable.

## 4.6 List row keyboard behavior

Implemented in `keyboardListNavigator.ts` and adopted by multiple row components.

Behavior:

- `ArrowDown` / `ArrowUp`: move row-to-row.
- `ArrowUp` on first row: return focus to search input.
- `ArrowLeft`: jump to first row.
- `Escape`: return focus to input and stop propagation.
- `Enter` / `Space`: activate row only when event target is the row itself.
- Row click also focuses the row for keyboard continuity.

This pattern appears in contacts, groups, transactions, demo lists, and avatar search variants.

**Tests to write**

- Arrow navigation preserves linear row focus.
- Escape on focused row returns to input and does not close parent popup.
- Nested interactive controls keep native Enter/Space behavior.

## 4.7 Send flow specific keyboard behavior

### Recipient step

- Search input is the preferred initial input.
- In send mode, Enter in search auto-selects when exactly one result exists.

### Amount step

- Enter on `[data-send-amount-input]` continues when `canContinue` is true.
- Backspace at empty amount input triggers edit-recipient return path.
- Return path re-focuses recipient input and places caret at end.

### Review step

- Submit button is focusable and marked as step initial focus in review page content.

**Tests to write**

- Single-result Enter quick-select chooses recipient.
- Backspace-at-empty on amount returns to recipient step.
- Recipient input regains focus with caret at string end.
- Enter on amount input does not continue when invalid.

---

## 5. Focus management patterns

## 5.1 Popup open/close focus lifecycle

Implemented in `PopupHost.svelte`.

Behavior:

- On popup open, the previously focused element is remembered.
- On popup close, focus is restored to that element.

**Tests to write**

- Opening popup from button restores focus to same button after close.

## 5.2 Initial focus target hierarchy

Popup top-page activation prefers focus targets in this order:

1. on desktop-like environments, `[data-popup-initial-input]` or `[data-send-step-initial-input]`
2. `[data-popup-initial-focus]` or `[data-send-step-initial-focus]`
3. first focusable in page
4. popup close/back control or title fallback

Desktop-like behavior is determined by `shouldAutoFocusTextInput()`:

- pointer is fine
- hover is available
- viewport width >= 768px

**Testing implication:** initial focus is responsive-context dependent.

**Tests to write**

- Desktop profile focuses text input when marked.
- Touch/small-screen profile prefers non-input focus target.
- Returning to a previously mounted popup page still applies correct focus on activation.

## 5.3 Mounted-but-inactive page model

Popup pages remain mounted while hidden.

Consequences:

- focus behavior depends on **top-page activation**, not component mount.
- `onMount(...focus...)` is not sufficient for back/return behavior.

**Tests to write**

- After navigating deeper and then back, the revealed step receives expected focus again.

## 5.4 Flow scaffold default focus behavior

`FlowStepScaffold.svelte` wraps each step with a focusable container:

- outer scaffold gets `tabindex="-1"`
- outer scaffold gets `data-popup-initial-focus`

This gives every step a safe fallback focus target even if no field is directly focusable.

---

## 6. Layout and composition patterns

## 6.1 Bottom-sheet popup layout

Popup host layout characteristics:

- fixed viewport overlay
- dimmed backdrop
- bottom-anchored sheet
- rounded top corners
- max/min height of 80% of viewport
- internal scroll container

**Testing implication:** long content and stacked content should be tested within the popup scroll container, not window scroll.

## 6.2 Page scaffold + local action bars

Example: settings layout.

Pattern:

- page title/meta/actions in a top scaffold
- tabs as section switcher
- tab panels render large task-specific content beneath

This is a “page shell + section panel” pattern, distinct from popup flows.

## 6.3 RowFrame-based selectable summary rows

The app repeatedly uses summary rows for navigation or review:

- recipient rows
- route rows
- amount rows
- transaction rows
- group/contact rows

Typical behavior:

- entire row is clickable
- row often gets `role="button"` and `tabindex="0"` when not a native button
- trailing chevron or change button indicates next action

**Testing implication:** rows are not just visual cards; they are often first-class keyboard targets.

## 6.4 Progressive disclosure pattern

Example: send amount step “More options”.

Pattern:

- advanced options collapsed by default
- toggle button exposes `aria-expanded`
- advanced controls do not block primary path unless user opts in

**Tests to write**

- Advanced section is collapsed by default.
- Toggle updates `aria-expanded`.
- Revealed controls become reachable in tab order.

---

## 7. Popup and dialog behavior patterns

## 7.1 Popup types and dismiss modes

Popup definitions support:

- `kind`: `flow`, `confirm`, `inspect`, `edit`
- `dismiss`: `backdrop`, `explicit`, `confirmIfDirty`

Default resolution:

- no kind + no dismiss => `backdrop`
- `inspect` => `backdrop`
- `flow` and most structured flows => `explicit`

**Behavioral meaning**

- `backdrop`: backdrop/Escape close is allowed
- `explicit`: user must use explicit close/back behavior; dirty rules may intervene
- `confirmIfDirty`: close can require discard confirmation

## 7.2 Dirty-state protection

Popup host marks flows dirty when input/change events occur on eligible editable elements.

Protection characteristics:

- ignores elements explicitly marked with `data-popup-dirty-ignore="true"`
- ignores non-data input types like submit/reset/file
- can propagate dirty state across all popup pages in same `flowId`
- attempting to close explicit dirty flow opens a confirm step

**Tests to write**

- Editing a field marks current flow dirty.
- Escape/backdrop close on dirty explicit flow opens close-confirm step.
- Choosing “No” returns to current flow.
- Choosing “Yes” closes flow.

## 7.3 Popup stacking and history synchronization

Implemented in `src/lib/shared/state/popup/index.ts`.

Behavior:

- Opening a popup pushes current content onto stack.
- `back()` pops one level.
- `close()` closes all popup levels.
- `replace()` swaps current top content without changing depth.
- Browser history depth mirrors popup depth.

Verified by tests in `tests/popup.history-sync.test.ts`.

**Tests to write**

- Opening two popup steps creates history depth 2.
- Back removes one step only.
- Close removes all popup history depth.
- Replace keeps depth stable.
- Forward into missing runtime popup state produces noop signal rather than broken UI.

## 7.4 Route-wrapped popup pattern

Example: `src/routes/sales/orders/[orderId]/+page.svelte`.

Pattern:

- route mounts
- immediately opens popup
- when popup fully closes, route redirects to parent list

This supports deep linking to detail views while preserving popup UX.

**Tests to write**

- Visiting deep-link route opens popup automatically.
- Closing popup redirects to parent route.
- Wrapper does not render stray visible page content.

---

## 8. Tabs patterns

## 8.1 Semantic tab implementation

Tab structure is accessible and explicit:

- `Tabs.svelte` owns tab registry and selection state
- `Tab.svelte` renders associated tabpanel
- `aria-labelledby` / `aria-controls` link tab and panel
- hidden panels use `hidden` and `aria-hidden`

## 8.2 Controlled and uncontrolled selection

Tabs support:

- controlled selected value (`bind:selected`)
- uncontrolled default value

There is also a guard against “double click” feel when parent-selected state lags temporarily.

**Testing implication:** if URL or parent state controls tabs, clicks should still immediately feel acknowledged.

## 8.3 URL-backed tab deep-linking

Settings reads `?tab=` from URL and coerces invalid values to a default tab.

**Tests to write**

- `/settings?tab=orders` opens Orders tab.
- invalid tab key falls back to Personal/Profile tab.

---

## 9. List and collection patterns

## 9.1 Search-first list shell

Avatar search uses:

- title label
- search field
- result count/status strip
- paginated/virtualized list
- empty states with action buttons when relevant

## 9.2 Preferred ordering / relevance shaping

When query is empty, avatar search prioritizes:

1. VIP bookmarks
2. other bookmarks
3. contacts

When query is non-empty:

- direct-address rows may be synthesized
- remote search activates after a minimum query length
- loading state is shown inline

**Tests to write**

- Empty query defaults to bookmark/contact-first ordering.
- Remote search only starts after configured minimum chars.
- Remote loading indicator appears.

## 9.3 Interactive row semantics

Observed row patterns typically include:

- `role="button"`
- `tabindex="0"`
- descriptive `aria-label`
- visible focus ring classes

Examples include transactions, contacts, groups, and demo rows.

**Tests to write**

- Every focusable non-native row exposes accessible name.
- Focus-visible styles are present when keyboard focused.

---

## 10. Send flow patterns

## 10.1 Overall send flow structure

Observed step chain:

1. **Recipient**
2. **Amount / asset-routing preparation**
3. **Review**

Supporting token filter step can be inserted for route editing.

All steps use `FlowStepScaffold` with standardized header framing.

## 10.2 Recipient step pattern

Characteristics:

- search-select screen using avatar search list
- initial input explicitly marked
- immediate progression after selection
- send-specific Enter quick-select when single result exists

## 10.3 Amount step pattern

Characteristics:

- review row at top for recipient with “Change” affordance
- review row for token filters / route
- amount entry field
- multiple inline warning/error states
- progressive “More options” area
- right-aligned primary CTA

Validation states present:

- zero amount
- route not ready
- route unavailable/pathfinding failed
- amount exceeds route capacity
- async pathfinding error

Recovery affordances present:

- Add trust
- Pick another recipient
- Use max
- Lower amount
- Retry route

**Testing implication:** this step should be covered with stateful validation-matrix tests, not only happy path tests.

## 10.4 Review step pattern

Characteristics:

- concise summary rows for To / Route / Amount
- optional Note display
- targeted edit callbacks
- final commit CTA (`Send Circles`)
- inline warning when required data is missing
- async submit error surface

## 10.5 Async transaction execution pattern

Final send action:

- computes payload
- validates required inputs
- executes transaction via `executeTxConfirmFirst(...)`
- closes popup on success

**Tests to write**

- Submit disabled until recipient + asset + amount are valid.
- Success closes popup.
- Execution errors surface as step error alert.

---

## 11. Accessibility and semantics patterns

## 11.1 Positive patterns already present

- popups use `role="dialog"` and `aria-modal="true"`
- popup titles linked via `aria-labelledby` or `aria-label`
- tabs use correct `tablist` / `tab` / `tabpanel` semantics
- many interactive rows expose role, tabindex, and label
- expandable controls expose `aria-expanded`
- popup stack hides inactive pages with `aria-hidden` and `inert`

## 11.2 Important caveats for testing

- Some clickable summary rows are native `<button>` wrappers rather than role-button divs; tests should respect actual control type.
- Some focus markers still use **send-specific legacy attributes** (`data-send-step-initial-*`) in addition to generic popup attributes.
- The app relies heavily on focus-visible utility classes; visual regression or DOM-class assertions may be valuable.

## 11.3 Accessibility assertions worth standardizing

- Dialog has accessible name.
- Active tab has `aria-selected="true"` and matching panel.
- Hidden panels are not treated as active content.
- Focusable custom rows have accessible labels.
- Warnings/errors do not rely on color alone.

---

## 12. Recommended automated test inventory

## 12.1 High-priority shared-contract tests

1. **Popup focus trap**
2. **Popup focus restoration on close**
3. **Popup Backspace navigation safety**
4. **Popup Enter default-action fallback**
5. **Dirty-flow close confirmation**
6. **Popup history depth sync**
7. **Tabs roving tabindex + arrow navigation**
8. **Search input → row handoff**
9. **Row Escape → input return**
10. **Ctrl/Cmd+K global search shortcut gating**

## 12.2 High-priority send-flow tests

1. Recipient search single-result Enter quick-select
2. Recipient selection opens next step
3. Amount Enter-to-continue when valid
4. Amount Enter blocked when invalid
5. Backspace-at-empty returns to recipient input
6. Pathfinding failure warning + recovery actions
7. Amount-over-limit warning + Use max action
8. More-options collapsed/expanded behavior
9. Review “Change” actions jump to intended step
10. Final send success closes popup

## 12.3 Route integration tests

1. Settings `?tab=` deep-link behavior
2. Sales order deep-link route auto-opens popup
3. Closing route-wrapped popup returns to parent route

---

## 13. Suggested test organization

Organize tests by **interaction contract**, not just screen name.

Recommended layers:

### A. Shared primitive tests

- popup host
- popup state/history sync
- tabs primitive
- list keyboard helpers
- focus policy

### B. Pattern conformance tests

- “searchable list screen conforms to keyboard handoff contract”
- “review row pattern supports change navigation”
- “flow step declares initial focus target”

### C. Feature flow tests

- send flow end-to-end
- gateway flow
- checkout flow
- deep-link popup wrappers

This structure will reduce duplication and make regressions easier to diagnose.

---

## 14. Canonical assertions by UI pattern

### Popup

- Dialog opens with expected title.
- Focus lands on defined initial target.
- Tab never escapes popup.
- Escape behavior matches dismiss mode.
- Backspace pops one step only when allowed.

### Tabs

- Active tab only is tabbable.
- Arrow keys change selection.
- Tabpanel visibility matches selection.

### Search/list

- ArrowDown from input enters list.
- ArrowUp from first row returns to input.
- Escape from row returns to input.
- Enter/Space activate row without breaking nested controls.

### Review/edit flow

- Change actions return to exact intended step.
- Context persists after edit-return.

### Progressive disclosure

- Section collapsed initially.
- `aria-expanded` toggles accurately.
- Hidden controls are not initially focusable.

---

## 15. Final conclusions

The app’s keyboard-usable UX is built around a small number of repeatable patterns, and those patterns are strong enough to support systematic automated testing.

The most authoritative contracts to treat as stable are:

1. **Popup host keyboard/focus rules**
2. **Popup stack/history synchronization**
3. **Tabs roving tabindex and arrow navigation**
4. **Search/list keyboard handoff and row navigation**
5. **Send flow review/edit/validation patterns**
6. **Explicit focus marker conventions**

If automated tests are anchored to these shared contracts first, feature-specific coverage will be easier to write and much more resilient to UI refactors.
