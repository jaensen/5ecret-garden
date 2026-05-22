<script lang="ts">
  import { getContext } from 'svelte';
  import { createKeyboardListNavigator } from '@garden-ui/keyboard-list';
  import { RowFrame } from '@garden-ui/row';
  import type { MockListItem } from './mockListData';

  interface Props {
    item: MockListItem;
  }

  let { item }: Props = $props();

  const activate = getContext<(item: MockListItem) => void>('library-list-proof-activate');

  function getRows(anchor?: HTMLElement | null): HTMLElement[] {
    const scope = anchor?.closest<HTMLElement>('[data-library-list-proof-scope]')
      ?? document.querySelector<HTMLElement>('[data-library-list-proof-scope]');
    return Array.from(scope?.querySelectorAll<HTMLElement>('[data-library-list-proof-row]') ?? []);
  }

  function focusInput(anchor?: HTMLElement | null): void {
    const scope = anchor?.closest<HTMLElement>('[data-library-list-proof-scope]')
      ?? document.querySelector<HTMLElement>('[data-library-list-proof-scope]');
    scope?.querySelector<HTMLInputElement>('[data-library-list-proof-input]')?.focus();
  }

  const navigator = createKeyboardListNavigator({
    getRows,
    focusInput,
    onActivateRow: () => activate(item)
  });
</script>

<RowFrame
  clickable={true}
  noLeading={true}
  class="proof-row"
  data-library-list-proof-row
  data-list-row-focusable
  data-library-list-item-id={item.id}
  onclick={() => activate(item)}
  onkeydown={navigator.onRowKeydown}
>
  {#snippet title()}{item.title}{/snippet}
  {#snippet subtitle()}{item.subtitle}{/snippet}
  {#snippet meta()}Package-backed row-card proof{/snippet}
  {#snippet trailing()}<span class="proof-row__badge">Open</span>{/snippet}
</RowFrame>

<style>
  :global(.proof-row) {
    height: calc(100% - .75rem);
    margin: .375rem 0;
    box-sizing: border-box;
    text-align: left;
  }

  :global(.proof-row:focus-visible) {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--gui-row-focus, #2563eb);
  }

  .proof-row__badge { font-size: .75rem; border: 1px solid #d4d4d8; border-radius: 999px; padding: .15rem .45rem; color: #52525b; }
</style>
