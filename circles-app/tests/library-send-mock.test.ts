// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import LibrarySendMockPage from '../src/routes/kitchen-sink/library-send-mock/+page.svelte';
import { popupState } from '../../packages/ui-popup-runtime/src/index';

async function flushUi(times = 2) {
  for (let i = 0; i < times; i += 1) {
    await tick();
    await Promise.resolve();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

function topPopupPage(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.gui-popup-page.is-top');
}

describe('library send-flow mock', () => {
  beforeEach(() => {
    popupState.set({ content: null, stack: [] });
    document.body.innerHTML = '';
  });

  it('opens the mock send flow and supports keyboard-friendly progression', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    const component = mount(LibrarySendMockPage, { target });
    const launch = target.querySelector<HTMLButtonElement>('[data-open-mock-send]');
    expect(launch).toBeTruthy();
    launch?.click();
    await flushUi();

    const recipientInput = document.querySelector<HTMLInputElement>('[data-mock-recipient-input]');
    expect(recipientInput).toBeTruthy();
    const recipientRow = document.querySelector<HTMLButtonElement>('[data-recipient-id="alice"]');
    expect(recipientRow).toBeTruthy();
    recipientRow!.click();
    await flushUi();

    const amountInput = document.querySelector<HTMLInputElement>('[data-mock-send-amount-input]');
    expect(amountInput).toBeTruthy();
    amountInput!.value = '12';
    amountInput!.dispatchEvent(new Event('input', { bubbles: true }));
    amountInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await flushUi();

    const reviewButton = document.querySelector<HTMLButtonElement>('[data-ui-default-action]');
    expect(reviewButton).toBeTruthy();
    reviewButton!.click();
    await flushUi();
    expect(document.querySelector('.gui-popup-shell')).toBeTruthy();

    unmount(component);
    target.remove();
  });

  it('supports popup header back through the mock send flow stack', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    const component = mount(LibrarySendMockPage, { target });
    target.querySelector<HTMLButtonElement>('[data-open-mock-send]')?.click();
    await flushUi();

    document.querySelector<HTMLButtonElement>('[data-recipient-id="alice"]')?.click();
    await flushUi();
    expect(topPopupPage()?.querySelector('[data-mock-send-amount-input]')).toBeTruthy();

    document.querySelector<HTMLButtonElement>('[data-popup-close-control]')?.click();
    await flushUi();

    expect(topPopupPage()?.querySelector('[data-mock-recipient-input]')).toBeTruthy();
    expect(topPopupPage()?.querySelector('[data-mock-send-amount-input]')).toBeFalsy();

    unmount(component);
    target.remove();
  });

  it('supports browser history back through the mock send flow stack', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    const component = mount(LibrarySendMockPage, { target });
    target.querySelector<HTMLButtonElement>('[data-open-mock-send]')?.click();
    await flushUi();

    document.querySelector<HTMLButtonElement>('[data-recipient-id="alice"]')?.click();
    await flushUi();
    expect(topPopupPage()?.querySelector('[data-mock-send-amount-input]')).toBeTruthy();

    history.back();
    await flushUi(4);

    expect(topPopupPage()?.querySelector('[data-mock-recipient-input]')).toBeTruthy();
    expect(topPopupPage()?.querySelector('[data-mock-send-amount-input]')).toBeFalsy();

    unmount(component);
    target.remove();
  });

  it('Backspace at empty amount returns to recipient input', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibrarySendMockPage, { target });
    target.querySelector<HTMLButtonElement>('[data-open-mock-send]')?.click();
    await flushUi();

    const recipientInput = document.querySelector<HTMLInputElement>('[data-mock-recipient-input]');
    expect(recipientInput).toBeTruthy();
    const recipientRow = document.querySelector<HTMLButtonElement>('[data-recipient-id="bob"]');
    expect(recipientRow).toBeTruthy();
    recipientRow!.click();
    await flushUi();

    const amountInput = document.querySelector<HTMLInputElement>('[data-mock-send-amount-input]');
    expect(amountInput).toBeTruthy();
    amountInput!.focus();
    amountInput!.value = '';
    amountInput!.setSelectionRange?.(0, 0);
    amountInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    await flushUi();

    expect(document.activeElement).toBe(document.querySelector('[data-mock-recipient-input]'));

    unmount(component);
    target.remove();
  });
});
