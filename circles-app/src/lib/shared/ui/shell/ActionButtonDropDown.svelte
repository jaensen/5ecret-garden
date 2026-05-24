<script lang="ts">
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import type { ActionButton } from '$lib/shared/ui/shell/action-buttons';

  // Default to empty list; tolerate undefined entries
  let { actions = [] as any[] } = $props();

  let sanitizedActions: ActionButton[] = $derived(actions.filter(Boolean));

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
</script>

{#each sanitizedActions as a, i (a?.id ?? a?.label ?? i)}
  {@const variantClass = getVariantClass(a, i)}
  <button
    type="button"
    class={`btn btn-sm ${variantClass} min-h-0 h-[var(--collapsed-h)] md:h-[var(--collapsed-h-md)] w-full justify-start px-3`}
    onclick={a.onClick}
    aria-label={a.label}
    disabled={!!a?.disabled}
    aria-disabled={!!a?.disabled}
  >
    {#if a.iconNode}
      <Lucide icon={a.iconNode} size={20} class="shrink-0" />
    {/if}
    <span>{a.label}</span>
  </button>
{/each}
