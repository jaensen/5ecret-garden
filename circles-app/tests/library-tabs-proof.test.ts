// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import LibraryTabsProofPage from '../src/routes/kitchen-sink/library-tabs-proof/+page.svelte';

async function flushUi(times = 2) {
  for (let i = 0; i < times; i += 1) {
    await tick();
    await Promise.resolve();
  }
}

describe('library tabs proof', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('switches tabs with ArrowRight and skips disabled tabs', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryTabsProofPage, { target });
    await flushUi();

    const overview = document.getElementById('library-tabs-proof-main-tab-overview') as HTMLButtonElement | null;
    const activity = document.getElementById('library-tabs-proof-main-tab-activity') as HTMLButtonElement | null;
    expect(overview).toBeTruthy();
    expect(activity).toBeTruthy();

    overview!.focus();
    overview!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await flushUi();

    expect(document.activeElement).toBe(activity);
    expect(activity!.getAttribute('aria-selected')).toBe('true');

    activity!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    await flushUi();

    expect(document.activeElement).toBe(activity);

    unmount(component);
    target.remove();
  });

  it('moves focus into the panel with ArrowDown', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryTabsProofPage, { target });
    await flushUi();

    const overview = document.getElementById('library-tabs-proof-main-tab-overview') as HTMLButtonElement | null;
    const panelAction = target.querySelector('[data-main-panel-action]') as HTMLButtonElement | null;
    expect(overview).toBeTruthy();
    expect(panelAction).toBeTruthy();

    overview!.focus();
    overview!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await flushUi();

    expect(document.activeElement).toBe(panelAction);

    unmount(component);
    target.remove();
  });

  it('demonstrates many horizontally scrollable tabs and can select a far tab', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryTabsProofPage, { target });
    await flushUi();

    const tablist = document.getElementById('library-tabs-proof-many') as HTMLElement | null;
    expect(tablist).toBeTruthy();
    expect(tablist?.classList.contains('many-tabs-scroller')).toBe(true);

    const manyTabs = target.querySelectorAll('#library-tabs-proof-many [role="tab"]');
    expect(manyTabs.length).toBe(18);

    const farTab = document.getElementById('library-tabs-proof-many-tab-tab-18') as HTMLButtonElement | null;
    expect(farTab).toBeTruthy();
    farTab!.click();
    await flushUi();

    expect(farTab?.getAttribute('aria-selected')).toBe('true');
    expect(target.querySelector('[data-many-tabs-selected]')?.textContent).toContain('tab-18');
    expect(target.querySelector('[data-many-tabs-panel="tab-18"]')?.hasAttribute('hidden')).toBe(false);

    unmount(component);
    target.remove();
  });
});
