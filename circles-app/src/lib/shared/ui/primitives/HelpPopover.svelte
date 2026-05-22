<script lang="ts">
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import { Info as LInfo } from 'lucide';
  import MiniPopover from '$lib/shared/ui/primitives/MiniPopover.svelte';

  interface Props {
    title: string;
    lines: string[];
    align?: 'start' | 'end';
    widthClass?: string;
    buttonClass?: string;
    contentClass?: string;
  }

  let {
    title,
    lines,
    align = 'end',
    widthClass = 'w-80',
    buttonClass = 'btn btn-ghost btn-xs btn-square',
    contentClass = 'mini-popover-surface p-3',
  }: Props = $props();
</script>

<MiniPopover
  {title}
  {align}
  {widthClass}
  triggerClass={`${buttonClass} list-none`.trim()}
  panelClass={contentClass}
>
  <svelte:fragment slot="trigger">
    <Lucide icon={LInfo} size={16} class="text-base-content/40" ariaLabel="" />
  </svelte:fragment>

  <div class="text-left">
    <div class="text-xs font-semibold text-base-content/70">{title}</div>
    <ul class="mt-2 space-y-1 text-xs text-base-content/80">
      {#each lines as line}
        <li>{line}</li>
      {/each}
    </ul>
  </div>
</MiniPopover>
