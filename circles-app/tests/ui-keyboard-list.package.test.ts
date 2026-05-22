// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createKeyboardListNavigator, createListInputArrowDownHandler } from '../../packages/ui-keyboard-list/src/index';

describe('@garden-ui/keyboard-list', () => {
  it('ArrowDown on input focuses first row', () => {
    const scope = document.createElement('div');
    const input = document.createElement('input');
    const row = document.createElement('button');
    row.setAttribute('data-row', 'true');
    scope.append(input, row);
    document.body.appendChild(scope);

    const handler = createListInputArrowDownHandler({
      getScope: () => scope,
      rowSelector: '[data-row]'
    });

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    input.addEventListener('keydown', handler as EventListener);
    input.dispatchEvent(event);
    expect(document.activeElement).toBe(row);
    scope.remove();
  });

  it('Escape on row returns focus to input and stops propagation', () => {
    const input = document.createElement('input');
    const row = document.createElement('button');
    document.body.append(input, row);

    const focusInput = vi.fn(() => input.focus());
    const navigator = createKeyboardListNavigator({
      getRows: () => [row],
      focusInput,
      onActivateRow: vi.fn()
    });

    row.focus();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    row.addEventListener('keydown', navigator.onRowKeydown as EventListener);
    row.dispatchEvent(event);
    expect(focusInput).toHaveBeenCalled();
    expect(document.activeElement).toBe(input);

    input.remove();
    row.remove();
  });
});
