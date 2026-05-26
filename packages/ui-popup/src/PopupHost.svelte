<script lang="ts">
  import {
    getFocusableElements,
    focusElement,
    isEditableTarget,
    isKeyboardFocusableElement,
    shouldAutoFocusTextInput
  } from '@garden-ui/focus';
  import {
    popupControls,
    popupState,
    resolvePopupDismiss,
    isCurrentFlowDirty,
    type PopupContentDefinition
  } from '@garden-ui/popup-runtime';

  export type PopupFocusOptions = {
    initialInputSelectors?: string[];
    initialFocusSelectors?: string[];
    closeControlSelector?: string;
  };

  export type PopupDirtyTrackingOptions = {
    enabled?: boolean;
    eventTypes?: Array<'input' | 'change'>;
    trackSelector?: string;
    ignoreSelector?: string;
    onlyWhenDismissExplicit?: boolean;
  };

  interface Props {
    closeConfirm?: PopupContentDefinition | ((active: PopupContentDefinition) => PopupContentDefinition | null) | null;
    defaultActionSelector?: string;
    enableEnterDefaultAction?: boolean;
    restorePageScroll?: boolean;
    focusOptions?: PopupFocusOptions;
    dirtyTracking?: PopupDirtyTrackingOptions | false;
  }

  let {
    closeConfirm = null,
    defaultActionSelector = '[data-ui-default-action], button[type="submit"], .gui-primary-action',
    enableEnterDefaultAction = true,
    restorePageScroll = true,
    focusOptions = {},
    dirtyTracking = false
  }: Props = $props();

  let popupEl: HTMLDivElement | null = $state(null);
  let popupInnerEl: HTMLDivElement | null = $state(null);
  let previouslyFocusedEl: HTMLElement | null = null;
  let wasOpen = false;
  let lastTopPageKey = '';
  let lastScrollPageKey = '';
  const pageScrollTops = new Map<string, number>();
  let preservedWindowScrollTop = 0;

  function currentWindowScrollTop(): number {
    if (typeof window === 'undefined') return 0;
    return window.scrollY ?? window.pageYOffset ?? document.documentElement?.scrollTop ?? document.body?.scrollTop ?? 0;
  }

  function restoreWindowScroll(top: number): void {
    if (typeof window === 'undefined') return;
    window.scrollTo(0, top);
  }

  const initialInputSelectors = $derived(focusOptions.initialInputSelectors ?? ['[data-ui-initial-input]']);
  const initialFocusSelectors = $derived(focusOptions.initialFocusSelectors ?? ['[data-ui-initial-focus]']);
  const closeControlSelector = $derived(focusOptions.closeControlSelector ?? '[data-popup-close-control], .gui-popup-title');

  function queryFirst(scope: ParentNode | null, selectors: string[]): HTMLElement | null {
    if (!scope) return null;
    for (const selector of selectors) {
      const match = scope.querySelector<HTMLElement>(selector);
      if (match) return match;
    }
    return null;
  }

  function queryAll(scope: ParentNode | null, selectors: string[]): HTMLElement[] {
    if (!scope) return [];
    return selectors.flatMap((selector) => Array.from(scope.querySelectorAll<HTMLElement>(selector)));
  }

  function findTopPage(): HTMLElement | null {
    return popupEl?.querySelector<HTMLElement>('.gui-popup-page.is-top') ?? null;
  }

  function findDefaultAction(scope: ParentNode | null): HTMLElement | null {
    if (!scope) return null;
    const match = scope.querySelector<HTMLElement>(defaultActionSelector);
    return isKeyboardFocusableElement(match) ? match : null;
  }

  function resolveCloseConfirm(active: PopupContentDefinition): PopupContentDefinition | null {
    if (typeof closeConfirm === 'function') return closeConfirm(active);
    return closeConfirm;
  }

  function isCloseConfirmOpen(): boolean {
    if (!closeConfirm) return false;
    const active = $popupState.content;
    if (!active) return false;
    const confirm = typeof closeConfirm === 'function' ? closeConfirm(active) : closeConfirm;
    if (!confirm) return false;
    return active.id != null && confirm.id != null && active.id === confirm.id;
  }

  function pushCloseConfirmStep(active: PopupContentDefinition): void {
    const confirm = resolveCloseConfirm(active);
    if (!confirm) return;
    if ($popupState.content?.id === confirm.id) return;
    popupControls.open(confirm);
  }

  function attemptClose(source: 'backdrop' | 'escape' | 'header'): void {
    const content = $popupState.content;
    if (!content) return;
    if (isCloseConfirmOpen()) {
      if (source === 'backdrop' || source === 'escape') popupControls.back();
      return;
    }
    const dismiss = resolvePopupDismiss(content);
    const flowDirty = isCurrentFlowDirty($popupState);
    if (dismiss === 'explicit' && (source === 'backdrop' || source === 'escape')) {
      if (flowDirty && resolveCloseConfirm(content)) pushCloseConfirmStep(content);
      else popupControls.close();
      return;
    }
    if (dismiss === 'confirmIfDirty' && flowDirty && resolveCloseConfirm(content)) {
      pushCloseConfirmStep(content);
      return;
    }
    popupControls.close();
  }

  function isInteractiveActivationTarget(el: HTMLElement | null): boolean {
    if (!el) return false;
    if (isEditableTarget(el, undefined)) return true;
    const interactive = el.closest<HTMLElement>('button, a[href], [role="button"], [role="link"]');
    if (!interactive) return false;
    if (interactive.hasAttribute('disabled')) return false;
    if (interactive.getAttribute('aria-disabled') === 'true') return false;
    return true;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!$popupState.content) return;
    if (e.key === 'Tab') {
      const focusables = getFocusableElements(popupEl);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first || !popupEl?.contains(active)) {
          e.preventDefault();
          focusElement(last);
        }
      } else if (!active || active === last || !popupEl?.contains(active)) {
        e.preventDefault();
        focusElement(first);
      }
      return;
    }
    if (e.key === 'Escape') {
      attemptClose('escape');
      return;
    }
    if (enableEnterDefaultAction && e.key === 'Enter') {
      if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
      if (isEditableTarget(e.target, e)) return;
      const topPage = findTopPage();
      if (!topPage) return;
      const active = document.activeElement as HTMLElement | null;
      if (!active || !topPage.contains(active)) return;
      if (isInteractiveActivationTarget(active)) return;
      const defaultAction = findDefaultAction(topPage);
      if (!defaultAction) return;
      e.preventDefault();
      defaultAction.click();
      return;
    }
    if (e.key === 'Backspace') {
      if (isEditableTarget(e.target, e)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if ($popupState.stack.length > 0) {
        e.preventDefault();
        popupControls.back();
      }
    }
  }

  function onClose() {
    if ($popupState.stack.length > 0) popupControls.back();
    else attemptClose('header');
  }

  $effect(() => {
    const isOpen = Boolean($popupState.content);
    if (isOpen && !wasOpen) {
      previouslyFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      preservedWindowScrollTop = currentWindowScrollTop();
    }
    if (!isOpen && wasOpen) {
      focusElement(previouslyFocusedEl);
      previouslyFocusedEl = null;
      lastTopPageKey = '';
      lastScrollPageKey = '';
      pageScrollTops.clear();
    }
    wasOpen = isOpen;
  });

  $effect(() => {
    if (!restorePageScroll || !$popupState.content) return;
    const top = preservedWindowScrollTop;
    restoreWindowScroll(top);
    requestAnimationFrame(() => {
      if (!$popupState.content) return;
      restoreWindowScroll(top);
    });
  });

  $effect(() => {
    if (!$popupState.content || !popupEl) return;
    const topPage = popupEl.querySelector<HTMLElement>('.gui-popup-page.is-top');
    if (!topPage) return;
    const pageKey = topPage.dataset.popupPageKey ?? '';
    if (pageKey === lastTopPageKey) return;
    lastTopPageKey = pageKey;

    queueMicrotask(() => {
      const active = document.activeElement as HTMLElement | null;
      if (active && topPage.contains(active)) return;
      const preferredInput = shouldAutoFocusTextInput()
        ? queryFirst(topPage, initialInputSelectors)
        : null;
      const preferred = isKeyboardFocusableElement(preferredInput)
        ? preferredInput
        : queryAll(topPage, initialFocusSelectors).find((candidate) => isKeyboardFocusableElement(candidate))
          ?? getFocusableElements(topPage)[0]
          ?? queryFirst(popupEl, [closeControlSelector])
          ?? null;
      focusElement(preferred);
    });
  });

  $effect(() => {
    if (!restorePageScroll || !$popupState.content || !popupEl || !popupInnerEl) return;
    const topPage = popupEl.querySelector<HTMLElement>('.gui-popup-page.is-top');
    if (!topPage) return;
    const pageKey = topPage.dataset.popupPageKey ?? '';
    if (!pageKey || pageKey === lastScrollPageKey) return;
    lastScrollPageKey = pageKey;
    const restoreTop = pageScrollTops.get(pageKey) ?? 0;
    const popupNode = popupInnerEl;
    popupNode.scrollTop = restoreTop;
    requestAnimationFrame(() => {
      if (!popupInnerEl || popupInnerEl !== popupNode || lastScrollPageKey !== pageKey) return;
      popupNode.scrollTop = restoreTop;
    });
  });

  $effect(() => {
    if (!restorePageScroll || !popupInnerEl) return;
    const popupNode = popupInnerEl;
    const rememberScroll = () => {
      if (!lastScrollPageKey) return;
      pageScrollTops.set(lastScrollPageKey, popupNode.scrollTop);
    };
    popupNode.addEventListener('scroll', rememberScroll, { passive: true });
    return () => popupNode.removeEventListener('scroll', rememberScroll);
  });

  $effect(() => {
    if (!popupEl || !dirtyTracking || !dirtyTracking.enabled) return;
    const options = dirtyTracking;
    const eventTypes = options.eventTypes ?? ['input', 'change'];
    const trackSelector = options.trackSelector ?? 'input, textarea, select, [contenteditable="true"], [role="textbox"]';
    const ignoreSelector = options.ignoreSelector ?? '[data-ui-dirty-ignore="true"]';
    const onlyWhenDismissExplicit = options.onlyWhenDismissExplicit ?? true;

    const markDirtyIfNeeded = (event: Event) => {
      const content = $popupState.content;
      if (!content) return;
      if (isCloseConfirmOpen()) return;
      if ((content.isDirty ?? false) === true) return;
      if (onlyWhenDismissExplicit && resolvePopupDismiss(content) !== 'explicit') return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (ignoreSelector && target.closest(ignoreSelector)) return;
      const editable = target.closest(trackSelector);
      if (!(editable instanceof HTMLElement)) return;
      if (editable instanceof HTMLInputElement) {
        const nonDataTypes = new Set(['button', 'submit', 'reset', 'image', 'file']);
        if (nonDataTypes.has((editable.type || '').toLowerCase())) return;
        if (editable.readOnly || editable.disabled) return;
      }
      if (editable instanceof HTMLTextAreaElement && (editable.readOnly || editable.disabled)) return;
      if (editable instanceof HTMLSelectElement && editable.disabled) return;
      popupControls.markCurrentDirty();
    };

    for (const eventType of eventTypes) popupEl.addEventListener(eventType, markDirtyIfNeeded, true);
    return () => {
      for (const eventType of eventTypes) popupEl?.removeEventListener(eventType, markDirtyIfNeeded, true);
    };
  });

  let pages = $derived([
    ...($popupState.stack ?? []),
    ...($popupState.content ? [$popupState.content] : [])
  ]);

  const ids = new WeakMap<any, string>();
  let seq = 0;
  function keyFor(page: any): string {
    if (page?.key != null) return String(page.key);
    if (page?.id != null) return String(page.id);
    const existing = ids.get(page);
    if (existing) return existing;
    const id = `page-${++seq}`;
    ids.set(page, id);
    return id;
  }

  type PageKeyEntry = { page: any; key: string };
  const pagesWithKeys = $derived((): PageKeyEntry[] => {
    const entries: PageKeyEntry[] = [];
    const seen = new Map<string, number>();
    for (const page of pages) {
      const base = keyFor(page);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      entries.push({ page, key: count === 0 ? base : `${base}::${count}` });
    }
    return entries;
  });

  let top = $derived(Math.max(0, pages.length - 1));
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="gui-popup-shell" class:gui-popup-shell--open={$popupState.content !== null}>
  <button type="button" class="gui-popup-backdrop" onclick={() => attemptClose('backdrop')} aria-label="Close popup" tabindex={-1}></button>
  <div bind:this={popupEl} class="gui-popup" role="dialog" aria-modal="true" aria-label={$popupState.content?.title ?? 'Popup'}>
    <div bind:this={popupInnerEl} class="gui-popup__inner">
      {#if !$popupState.content?.hideHeader}
        <div class="gui-popup__header">
          <button data-popup-close-control type="button" class="gui-popup__close" onclick={onClose} aria-label={$popupState.stack.length > 0 ? 'Back' : 'Close'}>
            {$popupState.stack.length > 0 ? '←' : '✕'}
          </button>
          {#if $popupState.content?.title && !$popupState.content?.hideTitle}
            <h2 class="gui-popup-title">{$popupState.content.title}</h2>
          {/if}
        </div>
      {/if}
      <div class="gui-popup__content ui-scrollbar-thin">
        {#each pagesWithKeys() as entry, i (entry.key)}
          {@const Component = entry.page.component}
          <div class={`gui-popup-page ${i === top ? 'is-top' : 'is-hidden'}`} data-popup-page-key={entry.key} aria-hidden={i === top ? 'false' : 'true'} inert={i !== top}>
            <Component {...entry.page.props} />
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .gui-popup-shell { position:fixed; inset:0; z-index:100; pointer-events:none; }
  .gui-popup-shell--open { pointer-events:auto; }
  .gui-popup-backdrop {
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(15, 23, 42, 0.18);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    opacity: 0;
    transition:
      opacity .24s ease,
      background-color .24s ease,
      backdrop-filter .24s ease;
  }
  .gui-popup-shell--open .gui-popup-backdrop { opacity:1; }
  .gui-popup {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: max(1rem, env(safe-area-inset-top));
    background: transparent;
    transform: translateY(100%);
    transition: transform .2s ease;
    overflow: visible;
    pointer-events: none;
  }
  .gui-popup-shell--open .gui-popup { transform:translateY(0); }
  .gui-popup__inner {
    width: min(100% - 1rem, 56rem);
    max-height: min(78vh, calc(100vh - env(safe-area-inset-top) - 0.75rem));
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    overflow: visible;
    overflow-x: clip;
    overscroll-behavior-y: contain;
    overscroll-behavior-x: auto;
    touch-action: pan-y;
    background: oklch(var(--b1));
    border-top: 1px solid oklch(var(--b3) / 0.55);
    border-left: 1px solid oklch(var(--b3) / 0.55);
    border-right: 1px solid oklch(var(--b3) / 0.55);
    border-top-left-radius: 1.85rem;
    border-top-right-radius: 1.85rem;
    box-shadow: 0 -8px 24px oklch(var(--bc) / 0.08);
    pointer-events: auto;
  }
  .gui-popup__header {
    display:flex;
    align-items:center;
    gap:.75rem;
    flex: 0 0 auto;
    padding: 1rem 1rem 0 1rem;
    background: oklch(var(--b1));
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .gui-popup__content {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: clip;
    overflow-y: auto;
    padding: 0 1rem 1rem 1rem;
  }
  .gui-popup__close {
    border: none;
    background: transparent;
    border-radius: 999px;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }
  .gui-popup__close:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
  .gui-popup-page.is-hidden { display:none; }
  .gui-popup-page.is-top { min-width: 0; }
</style>
