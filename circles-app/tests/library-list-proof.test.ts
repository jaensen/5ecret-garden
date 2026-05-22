// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import LibraryListProofPage from '../src/routes/kitchen-sink/library-list-proof/+page.svelte';

async function flushUi(times = 2) {
  for (let i = 0; i < times; i += 1) {
    await tick();
    await Promise.resolve();
  }
}

async function waitUntil(predicate: () => boolean, attempts = 5_000) {
  for (let i = 0; i < attempts; i += 1) {
    await tick();
    await Promise.resolve();
    if (predicate()) return;
  }
}

describe('library list proof', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the 10k dataset summary and renders only a bounded number of rows initially', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryListProofPage, { target });
    await flushUi();

    expect(target.textContent).toContain('10,000');
    expect(target.textContent).toContain('Visible items: 20');
    const rows = target.querySelectorAll('[data-library-list-proof-row]');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(1000);

    unmount(component);
    target.remove();
  });

  it('supports ArrowDown from search input into the first row', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryListProofPage, { target });
    await flushUi();

    const input = target.querySelector<HTMLInputElement>('[data-library-list-proof-input]');
    expect(input).toBeTruthy();
    input!.focus();
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await flushUi();

    const firstRow = target.querySelector<HTMLElement>('[data-library-list-proof-row]');
    expect(document.activeElement).toBe(firstRow);

    unmount(component);
    target.remove();
  });

  it('updates the rendered rows live when the search query changes', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryListProofPage, { target });
    await flushUi(3);

    const input = target.querySelector<HTMLInputElement>('[data-library-list-proof-input]');
    expect(input).toBeTruthy();
    expect(target.querySelector('[data-library-list-proof-row]')?.textContent).toContain('Generated item 1');

    input!.value = 'Generated item 20';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushUi(3);

    expect(target.textContent).toContain('Filtered total:');
    expect(target.querySelector('[data-library-list-proof-row]')?.textContent).toContain('Generated item 20');
    expect(target.querySelector('[data-library-list-proof-row]')?.textContent).not.toContain('Generated item 1');

    unmount(component);
    target.remove();
  });

  it('supports switching source modes and reacting to store updates', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryListProofPage, { target });
    await flushUi();

    const storeTab = document.getElementById('library-list-proof-source-tabs-tab-store') as HTMLButtonElement | null;
    expect(storeTab).toBeTruthy();
    storeTab!.click();
    await flushUi(3);

    const addButton = target.querySelector<HTMLButtonElement>('[data-library-list-proof-add-store-item]');
    expect(addButton).toBeTruthy();
    addButton!.click();
    await flushUi(3);

    expect(target.textContent).toContain('Source mode: store');
    expect(target.textContent).toContain('Filtered total: 10,001');
    expect(target.querySelector('[data-library-list-proof-row]')?.textContent).toContain('Injected store item');

    unmount(component);
    target.remove();
  });

  it('supports the paged source mode', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryListProofPage, { target });
    await flushUi();

    const pagedTab = document.getElementById('library-list-proof-source-tabs-tab-paged') as HTMLButtonElement | null;
    expect(pagedTab).toBeTruthy();
    pagedTab!.click();
    await flushUi(4);

    expect(target.textContent).toContain('Source mode: paged');
    const rows = target.querySelectorAll('[data-library-list-proof-row]');
    expect(rows.length).toBeGreaterThan(0);

    unmount(component);
    target.remove();
  });

  it('eventually reaches the end state in paged mode', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LibraryListProofPage, { target });
    await flushUi();

    const pagedTab = document.getElementById('library-list-proof-source-tabs-tab-paged') as HTMLButtonElement | null;
    expect(pagedTab).toBeTruthy();
    pagedTab!.click();
    await flushUi(4);

    const loadAll = target.querySelector<HTMLButtonElement>('[data-library-list-proof-load-all]');
    expect(loadAll).toBeTruthy();
    loadAll!.click();
    await waitUntil(() => Boolean(target.querySelector('[data-library-list-proof-ended="true"]')));

    expect(target.querySelector('[data-library-list-proof-ended="true"]'), target.textContent ?? '').toBeTruthy();
    expect(target.textContent).toContain('Ended: yes');

    unmount(component);
    target.remove();
  });
});
