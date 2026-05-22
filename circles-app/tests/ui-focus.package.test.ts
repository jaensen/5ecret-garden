// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { focusElement, isEditableElement, isEditableTarget, shouldAutoFocusTextInput } from '../../packages/ui-focus/src/index';

describe('@garden-ui/focus', () => {
  it('focuses an element safely', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    focusElement(button);
    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it('detects editable elements', () => {
    const input = document.createElement('input');
    const div = document.createElement('div');
    expect(isEditableElement(input)).toBe(true);
    expect(isEditableElement(div)).toBe(false);
  });

  it('detects editable targets through target walking', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    expect(isEditableTarget(input)).toBe(true);
    input.remove();
  });

  it('returns false for auto-focus policy without matchMedia support', () => {
    const original = window.matchMedia;
    // @ts-expect-error test override
    window.matchMedia = undefined;
    expect(shouldAutoFocusTextInput()).toBe(false);
    window.matchMedia = original;
  });
});
