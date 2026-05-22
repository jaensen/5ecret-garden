<script lang="ts">
  import { getContext } from 'svelte';
  import { createKeyboardListNavigator } from '@garden-ui/keyboard-list';
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

<button
  type="button"
  class="proof-row"
  data-library-list-proof-row
  data-list-row-focusable
  data-library-list-item-id={item.id}
  onclick={() => activate(item)}
  onkeydown={navigator.onRowKeydown}
>
  <span class="proof-row__main">
    <strong>{item.title}</strong>
    <small>{item.subtitle}</small>
  </span>
</button>

<style>
  .proof-row {
    width: 100%;
    height: 100%;
    text-align: left;
    border: 1px solid #d4d4d8;
    background: #fff;
    border-radius: .875rem;
    padding: .75rem 1rem;
    cursor: pointer;
  }
  .proof-row:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  .proof-row__main {
    display: flex;
    flex-direction: column;
    gap: .2rem;
  }
  .proof-row__main small {
    color: #52525b;
  }
</style>
