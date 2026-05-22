export interface ListInputArrowDownOptions {
  getScope?: () => ParentNode | null | undefined;
  rowSelector: string;
}

export interface KeyboardListNavigatorOptions {
  getRows: (anchor?: HTMLElement | null) => HTMLElement[];
  focusInput: (anchor?: HTMLElement | null) => void;
  onActivateRow?: (row: HTMLElement) => void;
}

export function focusActiveTabAbove(source: HTMLElement | null): boolean {
  if (!source || typeof document === 'undefined') return false;

  const tablists = Array.from(document.querySelectorAll<HTMLElement>('[role="tablist"]'));
  let nearestAbove: HTMLElement | null = null;
  for (const tablist of tablists) {
    if (tablist === source || tablist.contains(source)) continue;
    if (tablist.getClientRects().length === 0) continue;
    const pos = tablist.compareDocumentPosition(source);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) nearestAbove = tablist;
  }

  if (!nearestAbove) return false;

  const activeTab =
    nearestAbove.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]:not([disabled])')
    ?? nearestAbove.querySelector<HTMLElement>('[role="tab"][tabindex="0"]:not([disabled])');

  if (!activeTab) return false;
  activeTab.focus();
  return true;
}

export function createListInputArrowDownHandler(options: ListInputArrowDownOptions) {
  return function onInputArrowDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      if (focusActiveTabAbove(event.currentTarget as HTMLElement | null)) {
        event.preventDefault();
      }
      return;
    }

    if (event.key !== 'ArrowDown') return;
    const scoped = options.getScope?.() ?? null;
    const firstRow = scoped?.querySelector<HTMLElement>(options.rowSelector)
      ?? (typeof document !== 'undefined' ? document.querySelector<HTMLElement>(options.rowSelector) : null);
    if (!firstRow) return;
    event.preventDefault();
    firstRow.focus();
  };
}

export function createKeyboardListNavigator(options: KeyboardListNavigatorOptions) {
  function focusFirstRow(): void {
    options.getRows(null)[0]?.focus();
  }

  function onInputArrowDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      if (focusActiveTabAbove(event.currentTarget as HTMLElement | null)) {
        event.preventDefault();
      }
      return;
    }
    if (event.key !== 'ArrowDown') return;
    const rows = options.getRows(event.currentTarget as HTMLElement | null);
    if (rows.length === 0) return;
    event.preventDefault();
    rows[0]?.focus();
  }

  function onRowKeydown(event: KeyboardEvent): void {
    const current = event.currentTarget as HTMLElement | null;
    if (!current) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      options.focusInput(current);
      return;
    }

    const target = event.target as HTMLElement | null;
    const isNestedTarget = !!target && target !== current;

    if (event.key === 'Enter' || event.key === ' ') {
      if (isNestedTarget) return;
      if (!options.onActivateRow) return;
      event.preventDefault();
      options.onActivateRow(current);
      return;
    }

    if (event.key === 'ArrowLeft') {
      const rows = options.getRows(current);
      if (rows.length === 0) return;
      event.preventDefault();
      rows[0]?.focus();
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const rows = options.getRows(current);
    const index = rows.indexOf(current);
    if (index === -1) return;
    event.preventDefault();
    if (event.key === 'ArrowUp' && index === 0) {
      options.focusInput(current);
      return;
    }
    const nextIndex = event.key === 'ArrowDown' ? index + 1 : index - 1;
    if (nextIndex < 0 || nextIndex >= rows.length) return;
    rows[nextIndex]?.focus();
  }

  function onRowClick(event: MouseEvent): void {
    const current = event.currentTarget as HTMLElement | null;
    current?.focus();
  }

  return { focusFirstRow, onInputArrowDown, onRowKeydown, onRowClick };
}
