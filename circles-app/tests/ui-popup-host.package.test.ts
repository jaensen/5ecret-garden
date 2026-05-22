// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { PopupHost } from '@garden-ui/popup';
import { popupControls, popupState } from '../../packages/ui-popup-runtime/src/index';
import PopupHostAliasDirtyFixture from './fixtures/PopupHostAliasDirtyFixture.svelte';
import PopupHostDefaultActionFixture from './fixtures/PopupHostDefaultActionFixture.svelte';
import PopupHostScrollFixture from './fixtures/PopupHostScrollFixture.svelte';
import PopupHostTrapFixture from './fixtures/PopupHostTrapFixture.svelte';

describe('@garden-ui/popup', () => {
  afterEach(() => {
    popupState.set({ content: null, stack: [] });
    document.body.innerHTML = '';
  });

  it('invokes default action on Enter when focus is on a non-interactive target', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PopupHost, { target, props: {} });
    const onDefaultAction = vi.fn();

    popupControls.open({
      title: 'Default action test',
      component: PopupHostDefaultActionFixture,
      props: { onDefaultAction }
    });
    await tick();
    await Promise.resolve();

    const staticFocus = document.querySelector<HTMLElement>('[data-popup-static-focus]');
    expect(staticFocus).toBeTruthy();
    staticFocus!.focus();
    staticFocus!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();

    expect(onDefaultAction).toHaveBeenCalledTimes(1);

    unmount(component);
    target.remove();
  });

  it('traps focus with Tab inside the popup', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PopupHost, { target, props: {} });

    popupControls.open({
      title: 'Trap test',
      component: PopupHostTrapFixture,
      props: {}
    });
    await tick();
    await Promise.resolve();

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.gui-popup button'));
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    const firstFocusable = buttons[0];
    const lastFocusable = buttons[buttons.length - 1];
    lastFocusable.focus();
    lastFocusable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    await tick();

    expect(document.activeElement).toBe(firstFocusable);

    unmount(component);
    target.remove();
  });

  it('Escape closes a backdrop-dismiss popup', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PopupHost, { target, props: {} });

    popupControls.open({
      title: 'Dismiss me',
      kind: 'inspect',
      dismiss: 'backdrop',
      component: PopupHostTrapFixture,
      props: {}
    });
    await tick();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();

    expect(document.querySelector('.gui-popup-shell--open')).toBeFalsy();

    unmount(component);
    target.remove();
  });

  it('supports custom initial focus selectors and opt-in dirty tracking', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PopupHost, {
      target,
      props: {
        focusOptions: { initialFocusSelectors: ['[data-legacy-initial-input]'] },
        dirtyTracking: {
          enabled: true,
          ignoreSelector: '[data-ignore-dirty="true"]',
        },
      },
    });

    popupControls.open({
      title: 'Dirty test',
      kind: 'flow',
      dismiss: 'explicit',
      component: PopupHostAliasDirtyFixture,
      props: {},
    });
    await tick();
    await Promise.resolve();

    const input = document.querySelector<HTMLInputElement>('[data-testid="legacy-input"]');
    expect(document.activeElement).toBe(input);
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    expect(popupStateSnapshot().content?.isDirty).toBe(true);

    unmount(component);
    target.remove();
  });

  it('can inject close confirmation from active popup metadata', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PopupHost, {
      target,
      props: {
        closeConfirm: (active: any) => ({
          id: 'confirm-close',
          title: String(active.meta?.confirmDiscardMessage ?? 'Confirm close'),
          kind: 'confirm',
          dismiss: 'explicit',
          component: PopupHostTrapFixture,
          props: {},
        }),
      },
    });

    popupControls.open({
      title: 'Dirty flow',
      kind: 'flow',
      dismiss: 'confirmIfDirty',
      isDirty: true,
      meta: { confirmDiscardMessage: 'Discard custom text?' },
      component: PopupHostTrapFixture,
      props: {},
    });
    await tick();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();

    expect(popupStateSnapshot().content?.id).toBe('confirm-close');
    expect(popupStateSnapshot().content?.title).toBe('Discard custom text?');

    unmount(component);
    target.remove();
  });

  it('restores scroll position for stacked popup pages', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PopupHost, { target, props: { restorePageScroll: true } });

    popupControls.open({ id: 'first', title: 'First', component: PopupHostScrollFixture, props: {} });
    await tick();
    await Promise.resolve();
    const popup = document.querySelector<HTMLDivElement>('.gui-popup')!;
    popup.scrollTop = 140;
    popup.dispatchEvent(new Event('scroll'));

    popupControls.open({ id: 'second', title: 'Second', component: PopupHostTrapFixture, props: {} });
    await tick();
    popup.scrollTop = 0;
    popupControls.back();
    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(popup.scrollTop).toBe(140);

    unmount(component);
    target.remove();
  });
});

function popupStateSnapshot() {
  let snapshot: any;
  const unsubscribe = popupState.subscribe((value) => (snapshot = value));
  unsubscribe();
  return snapshot;
}