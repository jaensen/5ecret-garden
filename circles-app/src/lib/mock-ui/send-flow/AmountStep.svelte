<script lang="ts">
  import { FlowStepScaffold, StepAlert, StepReviewRow } from '@garden-ui/flow-step';
  import type { MockSendFlowContext } from './mockSendFlowContext';
  import RecipientStep from './RecipientStep.svelte';
  import ReviewStep from './ReviewStep.svelte';
  import { openStep, popToStep } from './runtime';

  interface Props {
    context: MockSendFlowContext;
  }

  let { context }: Props = $props();
  let amount = $state('');

  const canContinue = $derived(Number(amount) > 0 && context.routeStatus === 'ready');
  const amountInvalid = $derived(amount !== '' && !(Number(amount) > 0));
  let moreOpen = $state(false);

  $effect(() => {
    amount = context.amount;
  });

  function editRecipient() {
    context.recipient = undefined;
    popToStep(RecipientStep, { context });
  }

  function handleContinue() {
    if (!canContinue) return;
    context.amount = amount;
    openStep(ReviewStep, { context });
  }

  function focusRecipientInputSoon(): void {
    queueMicrotask(() => {
      document.querySelector<HTMLInputElement>('[data-mock-recipient-input]')?.focus();
      setTimeout(() => {
        document.querySelector<HTMLInputElement>('[data-mock-recipient-input]')?.focus();
      }, 0);
    });
  }

  function onAmountKeydown(event: KeyboardEvent): void {
    const target = event.currentTarget as HTMLInputElement;
    if (event.key === 'Enter') {
      event.preventDefault();
      handleContinue();
      return;
    }
    if (event.key === 'Backspace' && target.value === '' && target.selectionStart === 0 && target.selectionEnd === 0) {
      event.preventDefault();
      editRecipient();
      focusRecipientInputSoon();
    }
  }

  function onAmountInput(event: Event): void {
    amount = (event.currentTarget as HTMLInputElement).value;
    context.amount = amount;
  }
</script>

<FlowStepScaffold step={2} total={3} title="Amount" subtitle="Choose how much to send." labels={['Recipient', 'Amount', 'Review']}>
  <StepReviewRow label="Recipient" value={context.recipient ? `${context.recipient.name} · ${context.recipient.address}` : 'Not selected'} onChange={editRecipient} />

  <div class="amount-wrap">
    <label class="amount-label" for="mock-send-amount">Amount</label>
    <input
      id="mock-send-amount"
      class="amount-input"
      data-ui-initial-input
      data-mock-send-amount-input
      bind:value={amount}
      oninput={onAmountInput}
      onkeydown={onAmountKeydown}
      inputmode="decimal"
      placeholder="0.00"
    />
  </div>

  {#if context.routeStatus === 'unavailable'}
    <StepAlert variant="warning" title="Route unavailable" message="Try another recipient or update routing." />
  {:else if amountInvalid}
    <StepAlert variant="warning" title="Enter an amount" message="Amount must be greater than 0." />
  {/if}

  <div class="advanced">
    <button type="button" class="advanced-toggle" aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)}>
      More options
    </button>
    {#if moreOpen}
      <textarea class="advanced-note" bind:value={context.note} placeholder="Optional note"></textarea>
    {/if}
  </div>

  <div class="actions">
    <button type="button" class="primary" onclick={handleContinue} disabled={!canContinue}>Continue</button>
  </div>
</FlowStepScaffold>

<style>
  .amount-wrap { display:flex; flex-direction:column; gap:.4rem; }
  .amount-label { font-size:.875rem; font-weight:600; }
  .amount-input, .advanced-note {
    width:100%; border:1px solid #d4d4d8; border-radius:.75rem; padding:.75rem; background:#fff;
  }
  .amount-input:focus-visible, .advanced-note:focus-visible, .advanced-toggle:focus-visible, .primary:focus-visible {
    outline:2px solid #2563eb; outline-offset:2px;
  }
  .advanced { border:1px solid #e4e4e7; border-radius:.875rem; overflow:hidden; }
  .advanced-toggle { width:100%; text-align:left; background:#fafafa; border:0; padding:.75rem 1rem; cursor:pointer; }
  .advanced-note { border-radius:0; border-width:1px 0 0; }
  .actions { display:flex; justify-content:flex-end; }
  .primary { border:0; background:#2563eb; color:#fff; border-radius:.75rem; padding:.7rem 1rem; cursor:pointer; }
  .primary:disabled { opacity:.5; cursor:not-allowed; }
</style>
