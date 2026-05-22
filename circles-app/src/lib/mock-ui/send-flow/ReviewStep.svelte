<script lang="ts">
  import { FlowStepScaffold, StepAlert, StepReviewRow } from '@garden-ui/flow-step';
  import type { MockSendFlowContext } from './mockSendFlowContext';
  import RecipientStep from './RecipientStep.svelte';
  import AmountStep from './AmountStep.svelte';
  import { popToStep } from './runtime';
  import { popupControls } from '@garden-ui/popup-runtime';

  interface Props {
    context: MockSendFlowContext;
  }

  let { context }: Props = $props();
  const canSubmit = $derived(Boolean(context.recipient) && Number(context.amount) > 0);

  function editRecipient() {
    popToStep(RecipientStep, { context });
  }

  function editAmount() {
    popToStep(AmountStep, { context });
  }

  function submit() {
    if (!canSubmit) return;
    popupControls.close();
  }
</script>

<FlowStepScaffold step={3} total={3} title="Review" subtitle="Confirm the transfer." labels={['Recipient', 'Amount', 'Review']}>
  <div data-ui-initial-focus tabindex="-1">
    <StepReviewRow label="Recipient" value={context.recipient ? `${context.recipient.name} · ${context.recipient.address}` : 'Missing'} onChange={editRecipient} />
    <StepReviewRow label="Amount" value={context.amount ? `${context.amount} CRC` : 'Missing'} onChange={editAmount} className="review-gap" />
    {#if context.note}
      <StepReviewRow label="Note" value={context.note} className="review-gap" />
    {/if}
  </div>

  {#if !canSubmit}
    <StepAlert variant="warning" message="Recipient and amount are required before sending." />
  {/if}

  <div class="actions">
    <button type="button" class="primary gui-primary-action" data-ui-default-action onclick={submit} disabled={!canSubmit}>
      Send mock transfer
    </button>
  </div>
</FlowStepScaffold>

<style>
  :global(.review-gap) { margin-top:.75rem; }
  .actions { display:flex; justify-content:flex-end; }
  .primary { border:0; background:#2563eb; color:#fff; border-radius:.75rem; padding:.7rem 1rem; cursor:pointer; }
</style>
