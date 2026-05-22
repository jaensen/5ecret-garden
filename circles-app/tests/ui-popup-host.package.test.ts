// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { PopupHost } from '@garden-ui/popup';
import { popupControls, popupState } from '../../packages/ui-popup-runtime/src/index';
import PopupHostDefaultActionFixture from './fixtures/PopupHostDefaultActionFixture.svelte';
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
});