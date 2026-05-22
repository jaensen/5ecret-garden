<script lang="ts">
  import { ListShell as GardenListShell } from '@garden-ui/list-shell';
  import type { Snippet } from 'svelte';
  import type { Writable } from 'svelte/store';

  interface Props {
    query: Writable<string>;
    searchPlaceholder?: string;
    toolbarClass?: string;
    toolbarActions?: Snippet;
    toolbarBelow?: Snippet;
    onInputKeydown?: (event: KeyboardEvent) => void;
    onInputFocus?: (event: FocusEvent) => void;
    inputDataAttribute?: string;
    inputEl?: HTMLInputElement | null;
    loading?: boolean;
    error?: string | null;
    isEmpty?: boolean;
    isNoMatches?: boolean;
    ended?: boolean;
    emptyRequiresEnd?: boolean;
    loadingLabel?: string;
    emptyLabel?: string;
    noMatchesLabel?: string;
    wrapInListContainer?: boolean;
    listRole?: string;
    listClass?: string;
    children?: Snippet;
  }

  let {
    query,
    searchPlaceholder = 'Search by address or name',
    toolbarClass = '',
    toolbarActions,
    toolbarBelow,
    onInputKeydown,
    onInputFocus,
    inputDataAttribute,
    inputEl = $bindable(null),
    loading = false,
    error = null,
    isEmpty = false,
    isNoMatches = false,
    ended = false,
    emptyRequiresEnd = false,
    loadingLabel = 'Loading…',
    emptyLabel = 'No entries',
    noMatchesLabel = 'No matches',
    wrapInListContainer = true,
    listRole = 'list',
    listClass = 'w-full flex flex-col gap-y-1.5',
    children,
  }: Props = $props();
</script>

<div class="app-list-shell-theme">
  <GardenListShell
    {query}
    {searchPlaceholder}
    toolbarClass={`app-list-toolbar-theme ${toolbarClass}`.trim()}
    {toolbarActions}
    {toolbarBelow}
    {onInputKeydown}
    {onInputFocus}
    {inputDataAttribute}
    bind:inputEl
    {loading}
    {error}
    {isEmpty}
    {isNoMatches}
    {ended}
    {emptyRequiresEnd}
    {loadingLabel}
    {emptyLabel}
    {noMatchesLabel}
    {wrapInListContainer}
    {listRole}
    {listClass}
  >
    {@render children?.()}
  </GardenListShell>
</div>

<style>
  :global(.app-list-shell-theme .gui-list-toolbar__input) {
    border-color: oklch(var(--bc) / 0.2);
    border-radius: var(--rounded-btn, 0.5rem);
    background: oklch(var(--b1));
    color: oklch(var(--bc));
  }

  :global(.app-list-shell-theme .gui-list-state) {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    color: oklch(var(--bc) / 0.6);
  }

  :global(.app-list-shell-theme .gui-list-state--error) {
    color: oklch(var(--er));
  }
</style>
