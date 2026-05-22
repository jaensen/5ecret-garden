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

  interface Props {
    closeConfirm?: PopupContentDefinition | null;
    defaultActionSelector?: string;
    enableEnterDefaultAction?: boolean;
  }

  let {
    closeConfirm = null,
    defaultActionSelector = '[data-ui-default-action], button[type="submit"], .gui-primary-action',
    enableEnterDefaultAction = true
  }: Props = $props();

  let popupEl: HTMLDivElement | null = $state(null);
  let previouslyFocusedEl: HTMLElement | null = null;
  let wasOpen = false;
  let lastTopPageKey = '';

  function findTopPage(): HTMLElement | null {
    return popupEl?.querySelector<HTMLElement>('.gui-popup-page.is-top') ?? null;
  }

  function findDefaultAction(scope: ParentNode | null): HTMLElement | null {
    if (!scope) return null;
    const match = scope.querySelector<HTMLElement>(defaultActionSelector);
    return isKeyboardFocusableElement(match) ? match : null;
  }

  function pushCloseConfirmStep(): void {
    if (!closeConfirm) return;
    if ($popupState.content?.id === closeConfirm.id) return;
    popupControls.open(closeConfirm);
  }

  function attemptClose(source: 'backdrop' | 'escape' | 'header'): void {
    const content = $popupState.content;
    if (!content) return;
    if (closeConfirm && $popupState.content?.id === closeConfirm.id) {
      if (source === 'backdrop' || source === 'escape') popupControls.back();
      return;
    }
    const dismiss = resolvePopupDismiss(content);
    const flowDirty = isCurrentFlowDirty($popupState);
    if (dismiss === 'explicit' && (source === 'backdrop' || source === 'escape')) {
      if (flowDirty && closeConfirm) pushCloseConfirmStep();
      else popupControls.close();
      return;
    }
    if (dismiss === 'confirmIfDirty' && flowDirty && closeConfirm) {
      pushCloseConfirmStep();
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
    }
    if (!isOpen && wasOpen) {
      focusElement(previouslyFocusedEl);
      previouslyFocusedEl = null;
      lastTopPageKey = '';
    }
    wasOpen = isOpen;
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
        ? topPage.querySelector<HTMLElement>('[data-ui-initial-input]')
        : null;
      const preferred = isKeyboardFocusableElement(preferredInput)
        ? preferredInput
        : Array.from(topPage.querySelectorAll<HTMLElement>('[data-ui-initial-focus]')).find((candidate) => isKeyboardFocusableElement(candidate))
          ?? getFocusableElements(topPage)[0]
          ?? popupEl?.querySelector<HTMLElement>('[data-popup-close-control], .gui-popup-title')
          ?? null;
      focusElement(preferred);
    });
  });

  let pages = $derived([
    ...($popupState.stack ?? []),
    ...($popupState.content ? [$popupState.content] : [])
  ]);

  type PageKeyEntry = { page: any; key: string };
  const pagesWithKeys = $derived((): PageKeyEntry[] => {
    const entries: PageKeyEntry[] = [];
    const seen = new Map<string, number>();
    for (const page of pages) {
      const base = page?.key != null ? String(page.key) : page?.id != null ? String(page.id) : `page-${entries.length}`;
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
    <div class="gui-popup__inner">
      <div class="gui-popup__header">
        <button data-popup-close-control type="button" class="gui-popup__close" onclick={onClose} aria-label={$popupState.stack.length > 0 ? 'Back' : 'Close'}>
          {$popupState.stack.length > 0 ? '←' : '✕'}
        </button>
        {#if $popupState.content?.title && !$popupState.content?.hideTitle}
          <h2 class="gui-popup-title">{$popupState.content.title}</h2>
        {/if}
      </div>
      <div class="gui-popup__content">
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
  .gui-popup-backdrop { position:absolute; inset:0; border:0; background:rgba(0,0,0,.35); opacity:0; transition:opacity .2s ease; }
  .gui-popup-shell--open .gui-popup-backdrop { opacity:1; }
  .gui-popup { position:absolute; bottom:0; left:0; width:100%; max-height:82%; min-height:70%; background:#fff; border-top-left-radius:1rem; border-top-right-radius:1rem; transform:translateY(100%); transition:transform .2s ease; overflow:auto; }
  .gui-popup-shell--open .gui-popup { transform:translateY(0); }
  .gui-popup__inner { max-width:56rem; margin:0 auto; padding:1rem; }
  .gui-popup__header { display:flex; align-items:center; gap:.75rem; margin-bottom:1rem; }
  .gui-popup__close { border:1px solid #d4d4d8; background:#fff; border-radius:999px; width:2rem; height:2rem; cursor:pointer; }
  .gui-popup__close:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
  .gui-popup-page.is-hidden { display:none; }
</style>
