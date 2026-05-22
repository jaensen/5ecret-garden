import { popupControls } from '@garden-ui/popup-runtime';

export function openStep(component: any, props: Record<string, unknown>) {
  popupControls.open({
    title: 'Mock send flow',
    kind: 'flow',
    dismiss: 'explicit',
    component,
    props
  });
}

export function popToStep(component: any, props: Record<string, unknown>) {
  const found = popupControls.popTo((entry) => entry.component === component);
  if (!found) {
    openStep(component, props);
  }
}
