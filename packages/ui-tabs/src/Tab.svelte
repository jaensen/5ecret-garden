<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import type { Snippet } from 'svelte';
  import { TABS_CTX, type TabsContext } from './tabs.context';

  const ctx = getContext<TabsContext>(TABS_CTX);
  const { register, isSelected } = ctx;

  let {
    id = '',
    title = '',
    badge = undefined as number | string | undefined,
    disabled = false,
    panelClass = '',
    hostId = undefined as string | undefined,
    children
  }: { id?: string; title?: string; badge?: number | string; disabled?: boolean; panelClass?: string; hostId?: string; children?: Snippet } = $props();

  function slug(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  $effect(() => { if (!id) id = slug(title || 'tab'); });

  let selectedId: string | null = $state(null);
  let unsub: (() => void) | null = null;
  $effect(() => {
    if (ctx.selected$ && !unsub) {
      unsub = ctx.selected$?.subscribe((v) => { selectedId = v; }) ?? null;
    }
  });

  let unregister: (() => void) | null = null;
  let prev: { id: string; title: string; disabled: boolean; badge?: number | string } | null = null;
  $effect(() => {
    const current = { id, title, disabled, badge };
    if (prev === null) {
      unregister = register(current);
      prev = { ...current };
      return;
    }
    const idChanged = prev.id !== current.id;
    const metaChanged = idChanged || prev.title !== current.title || prev.disabled !== current.disabled || prev.badge !== current.badge;
    if (!metaChanged) return;
    if (idChanged) {
      unregister?.();
      unregister = register(current);
    } else register(current);
    prev = { ...current };
  });

  onDestroy(() => {
    unsub?.();
    unregister?.();
  });

  let isActive = $derived(ctx.selected$ ? (selectedId === id) : isSelected(id));
  let effectiveHostId = $derived(hostId ?? ctx.getHostId?.() ?? 'tabs');
</script>

<div
  role="tabpanel"
  id={`${effectiveHostId}-panel-${id}`}
  aria-labelledby={`${effectiveHostId}-tab-${id}`}
  class={panelClass}
  hidden={!isActive}
  aria-hidden={!isActive}
>
  {@render children?.()}
</div>
