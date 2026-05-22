// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import FlowStepFixture from './fixtures/FlowStepFixture.svelte';

describe('@garden-ui/flow-step', () => {
  it('renders scaffold/header extension classes and preserves flow-step composition actions', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(FlowStepFixture, { target });
    await tick();

    const scaffold = target.querySelector<HTMLElement>('[data-fixture-scaffold]');
    expect(scaffold).toBeTruthy();
    expect(scaffold?.classList.contains('fixture-scaffold')).toBe(true);
    expect(scaffold?.hasAttribute('data-ui-initial-focus')).toBe(true);

    expect(target.querySelector('.fixture-header')).toBeTruthy();
    expect(target.querySelectorAll('.fixture-segment-active')).toHaveLength(2);
    expect(target.querySelectorAll('.fixture-segment-inactive')).toHaveLength(1);
    expect(target.querySelector('.fixture-label-active')?.textContent).toBe('Two');

    const alert = target.querySelector<HTMLElement>('.fixture-alert');
    expect(alert).toBeTruthy();
    expect(alert?.classList.contains('gui-step-alert')).toBe(false);
    expect(alert?.getAttribute('role')).toBe('status');
    expect(target.querySelector('.fixture-alert-title')?.textContent).toBe('Needs attention');

    const reviewButton = target.querySelector<HTMLButtonElement>('.fixture-review-button');
    expect(reviewButton).toBeTruthy();
    expect(target.querySelector('[data-changed]')?.getAttribute('data-changed')).toBe('no');
    reviewButton!.click();
    await tick();
    expect(target.querySelector('[data-changed]')?.getAttribute('data-changed')).toBe('yes');

    const section = target.querySelector<HTMLElement>('.fixture-section');
    expect(section).toBeTruthy();
    expect(target.querySelector('.fixture-section-header')).toBeTruthy();
    expect(target.querySelector('.fixture-section-body')?.textContent).toBe('Section body');

    const actionBar = target.querySelector<HTMLElement>('.fixture-action-bar');
    expect(actionBar).toBeTruthy();
    expect(actionBar?.className).toContain('justify-between');

    expect(target.querySelector('[data-primary]')?.getAttribute('data-primary')).toBe('no');
    expect(target.querySelector('[data-secondary]')?.getAttribute('data-secondary')).toBe('no');

    target.querySelector<HTMLButtonElement>('.fixture-action-primary')!.click();
    await tick();
    expect(target.querySelector('[data-primary]')?.getAttribute('data-primary')).toBe('yes');

    const allButtons = Array.from(target.querySelectorAll<HTMLButtonElement>('button'));
    const packageSecondary = allButtons.find((button) => button.textContent?.trim() === 'Cancel');
    expect(packageSecondary).toBeTruthy();
    packageSecondary!.click();
    await tick();
    expect(target.querySelector('[data-secondary]')?.getAttribute('data-secondary')).toBe('yes');

    const packagePrimary = allButtons.find((button) => button.textContent?.trim() === 'Save');
    expect(packagePrimary?.hasAttribute('data-popup-default-action')).toBe(true);

    unmount(component);
    target.remove();
  });
});