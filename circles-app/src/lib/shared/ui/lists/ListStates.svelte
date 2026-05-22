<script lang="ts">
  import { ListStates as GardenListStates } from '@garden-ui/list-shell';
  import type { Snippet } from 'svelte';

  interface Props {
    loading?: boolean;
    error?: string | null;
    isEmpty?: boolean;
    isNoMatches?: boolean;
    loadingLabel?: string;
    emptyLabel?: string;
    noMatchesLabel?: string;
    children?: Snippet;
  }

  let {
    loading = false,
    error = null,
    isEmpty = false,
    isNoMatches = false,
    loadingLabel = 'Loading…',
    emptyLabel = 'No entries',
    noMatchesLabel = 'No matches',
    children,
  }: Props = $props();
</script>

<div class="app-list-states-theme">
  <GardenListStates {loading} {error} {isEmpty} {isNoMatches} {loadingLabel} {emptyLabel} {noMatchesLabel}>
    {@render children?.()}
  </GardenListStates>
</div>

<style>
  :global(.app-list-states-theme .gui-list-state) {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    color: oklch(var(--bc) / 0.6);
  }

  :global(.app-list-states-theme .gui-list-state--error) {
    color: oklch(var(--er));
  }
</style>
