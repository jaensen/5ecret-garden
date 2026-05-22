export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function shouldAutoFocusTextInput(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const desktopWidth = window.matchMedia('(min-width: 768px)').matches;
  return hasFinePointer && canHover && desktopWidth;
}

export function focusElement(el: HTMLElement | null | undefined): void {
  if (!el) return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
}

export function getFocusableElements(scope: ParentNode | null): HTMLElement[] {
  if (!scope) return [];
  const all = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return all.filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.closest('[aria-hidden="true"], [inert]')) return false;
    return true;
  });
}

export function isKeyboardFocusableElement(el: HTMLElement | null): el is HTMLElement {
  if (!el) return false;
  if (!el.matches(FOCUSABLE_SELECTOR)) return false;
  if (el.hasAttribute('disabled')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  if (el.closest('[aria-hidden="true"], [inert]')) return false;
  return true;
}

export function isEditableElement(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const input = el as HTMLInputElement;
    const nonTextTypes = new Set([
      'button',
      'checkbox',
      'color',
      'file',
      'hidden',
      'image',
      'radio',
      'range',
      'reset',
      'submit'
    ]);
    return !nonTextTypes.has((input.type || '').toLowerCase());
  }
  return el.getAttribute('role') === 'textbox';
}

export function isEditableTarget(target: EventTarget | null, event?: KeyboardEvent): boolean {
  const path = event && typeof event.composedPath === 'function' ? event.composedPath() : [];
  for (const part of path) {
    if (part instanceof Element && isEditableElement(part)) return true;
  }

  let node: Element | null = target instanceof Element ? target : null;
  while (node) {
    if (isEditableElement(node)) return true;
    node = node.parentElement;
  }
  return false;
}
