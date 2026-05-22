// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import TabsKeyboardFixture from './fixtures/TabsKeyboardFixture.svelte';
import TabsDisabledFirstFixture from './fixtures/TabsDisabledFirstFixture.svelte';

describe('@garden-ui/tabs', () => {
  it('supports arrow navigation and skips disabled tabs', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(TabsKeyboardFixture, { target });
    await tick();

    const alpha = document.getElementById('tabs-fixture-primary-tab-alpha') as HTMLButtonElement | null;
    expect(alpha).toBeTruthy();
    const tablist = target.querySelector('[role="tablist"]') as HTMLElement | null;
    expect(tablist).toBeTruthy();
    alpha!.focus();
    alpha!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await tick();
    await Promise.resolve();

    const beta = document.getElementById('tabs-fixture-primary-tab-beta') as HTMLButtonElement | null;
    expect(document.activeElement).toBe(beta);
    expect(beta?.getAttribute('aria-selected')).toBe('true');

    beta!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    await tick();
    await Promise.resolve();
    expect(document.activeElement).toBe(beta);

    unmount(component);
    target.remove();
  });

  it('ArrowDown moves focus into the active panel', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(TabsKeyboardFixture, { target });
    await tick();

    const alpha = document.getElementById('tabs-fixture-primary-tab-alpha') as HTMLButtonElement | null;
    expect(alpha).toBeTruthy();
    alpha!.focus();
    alpha!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await tick();
    await Promise.resolve();

    expect(document.activeElement).toBe(target.querySelector('[data-panel-button]'));

    unmount(component);
    target.remove();
  });

  it('auto-selects the first enabled tab and keeps disabled panel content out of ArrowDown focus', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(TabsDisabledFirstFixture, { target });
    await tick();
    await Promise.resolve();

    const enabled = document.getElementById('tabs-disabled-first-tab-enabled') as HTMLButtonElement | null;
    expect(enabled).toBeTruthy();
    expect(enabled?.getAttribute('aria-selected')).toBe('true');
    expect(target.querySelector('[data-selected-value]')?.textContent).toContain('enabled');

    enabled!.focus();
    enabled!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await tick();
    await Promise.resolve();

    expect(document.activeElement).toBe(target.querySelector('[data-enabled-panel-action]'));
    expect(document.activeElement).not.toBe(target.querySelector('[data-disabled-panel-action]'));

    unmount(component);
    target.remove();
  });
});
