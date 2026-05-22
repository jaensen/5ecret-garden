<script lang="ts">
  import { RowFrame as GardenRowFrame } from '@garden-ui/row';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
    clickable?: boolean;
    selected?: boolean;
    disabled?: boolean;
    dense?: boolean;
    className?: string;
    noLeading?: boolean;
    activationKeys?: Array<'Enter' | ' '>;
    onclick?: (event: MouseEvent) => void;
    leading?: Snippet;
    title?: Snippet;
    subtitle?: Snippet;
    meta?: Snippet;
    trailing?: Snippet;
    children?: Snippet;
  };

  let {
    clickable = false,
    selected = false,
    disabled = false,
    dense = false,
    class: classAttr = '',
    className = '',
    noLeading = false,
    activationKeys = ['Enter', ' '],
    onclick,
    onkeydown,
    leading,
    title,
    subtitle,
    meta,
    trailing,
    children,
    ...rest
  }: Props = $props();
</script>

<GardenRowFrame
  {...rest}
  {clickable}
  {selected}
  {disabled}
  {dense}
  {noLeading}
  {activationKeys}
  {onclick}
  {onkeydown}
  class={`app-row-frame-theme ${classAttr}`.trim()}
  {className}
  {leading}
  {title}
  {subtitle}
  {meta}
  {trailing}
>
  {@render children?.()}
</GardenRowFrame>

<style>
  :global(.app-row-frame-theme) {
    --gui-row-height: var(--row-height-md);
    --gui-row-pad-x: var(--row-pad-x-md);
    --gui-row-pad-y: var(--row-pad-y-md);
    --gui-row-gap: var(--row-gap);
    --gui-row-radius: var(--row-radius);
    --gui-row-bg: var(--row-bg);
    --gui-row-bg-hover: var(--row-bg-hover);
    --gui-row-bg-selected: var(--row-bg-selected);
    --gui-row-border: var(--row-border);
    --gui-row-border-hover: var(--row-border-hover);
    --gui-row-border-selected: var(--row-border-selected);
    --gui-row-focus: var(--row-border-selected);
    --gui-row-fg: var(--row-fg-strong);
    --gui-row-muted: var(--row-fg-muted);
    --gui-row-muted-2: var(--row-fg-muted-2);
  }

  :global(.app-row-frame-theme[data-ui-row-dense='true']) {
    --gui-row-height: var(--row-height-sm);
    --gui-row-pad-x: var(--row-pad-x-sm);
    --gui-row-pad-y: var(--row-pad-y-sm);
  }
</style>
