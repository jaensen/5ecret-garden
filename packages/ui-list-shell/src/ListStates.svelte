<script lang="ts">
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
    children
  }: Props = $props();
</script>

{#if loading}
  <div class="gui-list-state">{loadingLabel}</div>
{:else if error}
  <div class="gui-list-state gui-list-state--error">{error}</div>
{:else if isEmpty}
  <div class="gui-list-state">{emptyLabel}</div>
{:else if isNoMatches}
  <div class="gui-list-state">{noMatchesLabel}</div>
{:else}
  {@render children?.()}
{/if}

<style>
  .gui-list-state { width:100%; padding:1rem 0; text-align:center; color:#52525b; }
  .gui-list-state--error { color:#b91c1c; }
</style>
