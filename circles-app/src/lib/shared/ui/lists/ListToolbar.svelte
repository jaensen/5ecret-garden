<script lang="ts">
  import { ListToolbar as GardenListToolbar } from '@garden-ui/list-shell';
  import type { Snippet } from 'svelte';
  import type { Writable } from 'svelte/store';

  interface Props {
    query: Writable<string>;
    placeholder?: string;
    class?: string;
    actions?: Snippet;
    onInputKeydown?: (event: KeyboardEvent) => void;
    onInputFocus?: (event: FocusEvent) => void;
    inputDataAttribute?: string;
    inputEl?: HTMLInputElement | null;
  }

  let {
    query,
    placeholder = 'Search…',
    class: className = '',
    actions,
    onInputKeydown,
    onInputFocus,
    inputDataAttribute,
    inputEl = $bindable(null),
  }: Props = $props();
</script>

<GardenListToolbar
  {query}
  {placeholder}
  class={`app-list-toolbar-theme ${className}`.trim()}
  {actions}
  {onInputKeydown}
  {onInputFocus}
  {inputDataAttribute}
  bind:inputEl
/>

<style>
  :global(.app-list-toolbar-theme .gui-list-toolbar__input) {
    border-color: oklch(var(--bc) / 0.2);
    border-radius: var(--rounded-btn, 0.5rem);
    background: oklch(var(--b1));
    color: oklch(var(--bc));
  }
</style>
