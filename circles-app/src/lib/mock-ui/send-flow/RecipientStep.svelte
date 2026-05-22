<script lang="ts">
  import { writable } from 'svelte/store';
  import { ListShell } from '@garden-ui/list-shell';
  import { createKeyboardListNavigator } from '@garden-ui/keyboard-list';
  import { FlowStepScaffold } from '@garden-ui/flow-step';
  import { openStep } from './runtime';
  import AmountStep from './AmountStep.svelte';
  import type { MockRecipient, MockSendFlowContext } from './mockSendFlowContext';
  import { MOCK_RECIPIENTS } from './mockSendFlowContext';

  interface Props {
    context: MockSendFlowContext;
  }

  let { context }: Props = $props();

  const query = writable('');
  let scopeEl: HTMLDivElement | null = $state(null);

  const filteredRecipients = $derived.by(() => {
    const q = $query.trim().toLowerCase();
    if (!q) return MOCK_RECIPIENTS;
    return MOCK_RECIPIENTS.filter((item) => item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q));
  });

  function selectRecipient(item: MockRecipient) {
    context.recipient = item;
    openStep(AmountStep, { context });
  }

  function getRows(anchor?: HTMLElement | null): HTMLElement[] {
    const scope = anchor?.closest<HTMLElement>('[data-mock-recipient-scope]') ?? scopeEl;
    return Array.from(scope?.querySelectorAll<HTMLElement>('[data-mock-recipient-row]') ?? []);
  }

  function focusInput(anchor?: HTMLElement | null): void {
    const scope = anchor?.closest<HTMLElement>('[data-mock-recipient-scope]') ?? scopeEl;
    scope?.querySelector<HTMLInputElement>('[data-mock-recipient-input]')?.focus();
  }

  const navigator = createKeyboardListNavigator({
    getRows,
    focusInput,
    onActivateRow: (row) => {
      const id = row.dataset.recipientId;
      const item = filteredRecipients.find((entry) => entry.id === id);
      if (item) selectRecipient(item);
    }
  });

  function onSearchKeydown(event: KeyboardEvent): void {
    const hasInputFocus = event.currentTarget instanceof HTMLInputElement && document.activeElement === event.currentTarget;
    if (event.key === 'Enter' && !event.isComposing && hasInputFocus && filteredRecipients.length === 1) {
      event.preventDefault();
      selectRecipient(filteredRecipients[0]);
      return;
    }
    navigator.onInputArrowDown(event);
  }
</script>

<FlowStepScaffold step={1} total={3} title="Recipient" subtitle="Choose who to send to." labels={['Recipient', 'Amount', 'Review']}>
  <div bind:this={scopeEl} data-mock-recipient-scope>
    <ListShell
      query={query}
      searchPlaceholder="Search recipients"
      onInputKeydown={onSearchKeydown}
      inputDataAttribute="data-ui-initial-input data-mock-recipient-input"
      isEmpty={filteredRecipients.length === 0}
      emptyLabel="No recipients"
    >
      {#each filteredRecipients as item (item.id)}
        <button
          type="button"
          class="mock-row"
          data-mock-recipient-row
          data-recipient-id={item.id}
          onclick={() => selectRecipient(item)}
          onkeydown={navigator.onRowKeydown}
          onfocus={() => {}}
        >
          <span>
            <strong>{item.name}</strong><br />
            <small>{item.address}</small>
          </span>
        </button>
      {/each}
    </ListShell>
  </div>
</FlowStepScaffold>

<style>
  .mock-row {
    width: 100%;
    text-align: left;
    border: 1px solid #d4d4d8;
    background: #fff;
    border-radius: .875rem;
    padding: .875rem 1rem;
    cursor: pointer;
  }
  .mock-row:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
</style>
