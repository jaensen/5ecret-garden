<script lang="ts">
  import { PopupHost as GardenPopupHost } from '@garden-ui/popup';
  import type { PopupContentDefinition } from '$lib/shared/state/popup';
  import { popupControls } from '$lib/shared/state/popup';
  import CloseConfirmStep from '$lib/shared/ui/shell/CloseConfirmStep.svelte';

  const CLOSE_CONFIRM_ID = '__close_confirm_step__';

  function createCloseConfirm(active: PopupContentDefinition): PopupContentDefinition {
    return {
      id: CLOSE_CONFIRM_ID,
      key: CLOSE_CONFIRM_ID,
      kind: 'confirm',
      dismiss: 'explicit',
      hideTitle: true,
      component: CloseConfirmStep,
      props: {
        message:
          active.confirmDiscardMessage ??
          String(active.meta?.confirmDiscardMessage ?? 'Do you really want to close the form?'),
        onYes: () => popupControls.close(),
        onNo: () => popupControls.back(),
      },
    };
  }
</script>

<GardenPopupHost
  closeConfirm={createCloseConfirm}
  defaultActionSelector="[data-popup-default-action]:not([disabled]), button.btn-primary:not([disabled]), button[type='submit']:not([disabled]), input[type='submit']:not([disabled]), [data-ui-default-action], .gui-primary-action"
  restorePageScroll={true}
  focusOptions={{
    initialInputSelectors: [
      '[data-ui-initial-input]',
      '[data-popup-initial-input]',
      '[data-send-step-initial-input]'
    ],
    initialFocusSelectors: [
      '[data-ui-initial-focus]',
      '[data-popup-initial-focus]',
      '[data-send-step-initial-focus]'
    ],
    closeControlSelector: '[data-popup-close-control], .gui-popup-title, #popup-title'
  }}
  dirtyTracking={{
    enabled: true,
    eventTypes: ['input', 'change'],
    trackSelector: 'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    ignoreSelector: '[data-popup-dirty-ignore="true"]',
    onlyWhenDismissExplicit: true
  }}
/>
