import { openFlowPopup } from '@garden-ui/popup-runtime';
import RecipientStep from './RecipientStep.svelte';
import { createMockSendFlowContext } from './mockSendFlowContext';

export function openMockSendFlow(): void {
  openFlowPopup({
    title: 'Mock send flow',
    component: RecipientStep,
    props: { context: createMockSendFlowContext() }
  });
}
