import {
  configurePopupRuntime,
  initPopupHistorySync,
  isCurrentFlowDirty,
  markCurrentDirty,
  markCurrentPristine,
  openFlowPopup,
  popupControls,
  popupHistoryForwardNoopTick,
  popupState,
  resetPopupRuntimeConfiguration,
  resolvePopupDismiss,
  syncPopupHistoryToCurrentDepth,
  type PopupContentDefinition as GardenPopupContentDefinition,
  type PopupState,
} from '@garden-ui/popup-runtime';

export type PopupContentDefinition = GardenPopupContentDefinition & {
  confirmDiscardMessage?: string;
};

configurePopupRuntime({ historyStateKey: '__circlesPopupHistory' });

export {
  configurePopupRuntime,
  initPopupHistorySync,
  isCurrentFlowDirty,
  markCurrentDirty,
  markCurrentPristine,
  openFlowPopup,
  popupControls,
  popupHistoryForwardNoopTick,
  popupState,
  resetPopupRuntimeConfiguration,
  resolvePopupDismiss,
  syncPopupHistoryToCurrentDepth,
  type PopupState,
};
