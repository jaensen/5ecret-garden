<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    label: string;
    value?: string;
    onChange?: () => void;
    changeLabel?: string;
    className?: string;
    mainClassName?: string;
    labelClassName?: string;
    valueClassName?: string;
    buttonClassName?: string;
    unstyled?: boolean;
    children?: Snippet;
  }
  let {
    label,
    value,
    onChange,
    changeLabel = 'Change',
    className = '',
    mainClassName = 'gui-review-row__main',
    labelClassName = 'gui-review-row__label',
    valueClassName = 'gui-review-row__value',
    buttonClassName = 'gui-review-row__change',
    unstyled = false,
    children,
  }: Props = $props();
</script>

<div class={`${unstyled ? '' : 'gui-review-row'} ${className}`.trim()}>
  <div class={mainClassName}>
    <div class={labelClassName}>{label}</div>
    {#if value}<div class={valueClassName}>{value}</div>{/if}
    {@render children?.()}
  </div>
  {#if onChange}<button type="button" class={buttonClassName} onclick={onChange}>{changeLabel}</button>{/if}
</div>

<style>
  .gui-review-row { display:flex; justify-content:space-between; gap:.75rem; align-items:flex-start; }
  .gui-review-row__label { font-size:.75rem; color:#71717a; }
  .gui-review-row__value { font-size:.95rem; color:#18181b; }
  .gui-review-row__change { border:0; background:transparent; color:#2563eb; cursor:pointer; }
  .gui-review-row__change:focus-visible { outline:2px solid #2563eb; outline-offset:2px; border-radius:.375rem; }
</style>
