<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Writable } from 'svelte/store';
  import ListToolbar from './ListToolbar.svelte';
  import ListStates from './ListStates.svelte';

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
    searchPlaceholder = 'Search…',
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
    listClass = 'gui-list-shell__list',
    children
  }: Props = $props();

  const effectiveIsEmpty = $derived(emptyRequiresEnd ? (ended && isEmpty) : isEmpty);
</script>

<ListToolbar
  query={query}
  placeholder={searchPlaceholder}
  class={toolbarClass}
  actions={toolbarActions}
  bind:inputEl={inputEl}
  {onInputKeydown}
  {onInputFocus}
  {inputDataAttribute}
/>

{#if toolbarBelow}
  <div class="gui-list-shell__below">{@render toolbarBelow?.()}</div>
{/if}

<ListStates
  {loading}
  {error}
  isEmpty={effectiveIsEmpty}
  {isNoMatches}
  {loadingLabel}
  {emptyLabel}
  {noMatchesLabel}
>
  {#if wrapInListContainer}
    <div role={listRole} class={listClass}>
      {@render children?.()}
    </div>
  {:else}
    {@render children?.()}
  {/if}
</ListStates>

<style>
  .gui-list-shell__below { margin-bottom:.75rem; }
  .gui-list-shell__list { display:flex; flex-direction:column; gap:.5rem; width:100%; }
</style>
