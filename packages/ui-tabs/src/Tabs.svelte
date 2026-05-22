<script lang="ts">
  import { setContext, tick } from 'svelte';
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
    });
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

  let tablistClasses = $derived([
    'gui-tabs',
    `gui-tabs--${variant}`,
    `gui-tabs--${size}`,
    fitted ? 'gui-tabs--fitted' : '',
    className
  ].filter(Boolean).join(' '));
</script>

<div class="gui-tabs-shell" bind:this={tabsNavEl}>
  <div
    role="tablist"
    tabindex="-1"
    id={id}
    aria-orientation="horizontal"
    class={tablistClasses}
    onkeydown={onKeydown}
    bind:this={scroller}
  >
    {#each tabs as t (t.id)}
      <button
        type="button"
        role="tab"
        id={`${id}-tab-${t.id}`}
        class="gui-tab"
        class:gui-tab--active={active === t.id}
        aria-selected={active === t.id}
        aria-controls={`${id}-panel-${t.id}`}
        tabindex={active === t.id ? 0 : -1}
        disabled={t.disabled}
        onclick={() => select(t.id)}
      >
        <span class="gui-tab__label">{t.title}</span>
        {#if t.badge !== undefined}
          <span class="gui-tab__badge">{t.badge}</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<div bind:this={panelsEl}>
  {@render children?.()}
</div>

<style>
  .gui-tabs {
    display:flex; gap:.5rem; overflow:auto; padding:.25rem 0;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
  .gui-tabs--fitted { display:grid; grid-auto-flow:column; grid-auto-columns:1fr; }
  .gui-tab {
    appearance:none; border:1px solid #d4d4d8; background:#fff; color:#18181b; border-radius:.75rem;
    padding:.5rem .75rem; display:inline-flex; align-items:center; gap:.5rem; cursor:pointer; white-space:nowrap;
  }
  .gui-tab:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
  .gui-tab--active { background:#eff6ff; border-color:#93c5fd; }
  .gui-tabs--underline .gui-tab { border-radius:.5rem; }
  .gui-tab__badge { font-size:.75rem; padding:.1rem .35rem; border-radius:999px; background:#e4e4e7; }
</style>
