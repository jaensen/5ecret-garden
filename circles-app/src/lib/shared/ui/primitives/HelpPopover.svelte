<script lang="ts">
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import { Info as LInfo, X as LX } from 'lucide';
  import MiniPopover from '$lib/shared/ui/primitives/MiniPopover.svelte';

  interface Props {
    title: string;
    lines: string[];
    open?: boolean;
    align?: 'start' | 'end' | 'center';
    side?: 'top' | 'bottom';
    widthClass?: string;
    buttonClass?: string;
    contentClass?: string;
    openOnHover?: boolean;
    dismissible?: boolean;
    dismissLabel?: string;
    onDismiss?: () => void;
  }

  let {
    title,
    lines,
    open = $bindable(false),
    align = 'end',
    side = 'bottom',
    widthClass = 'w-80',
    buttonClass = 'btn btn-ghost btn-xs btn-touch-square',
    contentClass = 'mini-popover-surface mini-popover-surface--callout p-3',
    openOnHover = false,
    dismissible = false,
    dismissLabel = 'Dismiss help',
    onDismiss = undefined,
  }: Props = $props();

  function handleDismiss(): void {
    onDismiss?.();
    open = false;
  }
</script>

<MiniPopover
  {title}
  bind:open
  {align}
  {side}
  {widthClass}
  {openOnHover}
  triggerClass={`${buttonClass} list-none`.trim()}
  panelClass={`${contentClass} ${side === 'top' ? 'mini-popover-surface--arrow-bottom' : 'mini-popover-surface--arrow-top'}`.trim()}
>
  <svelte:fragment slot="trigger">
    <Lucide icon={LInfo} size={16} class="text-base-content/40" ariaLabel="" />
  </svelte:fragment>

  <div class="text-left">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="text-xs font-semibold text-base-content/70">{title}</div>
        <ul class="mt-2 space-y-1 text-xs text-base-content/80">
          {#each lines as line}
            <li>{line}</li>
          {/each}
        </ul>
      </div>

      {#if dismissible}
        <button
          type="button"
          class="btn-icon-dismiss"
          aria-label={dismissLabel}
          title="Dismiss"
          onclick={handleDismiss}
        >
          <Lucide
            icon={LX}
            size={14}
            class="text-base-content/70"
            ariaLabel=""
          />
        </button>
      {/if}
    </div>
  </div>
</MiniPopover>
