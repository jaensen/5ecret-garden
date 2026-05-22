<script lang="ts">
  import { setContext, tick, onMount, onDestroy } from 'svelte';
  import type { Snippet } from 'svelte';
  import { writable, type Readable } from 'svelte/store';
  import { TABS_CTX, type TabRegistration, type TabsContext } from './tabs.context';

  let uidCounter = 0;
  function nextUid() {
    uidCounter += 1;
    return `garden-tabs-${uidCounter}`;
  }

  type Variant = 'plain' | 'boxed' | 'underline';
  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    selected?: string | null;
    defaultValue?: string | null;
    variant?: Variant;
    size?: Size;
    fitted?: boolean;
    class?: string;
    id?: string;
    tabOrder?: string[];
    children?: Snippet;
  };

  let {
    selected = $bindable<string | null>(null),
    defaultValue = null as string | null,
    variant = 'underline' as Variant,
    size = 'md' as Size,
    fitted = false,
    class: className = '',
    id = nextUid(),
    tabOrder = undefined as string[] | undefined,
    children
  }: Props = $props();

  let tabs = $state<TabRegistration[]>([]);
  let active = $state<string | null>(selected ?? null);
  let pendingExternalAck = $state<string | null>(null);
  let scroller: HTMLDivElement | null = null;
  let tabsNavEl: HTMLDivElement | null = null;
  let panelsEl: HTMLDivElement | null = null;
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);
  let resizeObserver: ResizeObserver | null = null;

  $effect(() => {
    const external = selected;
    const hasExternal = external !== null;
    const differs = external !== active;
    if (!hasExternal) return;
    if (pendingExternalAck !== null && external === pendingExternalAck) {
      pendingExternalAck = null;
      if (differs) active = external;
      return;
    }
    if (pendingExternalAck !== null && active === pendingExternalAck) return;
    if (differs) active = external;
  });

  function sortTabs(list: TabRegistration[]): TabRegistration[] {
    if (!tabOrder || tabOrder.length === 0) return list;
    const orderMap = new Map(tabOrder.map((id_, idx) => [id_, idx] as const));
    return list.slice().sort((a, b) => {
      const aIdx = orderMap.get(a.id);
      const bIdx = orderMap.get(b.id);
      if (aIdx === undefined && bIdx === undefined) return 0;
      if (aIdx === undefined) return 1;
      if (bIdx === undefined) return -1;
      return aIdx - bIdx;
    });
  }

  function updateOrInsertTab(info: TabRegistration) {
    const i = tabs.findIndex((t) => t.id === info.id);
    if (i === -1) {
      tabs = sortTabs([...tabs, info]);
      return;
    }
    const prev = tabs[i];
    const changed = prev.title !== info.title || prev.disabled !== info.disabled || prev.badge !== info.badge;
    if (!changed) return;
    const next = tabs.slice();
    next[i] = info;
    tabs = sortTabs(next);
  }

  function register(info: TabRegistration): () => void {
    updateOrInsertTab(info);
    if (active === null) {
      const wantDefault = !!defaultValue && info.id === defaultValue;
      const firstEnabled = tabs.find((t) => !t.disabled);
      const isFirstEnabled = !defaultValue && firstEnabled?.id === info.id;
      if ((wantDefault || isFirstEnabled) && !info.disabled) select(info.id);
    }
    return () => {
      const wasSelected = active === info.id;
      const filtered = tabs.filter((t) => t.id !== info.id);
      if (filtered.length !== tabs.length) tabs = filtered;
      if (wasSelected) {
        const remainingEnabled = filtered.filter((t) => !t.disabled);
        const next = remainingEnabled[0]?.id ?? null;
        if (next !== null) select(next);
        else {
          active = null;
          selected = null;
        }
      }
    };
  }

  function isSelected(id_: string): boolean { return active === id_; }

  function select(id_: string, focus = false): void {
    const tgt = tabs.find((t) => t.id === id_ && !t.disabled);
    if (!tgt) return;
    const changed = active !== id_;
    if (changed) {
      active = id_;
      pendingExternalAck = id_;
      selected = id_;
    }
    void tick().then(() => {
      const tabDomId = `${id}-tab-${id_}`;
      const el = document.getElementById(tabDomId) as HTMLElement | null;
      el?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
      if (focus) el?.focus();
      updateScrollShadows();
    });
  }

  function updateScrollShadows(): void {
    if (!scroller) return;
    const { scrollLeft, scrollWidth, clientWidth } = scroller;
    canScrollLeft = scrollLeft > 0;
    canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
  }

  function onScroll(): void {
    updateScrollShadows();
  }

  function nudge(dir: number): void {
    if (!scroller) return;
    const amount = Math.max(120, Math.floor(scroller.clientWidth * 0.6));
    scroller.scrollBy({ left: amount * dir, behavior: 'smooth' });
  }

  const FOCUSABLE_SELECTOR = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function getFocusable(scope: ParentNode | null): HTMLElement[] {
    if (!scope) return [];
    const all = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    return all.filter((el) => {
      if (el.hasAttribute('disabled')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      if (el.closest('[aria-hidden="true"], [inert]')) return false;
      return true;
    });
  }

  function focusFirstBelowTabs(): void {
    const inPanels = getFocusable(panelsEl);
    if (inPanels.length > 0) {
      inPanels[0]?.focus();
      return;
    }
  }

  function focusLastAboveTabs(): void {
    const all = getFocusable(document).filter((el) => !tabsNavEl?.contains(el));
    const beforeTabs = all.filter((el) => {
      if (!tabsNavEl) return false;
      const pos = tabsNavEl.compareDocumentPosition(el);
      return Boolean(pos & Node.DOCUMENT_POSITION_PRECEDING);
    });
    beforeTabs[beforeTabs.length - 1]?.focus();
  }

  function onKeydown(e: KeyboardEvent): void {
    const enabled = tabs.filter((t) => !t.disabled);
    if (enabled.length === 0) return;
    const idx = enabled.findIndex((t) => t.id === active);
    const move = (n: number) => {
      const i = (idx + n + enabled.length) % enabled.length;
      select(enabled[i].id, true);
    };
    const key = e.key;
    if (key === 'ArrowRight') { e.preventDefault(); move(1); return; }
    if (key === 'ArrowLeft') { e.preventDefault(); move(-1); return; }
    if (key === 'ArrowDown') { e.preventDefault(); focusFirstBelowTabs(); return; }
    if (key === 'ArrowUp') { e.preventDefault(); focusLastAboveTabs(); return; }
    if (key === 'Home') { e.preventDefault(); select(enabled[0].id, true); return; }
    if (key === 'End') { e.preventDefault(); select(enabled[enabled.length - 1].id, true); return; }
  }

  const selectedStore = writable<string | null>(null);
  $effect(() => { selectedStore.set(active); });

  const ctx: TabsContext = {
    register,
    isSelected,
    select,
    selected$: selectedStore as Readable<string | null>,
    getHostId: () => id
  };
  setContext(TABS_CTX, ctx);

  onMount(() => {
    setTimeout(updateScrollShadows, 0);
    if (scroller && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateScrollShadows());
      resizeObserver.observe(scroller);
    }
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  let tablistClasses = $derived([
    'tabs overflow-x-auto whitespace-nowrap',
    variant === 'boxed' ? 'tabs-boxed' : '',
    variant === 'underline' ? 'tabs-bordered' : '',
    size === 'sm' ? 'tabs-sm' : size === 'lg' ? 'tabs-lg' : '',
    fitted ? 'gui-tabs--fitted' : '',
    className
  ].filter(Boolean).join(' '));

  let buttonSizeClass = $derived(
    size === 'sm' ? 'h-8' : size === 'lg' ? 'h-12' : 'h-10'
  );
</script>

<div class="relative" bind:this={tabsNavEl}>
  <div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-base-300 z-0"></div>

  <div class={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-base-100 to-transparent transition-opacity duration-150 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}></div>
  <button
    type="button"
    class={`btn btn-ghost btn-xs absolute left-1 top-1/2 -translate-y-1/2 z-10 ${canScrollLeft ? '' : 'opacity-0 pointer-events-none'}`}
    aria-hidden={!canScrollLeft}
    tabindex={-1}
    onclick={() => nudge(-1)}
  >
    <img src="/chevron-right.svg" alt="Scroll left" class="w-4 h-4 rotate-180" />
  </button>

  <div class={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-base-100 to-transparent transition-opacity duration-150 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}></div>
  <button
    type="button"
    class={`btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2 z-10 ${canScrollRight ? '' : 'opacity-0 pointer-events-none'}`}
    aria-hidden={!canScrollRight}
    tabindex={-1}
    onclick={() => nudge(1)}
  >
    <img src="/chevron-right.svg" alt="Scroll right" class="w-4 h-4" />
  </button>

  <div
    role="tablist"
    tabindex="-1"
    id={id}
    aria-orientation="horizontal"
    class={tablistClasses}
    onkeydown={onKeydown}
    onscroll={onScroll}
    bind:this={scroller}
  >
    {#each tabs as t (t.id)}
      <button
        type="button"
        role="tab"
        id={`${id}-tab-${t.id}`}
        data-popup-initial-focus={active === t.id ? 'true' : undefined}
        class={`tab ${buttonSizeClass} flex-none whitespace-nowrap min-w-max max-w-[calc(100%-4rem)] overflow-hidden`}
        class:tab-active={active === t.id}
        class:tab-disabled={t.disabled}
        aria-selected={active === t.id}
        aria-controls={`${id}-panel-${t.id}`}
        tabindex={active === t.id ? 0 : -1}
        disabled={t.disabled}
        onclick={() => select(t.id)}
        aria-label={t.badge !== undefined ? `${t.title} (${t.badge})` : t.title}
      >
        <span class="inline-flex items-center gap-2 max-w-full">
          <span class="truncate">{t.title}</span>
        {#if t.badge !== undefined}
          <span class="badge badge-sm flex-none">{t.badge}</span>
        {/if}
        </span>
      </button>
    {/each}
  </div>
</div>

<div bind:this={panelsEl}>
  {@render children?.()}
</div>

<style>
  .tabs {
    display:flex;
    gap:.25rem;
    padding:.25rem 0;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    position: relative;
    z-index: 1;
  }

  .gui-tabs--fitted { display:grid; grid-auto-flow:column; grid-auto-columns:1fr; }

  .tab {
    border-radius: 999px;
    transition:
      color 0.2s ease,
      background 0.2s ease,
      box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
      filter 0.2s ease;
  }

  .tab:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  .tab.tab-active,
  .tab[aria-selected='true'] {
    background: var(--brand-gradient, linear-gradient(135deg, #38318b 0%, #df6552 100%));
    color: #fff;
    font-weight: 700;
    box-shadow:
      0 4px 18px -6px rgba(56, 49, 139, 0.44),
      0 2px 10px -5px rgba(223, 101, 82, 0.2),
      inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  }

  .tab:not(.tab-active):not([aria-selected='true']):hover {
    background: color-mix(in srgb, var(--brand-blue, #38318b) 8%, transparent);
    color: var(--brand-blue, #38318b);
  }
</style>
