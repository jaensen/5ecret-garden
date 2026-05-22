// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import AvatarDisplayFixture from './fixtures/AvatarDisplayFixture.svelte';

describe('@garden-ui/avatar', () => {
  it('renders avatar display layouts, placeholder states, and activation hooks', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(AvatarDisplayFixture, { target });
    await tick();

    expect(target.textContent).toContain('Alice');
    expect(target.textContent).toContain('Top');
    expect(target.textContent).toContain('Human • Bottom');
    expect(target.querySelector('[data-avatar-description]')?.textContent).toBe('PROFILE DESCRIPTION');

    const buttons = target.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    (buttons[0] as HTMLButtonElement).click();
    await tick();
    expect(target.querySelector('[data-activated]')?.getAttribute('data-activated')).toBe('1');

    expect(target.querySelectorAll('.avatar-skeleton').length).toBeGreaterThan(0);

    unmount(component);
    target.remove();
  });
});