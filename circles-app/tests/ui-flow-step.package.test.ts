// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import FlowStepFixture from './fixtures/FlowStepFixture.svelte';

describe('@garden-ui/flow-step', () => {
  it('renders scaffold/header extension classes and preserves review-row actions', async () => {
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

    unmount(component);
    target.remove();
  });
});