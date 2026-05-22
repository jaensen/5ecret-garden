## Circles App UI and Layout Pattern Reference

**Application:** `circles-app`  
**Purpose:** implementation-grounded reference for frontend development  
**Scope:** tabs, lists, list items, cards/rows, header/navigation, popups, send flow, spacing, color usage, and typography  
**Primary sources reviewed:** `src/app.css`, `src/lib/shared/ui/primitives/tabs/*`, `src/lib/shared/ui/lists/*`, `src/lib/shared/ui/primitives/RowFrame.svelte`, `src/lib/shared/ui/shell/*`, `src/lib/shared/ui/flow/*`, `src/routes/DefaultHeader.svelte`, `src/lib/areas/wallet/flows/send/*`, `src/lib/areas/contacts/ui/pages/SearchAvatar.svelte`, `src/lib/shared/ui/avatar-search/*`

---

## 1. Executive summary

The current UI is built on a consistent combination of:

- **Tailwind + DaisyUI utility classes** for macro layout, buttons, cards, navbar, menus, and semantic theme colors.
- **App-owned primitives** for the interaction-heavy surfaces that need stronger behavioral consistency, especially `Tabs`, `RowFrame`, list shells, popup hosting, and multi-step flows.
- **Compact, card-like surfaces** with rounded corners, light borders, soft shadows, and clear spacing between stacked sections.
- **Tokenized row/list styling** in `src/app.css`, which gives list items a reusable visual contract: fixed minimum heights, consistent padding, shared border radius, hover/selected/focus states, and muted metadata text.
- **Popup-first workflows** for complex tasks. The send flow is the clearest “gold standard”: each step is framed consistently, focus is managed intentionally, edit loops are exposed via compact clickable summary rows, and state changes happen inside the popup stack instead of through ad hoc page rewrites.

Overall, the design language is not a fully isolated component library yet, but it is already coherent enough that future frontend work should treat these repeated patterns as **the product’s de facto design system**.

---

## 2. Global visual system patterns

### 2.1 Technology and styling model

The UI uses three styling layers at once:

1. **Theme-backed DaisyUI primitives** such as `btn`, `navbar`, `menu`, `card`, `tabs`, `bg-base-100`, `text-base-content`, `text-primary`, and `border-base-300`.
2. **Tailwind utility composition** for spacing, sizing, alignment, and responsive behavior.
3. **Local app tokens and helpers** in `src/app.css` for pages, sections, headings, muted text, and reusable row metrics.

This means new UI should generally:

- start from DaisyUI semantic theme classes,
- use Tailwind utilities for layout adjustment,
- and prefer the app’s own primitives when behavior or repeated structure matters.

### 2.2 Surface hierarchy

The recurring surface hierarchy is:

- **Page background / app shell**
- **Section or card container**
- **Rows or stacked controls inside the section**
- **Muted metadata / helper text under the main interaction**

The reusable `.section` helper in `src/app.css` captures the standard content container:

- `bg-base-100`
- `border border-base-300`
- `rounded-lg`
- `p-4 md:p-6`
- `shadow-sm`

This tells us the preferred app surface is a **light, elevated, rounded container**, not a flat canvas.

### 2.3 Density and rhythm

The app consistently favors a **compact but touch-friendly density**:

- row heights are `44px` or `56px`,
- horizontal row padding is `12px` or `16px`,
- standard row radius is `12px`,
- page stacks commonly use `gap-y-6`,
- section internals commonly use `space-y-3` or `space-y-4`,
- responsive padding usually steps from `px-4` to `md:px-6`.

This creates a clear rule of thumb for new screens: **small outer shells, medium internal gaps, comfortable tap targets**.

---

## 3. Typography patterns

### 3.1 Primary font

`src/app.css` self-hosts **DM Sans** as the core typeface for both normal and italic styles with a variable weight range. That makes DM Sans the authoritative product font.

### 3.2 Heading and emphasis usage

The visible type hierarchy is modest and pragmatic rather than editorial. Common patterns are:

- prominent titles using bold weights,
- compact section labels using DaisyUI’s `menu-title`,
- muted helper/meta copy using reduced opacity classes such as `text-base-content/60` and `text-base-content/70`,
- small captions with `text-xs`,
- supportive secondary labels at `text-sm` or `text-xs`.

The app-defined `.h2` helper is:

- `text-2xl font-bold`
- `md:text-3xl`

This suggests large display typography is used sparingly; most surfaces depend on **weight and spacing**, not dramatic size changes.

### 3.3 Text behavior inside rows and dense UIs

`RowFrame` enforces text truncation and a three-level content structure:

- title: stronger weight and primary foreground,
- subtitle: smaller and muted,
- meta: smallest and more muted.

This is important: the UI assumes list items often need to stay on a **single-line, ellipsized layout** rather than wrap unpredictably.

### 3.4 Practical typography guidance

For future work, follow these conventions:

- use boldness before large font jumps,
- keep metadata visually subordinate,
- use `menu-title` or equivalent small uppercase-ish section labeling where appropriate,
- reserve larger headings for page or flow-level titles,
- prefer truncation over multi-line chaos in interactive rows.

---

## 4. Color patterns

### 4.1 Theme semantics over hard-coded palette values

The app relies heavily on theme variables and semantic classes rather than fixed hex colors. Common classes/tokens include:

- `bg-base-100`
- `text-base-content`
- `border-base-300`
- `text-primary`
- `var(--p)` and `var(--bc)` through custom CSS tokens

This means the intended design system is **theme-aware**, even where specific surfaces are app-owned.

### 4.2 Row color contract

The row token block in `src/app.css` defines a consistent contract for list items and row-like cards:

- default background from the primary theme token,
- hover and selected backgrounds derived from the same family,
- borders mixed from base content color with transparency,
- focus ring mixed from the primary theme color,
- strong / muted / more-muted text variants derived from base content.

The important design implication is that row states are intentionally coordinated:

- hover changes background and border together,
- selection is not only color-filled but also inset-highlighted,
- disabled rows reduce opacity and suppress interaction.

### 4.3 Muted text as a structural color pattern

The app repeatedly uses partial-opacity base-content text for:

- labels below titles,
- explanatory hints,
- result counters,
- status copy,
- beta markers and secondary badges.

This is one of the most repeated color patterns in the codebase and should remain consistent.

### 4.4 Practical color guidance

- Prefer semantic theme classes over custom one-off values.
- Use primary color for brand emphasis, active states, and focus-adjacent highlighting.
- Use `base-100` for most cards and popup surfaces.
- Use subdued text opacity for secondary information rather than inventing new neutral colors.

---

## 5. Spacing and layout patterns

### 5.1 Page scaffolding

`src/app.css` defines a simple but clear page scaffold:

- `.page`: centered content with `px-4 sm:px-6`
- `.page--md`, `.page--lg`, `.page--xl`: width caps
- `.page-pt`: top padding
- `.page-stack`: vertical stack with `gap-y-6`

This means new page layouts should generally:

- stay centered,
- choose a deliberate max width,
- use a vertical stack rhythm instead of ad hoc margins,
- keep mobile padding tight and expand at larger breakpoints.

### 5.2 Content widths

`PageScaffold.svelte` shows the preferred page-shell pattern for route-level surfaces:

- max width defaults around `max-w-4xl`,
- content width can differ from outer width,
- horizontal padding is centrally controlled,
- sticky/collapsed header behavior is layered on top rather than solved per page.

This is a strong signal that layout should be **scaffold-driven**, not reimplemented screen by screen.

### 5.3 Internal spacing rhythm

Common spacing values observed across representative UI:

- `mt-1`, `mt-2`, `mt-3`, `mt-4` for local vertical adjustments,
- `gap-1`, `gap-1.5`, `gap-2`, `gap-3` for inline clusters,
- `space-y-4` for multi-step content blocks,
- `mb-3` for toolbar/help text separation,
- `p-2` for menu/dropdown internals.

The pattern is consistent: **micro-gaps inside controls, medium gaps between blocks, larger page gaps between sections**.

### 5.4 Rounded geometry

Rounded corners are used almost everywhere:

- `rounded-lg` for sections,
- `rounded-box` for dropdown menus,
- `12px` row radius from tokens,
- circular buttons for compact icon actions.

The visual language is therefore **soft and rounded**, not sharp-edged.

---

## 6. Header and navigation patterns

### 6.1 Default header shape

`src/routes/DefaultHeader.svelte` establishes the standard top navigation bar:

- `navbar bg-base-100 px-4 sticky top-0 z-10`
- brand/logo on the left,
- compact action buttons on the right,
- overflow/menu actions inside a dropdown.

Important recurring traits:

- it is **sticky**, so the app expects persistent top-level navigation,
- actions are compact (`btn-sm`, `btn-circle`, `btn-ghost`),
- branding uses color sparingly, mainly `text-primary` on the wordmark.

### 6.2 Navigation action patterns

The header supports three navigation/action modes:

- **direct links** through anchors,
- **ephemeral utility actions** such as search,
- **overflow navigation** inside a dropdown menu.

This is a useful model for future features: if an action is global but not primary, it belongs in the header as an icon or overflow item rather than as a large persistent control.

### 6.3 Dropdown navigation pattern

The menu uses a native `details`/`summary` shell enhanced with app-managed close behavior. Visual pattern:

- right-aligned dropdown,
- `menu dropdown-content bg-base-100 rounded-box ... shadow`,
- nested sub-listing under settings.

Behavioral pattern:

- closes on outside click,
- closes on `Escape`,
- closes on route change,
- can return focus to the summary trigger.

This is a strong accessibility and interaction precedent for future compact menus.

### 6.4 Search as a global utility

Search is presented as a **global command**:

- dedicated icon button,
- keyboard shortcut `Ctrl/Cmd+K`,
- blocked while a popup is open,
- blocked when the user is typing into another text field.

This reinforces a broader product pattern: important utilities should be globally callable, but they must respect current input focus and active modal state.

---

## 7. Tabs patterns

### 7.1 Tabs are a shared primitive, not page-local markup

The tab system is implemented in shared primitives rather than improvised per page. This is important because the tab contract includes:

- keyboard traversal,
- roving tabindex,
- active state handling,
- scroll support for crowded tab bars,
- size and variant options.

New tabbed surfaces should therefore reuse the primitive rather than duplicating DaisyUI tab markup.

### 7.2 Visual behavior of tabs

The implementation supports the common app expectation that tabs may overflow horizontally and still remain usable. The pattern is:

- compact horizontal tab bars,
- visible active state,
- responsive handling for narrow widths,
- arrow-based movement for keyboard users.

This indicates the product does not assume a small, static number of tabs.

### 7.3 Interaction guidance

Tabs in Circles should be treated as:

- **peer-level mode switches** within the same page or surface,
- keyboard accessible by default,
- horizontally scannable,
- appropriate for settings-like or segmented content, not for deep process steps.

The send flow confirms that true process progression is handled by **popup steps**, not tabs.

---

## 8. Lists and search patterns

### 8.1 List shells are structured, not raw stacks

`ListShell.svelte` defines the expected list composition:

1. toolbar/search input,
2. optional helper content below the toolbar,
3. loading/error/empty/no-match handling,
4. the actual list container.

This is a very important pattern: list UIs are meant to have a **stable shell** even as the result set changes.

### 8.2 Search-first list behavior

The avatar search stack demonstrates the strongest list/search pattern:

- the search input is the primary entry point,
- arrow-down moves focus from the input into rows,
- pressing `Enter` on a single strong result can auto-select,
- result counts and helper hints appear immediately under the input,
- remote search is delayed until a minimum input length is reached,
- remote activity is shown inline with a tiny spinner and helper label.

This is a clean pattern for all future searchable entity pickers.

### 8.3 Progressive disclosure inside list search

When there is no query, the list does not become empty noise. Instead it falls back to prioritized local content:

- VIP bookmarks first,
- then bookmarks,
- then contacts.

This is a strong product pattern: **empty search state should still be useful**.

### 8.4 List state messaging

The app favors compact, low-drama feedback for list states:

- small muted helper copy,
- inline spinner,
- restrained empty-state text,
- action buttons only when the empty state can be resolved meaningfully.

In the avatar search case, if no account is found but the input is a valid address in the contact flow, the empty state becomes actionable with invite/trust buttons. That is a good pattern for “no result but meaningful next step”.

---

## 9. List item and row/card patterns

### 9.1 `RowFrame` is the dominant item primitive

`RowFrame.svelte` is the clearest reusable item/card primitive for structured rows. It supports:

- leading / content / trailing regions,
- clickable mode,
- selected mode,
- disabled mode,
- dense mode,
- optional removal of the leading column,
- keyboard activation through `Enter` and `Space`.

This means Circles list items are designed to function equally well as:

- passive information rows,
- selectable list entries,
- mini-cards summarizing a chosen state,
- step-edit affordances inside flows.

### 9.2 Row visual language

`RowFrame` uses a row that is visually halfway between a list item and a compact card:

- border,
- rounded corners,
- padded interior,
- hover border/background shift,
- clear focus ring,
- optional inset selection styling.

This is a defining Circles pattern: many “cards” are really **row-cards** rather than large content panels.

### 9.3 Information hierarchy inside rows

The expected order is:

- strong primary identifier,
- smaller secondary descriptor,
- optional meta line,
- trailing affordance or status.

Because content is ellipsized, row titles should be short, decisive, and recognizable.

### 9.4 Clickable summary rows inside flows

The send flow uses `RowFrame` inside full-width transparent buttons to create editable summary cards such as:

- recipient row,
- token filter row.

These rows show:

- a section label using `menu-title`,
- the current selected value,
- a trailing `ChangeButton`.

This is a very strong reusable pattern for review-and-edit steps in any wizard.

---

## 10. Popup and modal patterns

### 10.1 Popups are a primary navigation surface

Popups are not just alerts in this app. The popup system is used for:

- inspect/detail views,
- selection flows,
- global search,
- nested multi-step journeys,
- send and checkout-like tasks.

This means modal design quality is central to the product, not secondary.

### 10.2 Popup stack model

`PopupHost.svelte` keeps the popup stack mounted and tracks pages with stable keys. The model is effectively a **stacked page navigator inside a modal shell**.

Important consequences:

- nested pages are normal,
- transitions within a popup should preserve state,
- scroll position is restored per popup page,
- focus is re-evaluated whenever the top page changes.

### 10.3 Popup focus model

The popup host explicitly looks for focus markers in priority order:

1. text input markers such as `data-popup-initial-input` / `data-send-step-initial-input`
2. non-input initial focus markers such as `data-popup-initial-focus` / `data-send-step-initial-focus`
3. first generic focusable element
4. fallback close control or title

This is a major platform contract. Any new popup-based flow should participate in this system rather than relying on implicit browser focus.

### 10.4 Popup dismissal philosophy

Representative popups use explicit dismissal behavior such as backdrop dismissal for inspect-style search. More importantly, the popup host preserves the previously focused element and restores focus when the popup closes.

This supports a consistent rule: **open popups should feel like temporary, well-contained context shifts, not page detours that strand focus**.

### 10.5 Popup surface guidance

Based on the host and representative usage, popup content should generally:

- expose a strong title,
- mark the correct initial focus target,
- behave like an internal page stack when multi-step,
- preserve context rather than replacing the whole route,
- keep dense but readable internal spacing.

---

## 11. Send flow patterns

### 11.1 Why the send flow matters

The send flow is the best current reference for how the app handles a serious, multi-step transactional interaction. It combines:

- search-driven entity selection,
- stateful step transitions,
- editable summaries,
- asynchronous route/path validation,
- inline helper content,
- warnings/errors without leaving the flow,
- review before final action.

Any future complex workflow should study this flow first.

### 11.2 Shared step scaffold

Each step is wrapped in `FlowStepScaffold`, which combines:

- decorative flow framing,
- step header and title,
- stack spacing,
- an initial-focus target.

This makes each step feel like a distinct, structured page rather than a loose form fragment.

### 11.3 Step sequencing pattern

The send flow progresses through a clear chain:

1. choose recipient,
2. choose or refine transfer route/token options,
3. enter amount,
4. review and send.

This is a classic “selection → configuration → amount entry → confirmation” structure and it maps well to other wallet/commerce flows.

### 11.4 Recipient step pattern

The recipient step is extremely simple on purpose:

- a single focus-framed scaffold,
- one search-driven selector,
- immediate progression after valid selection.

This is a useful lesson: early steps should minimize choice overload.

### 11.5 Amount step pattern

The amount step shows several strong conventions:

- previously chosen values are summarized in clickable row-cards at the top,
- those summaries provide direct edit loops,
- complex routing options are available but visually subordinate,
- validation and pathfinding problems are shown inline as alerts,
- auxiliary explanation is attached close to the relevant control.

This is a good pattern for any intermediate step where users may need to revise upstream choices.

### 11.6 Error and warning presentation inside the flow

The flow prefers **inline contextual alerts** over disruptive blocking dialogs. For example, pathfinding failures become warnings within the current step instead of pushing the user out of the process.

That is an important product behavior pattern: keep the user in context whenever possible.

### 11.7 Review-and-send pattern

Although the full review file contains more detail, the overall send-flow pattern is clear: the final step is a **review surface with enough editability to avoid a hard dead end**. This is more trustworthy than a rigid one-way wizard.

### 11.8 Send-flow design guidance for future work

Future multi-step flows should imitate the send flow by default:

- one dominant task per step,
- deliberate initial focus markers,
- editable summary rows for upstream decisions,
- inline error/warning messaging,
- compact helper copy instead of verbose instruction blocks,
- nested popup/page transitions rather than route churn for every micro-step.

---

## 12. Cards versus rows versus sections

The app effectively uses three related container patterns:

### 12.1 Sections

Use for page-level grouping.

Characteristics:

- larger padding,
- border + subtle shadow,
- stable background,
- can hold multiple controls or subgroups.

### 12.2 Row-cards

Use for interactive summaries or list items.

Characteristics:

- shorter height,
- strong edge definition,
- compact structure,
- often clickable,
- usually single-purpose.

### 12.3 Full cards from framework classes

Used where DaisyUI `card` semantics are already appropriate, especially for broader content blocks. However, the implementation emphasis appears stronger around **sections and row-cards** than around large marketing-style cards.

For future frontend work, default to:

- **section** for grouped screen content,
- **row-card** for selection/review/action items,
- **full card** only when content is broader or more editorial.

---

## 13. Accessibility and interaction contracts that affect layout decisions

Even though this document is focused on UI/layout, some interaction contracts are clearly part of the design system because they shape the structure of components.

### 13.1 Keyboard parity is expected

Shared components support:

- arrow navigation in tabs and searchable lists,
- `Enter` / `Space` activation for clickable rows,
- `Escape` close behavior for menus,
- managed focus on popup entry and exit.

This means components should continue to be laid out with keyboard progression in mind.

### 13.2 Focus is a visible design layer

The row primitive exposes a visible focus treatment and popup focus targets are explicitly marked. Focus affordances should remain visible and meaningful, but the current heavier border treatment should not be treated as a normative design requirement.

### 13.3 Dense interfaces still preserve discoverability

Even compact surfaces usually include one of the following:

- a label,
- a title,
- a muted explanation,
- a trailing change/action affordance.

The result is dense UI without becoming cryptic.

---

## 14. Practical rules for future frontend development

If the goal is consistency with the current product, the following rules should guide new work.

### 14.1 Prefer existing primitives over reimplementation

- Use shared `Tabs` for tab interfaces.
- Use `ListShell` and related list utilities for searchable/selectable lists.
- Use `RowFrame` for compact interactive rows and summary cards.
- Use popup state/host conventions for modal flows.
- Use `FlowStepScaffold` for multi-step popup journeys.

### 14.2 Preserve the app’s density model

- keep rows in the existing 44px/56px family,
- keep horizontal padding around 12px/16px,
- use medium gaps between logical blocks,
- avoid sprawling empty space unless the screen is intentionally spacious.

### 14.3 Keep color semantic

- lean on theme classes and tokens,
- reserve primary emphasis for brand, selection, and important active states,
- use muted base-content variants for supporting copy.

### 14.4 Structure complex flows like the send flow

- one main choice or input per step,
- immediate progression when a decision is complete,
- editable review cards for previous decisions,
- inline recovery from warnings/errors,
- explicit focus markers.

### 14.5 Treat popups as first-class pages

- do not design popups like throwaway overlays,
- support internal navigation and context preservation,
- ensure initial focus is intentional,
- make titles and close/back affordances obvious.

---

## 15. Gaps and opportunities revealed by the current implementation

The patterns are strong, but they are still partly implicit. The codebase would benefit from gradually formalizing the following:

- a documented component inventory mapping “use cases” to primitives,
- a clearer statement of when to use section containers versus row-cards versus framework cards,
- explicit typography tokens beyond `.h2` and ad hoc utility usage,
- a shared design-language reference for alert, helper, and status messaging,
- a dedicated visual spec for header/collapsed-header/bottom-nav coordination.

These are documentation and systematization opportunities, not urgent design failures.

---

## 16. Bottom line

The current Circles UI pattern language can be summarized as:

- **theme-semantic, utility-composed layout**,
- **rounded compact surfaces**,
- **structured rows as a foundational pattern**,
- **popup-centered complex workflows**,
- **modest but disciplined typography**,
- **clear focus and keyboard behavior as part of the UI contract**.

For future frontend development, the safest way to remain consistent is to treat the existing shared primitives and send-flow structure as the product’s authoritative baseline rather than introducing one-off layouts for each new feature.