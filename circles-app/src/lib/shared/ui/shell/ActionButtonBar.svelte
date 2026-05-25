<script lang="ts">
  import { onDestroy } from 'svelte';
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import type { ActionButton } from '$lib/shared/ui/shell/action-buttons';

  interface Props {
    actions?: ActionButton[];
    compactAfterMs?: number | false;
    iconOnly?: boolean;
  }

  // Default to empty array and filter out invalid entries to avoid runtime errors.
  // Compacting is opt-in so page-level action bars do not unexpectedly collapse
  // into icon pills like the bottom nav.
  let {
    actions = [] as any[],
    compactAfterMs = false,
    iconOnly = false,
  }: Props = $props();

  const LABEL_HIDE_DELAY_MS = 2200;

  let compactActions = $state(false);
  let activeActionId = $state<string | null>(null);
  let compactTimer: ReturnType<typeof setTimeout> | null = null;
  let sanitizedActions: ActionButton[] = $derived(actions.filter(Boolean));

  function actionKey(action: ActionButton, index: number): string {
    return action.id ?? action.label ?? String(index);
  }

  function clearCompactTimer(): void {
    if (compactTimer) {
      clearTimeout(compactTimer);
      compactTimer = null;
    }
  }

  function scheduleCompactMode(): void {
    if (compactAfterMs === false) {
      clearCompactTimer();
      compactActions = false;
      return;
    }

    clearCompactTimer();
    compactActions = false;

    compactTimer = setTimeout(() => {
      compactActions = true;
      compactTimer = null;
    }, compactAfterMs ?? LABEL_HIDE_DELAY_MS);
  }

  function handleActionClick(action: ActionButton, index: number): void {
    activeActionId = actionKey(action, index);
    scheduleCompactMode();
    void action.onClick();
  }

  function getVariantClass(action: ActionButton, index: number): string {
    if (action.variant === 'primary') {
      return 'btn-primary';
    }

    if (action.variant === 'muted') {
      return 'btn-muted-outline';
    }

    const nextVariant = sanitizedActions[index + 1]?.variant;
    const previousVariant = sanitizedActions[index - 1]?.variant;

    if (previousVariant === 'primary') {
      return 'btn-ghost btn-action-outline btn-action-outline--warm';
    }

    if (nextVariant === 'primary') {
      return 'btn-ghost btn-action-outline';
    }

    return 'btn-ghost';
  }

  onDestroy(clearCompactTimer);
</script>

{#each sanitizedActions as a, i (actionKey(a, i))}
  {@const hasIcon = !!a.iconNode}
  {@const isCompact = !iconOnly && compactActions && hasIcon}
  {@const isActive = activeActionId === actionKey(a, i)}
  {@const variantClass = getVariantClass(a, i)}
  <button
    type="button"
    class={`btn btn-sm overflow-hidden rounded-full motion-safe:transition-all motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${variantClass} ${iconOnly ? 'collapsed-header-icon-button btn-touch-square px-0 py-0 justify-center gap-0' : isCompact ? 'w-11 h-11 min-h-11 px-0 justify-center gap-0' : 'w-auto min-h-11 px-4 gap-2'} ${isActive && (isCompact || iconOnly) ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-base-100' : ''}`}
    onclick={() => handleActionClick(a, i)}
    aria-label={a.label}
    disabled={!!a?.disabled}
    aria-disabled={!!a?.disabled}
    title={isCompact || iconOnly ? a.label : undefined}
  >
    {#if a.iconNode}
      <Lucide icon={a.iconNode} size={16} class="shrink-0" />
    {/if}
    {#if !iconOnly}
      <span
        class={`whitespace-nowrap overflow-hidden motion-safe:transition-all motion-safe:duration-[480ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isCompact ? 'max-w-0 opacity-0 scale-x-95' : 'max-w-40 opacity-100 scale-x-100'}`}
        aria-hidden={isCompact ? 'true' : undefined}>{a.label}</span
      >
    {/if}
  </button>
{/each}
