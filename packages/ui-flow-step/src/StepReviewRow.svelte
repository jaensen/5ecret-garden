<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    label: string;
    value?: string;
    onChange?: () => void;
    changeLabel?: string;
    className?: string;
    valueClassName?: string;
    children?: Snippet;
  }
  let { label, value, onChange, changeLabel = 'Change', className = '', valueClassName = '', children }: Props = $props();
</script>

<div class={`gui-review-row ${className}`.trim()}>
  <div class="gui-review-row__main">
    <div class="gui-review-row__label">{label}</div>
    {#if value}<div class={`gui-review-row__value ${valueClassName}`.trim()}>{value}</div>{/if}
    {@render children?.()}
  </div>
  {#if onChange}<button type="button" class="gui-review-row__change" onclick={onChange}>{changeLabel}</button>{/if}
</div>

<style>
  .gui-review-row { display:flex; justify-content:space-between; gap:.75rem; align-items:flex-start; }
  .gui-review-row__label { font-size:.75rem; color:#71717a; }
  .gui-review-row__value { font-size:.95rem; color:#18181b; }
  .gui-review-row__change { border:0; background:transparent; color:#2563eb; cursor:pointer; }
  .gui-review-row__change:focus-visible { outline:2px solid #2563eb; outline-offset:2px; border-radius:.375rem; }
</style>
