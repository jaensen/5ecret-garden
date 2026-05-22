// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import RowFrameFixture from './fixtures/RowFrameFixture.svelte';

describe('@garden-ui/row', () => {
  it('renders row regions and state semantics', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(RowFrameFixture, { target, props: {} });
    await tick();

    const row = target.querySelector<HTMLElement>('[data-clickable-row]');
    expect(row).toBeTruthy();
    expect(row?.getAttribute('role')).toBe('button');
    expect(row?.getAttribute('tabindex')).toBe('0');
    expect(row?.getAttribute('aria-selected')).toBe('true');
    expect(row?.querySelector('[data-ui-row-leading]')?.textContent).toContain('👤');
    expect(row?.querySelector('[data-ui-row-title]')?.textContent).toContain('Alice Example');
    expect(row?.querySelector('[data-ui-row-subtitle]')?.textContent).toContain('Primary row subtitle');
    expect(row?.querySelector('[data-ui-row-meta]')?.textContent).toContain('Row metadata');
    expect(row?.querySelector('[data-ui-row-trailing]')?.textContent).toContain('CRC');

    const passive = target.querySelector<HTMLElement>('[data-passive-row]');
    expect(passive?.getAttribute('role')).toBe('group');
    expect(passive?.hasAttribute('tabindex')).toBe(false);
    expect(passive?.querySelector('[data-ui-row-leading]')).toBeFalsy();

    unmount(component);
    target.remove();
  });

  it('activates clickable rows with click, Enter, and Space but suppresses disabled activation', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const onActivate = vi.fn();
    const component = mount(RowFrameFixture, { target, props: { onActivate } });
    await tick();

    const row = target.querySelector<HTMLElement>('[data-clickable-row]');
    const disabled = target.querySelector<HTMLElement>('[data-disabled-row]');
    expect(row).toBeTruthy();
    expect(disabled).toBeTruthy();

    row!.click();
    row!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    row!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    disabled!.click();
    disabled!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    expect(onActivate).toHaveBeenCalledTimes(3);
    expect(disabled?.getAttribute('aria-disabled')).toBe('true');
    expect(disabled?.hasAttribute('tabindex')).toBe(false);

    unmount(component);
    target.remove();
  });

  it('does not double-activate when nested trailing actions handle their own click or keydown', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const onActivate = vi.fn();
    const component = mount(RowFrameFixture, { target, props: { onActivate } });
    await tick();

    const trailing = target.querySelector<HTMLButtonElement>('[data-trailing-action]');
    expect(trailing).toBeTruthy();

    trailing!.click();
    trailing!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    expect(onActivate).toHaveBeenCalledTimes(1);

    unmount(component);
    target.remove();
  });
});