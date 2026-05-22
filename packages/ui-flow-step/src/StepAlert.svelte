<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    variant?: 'info' | 'warning' | 'error' | 'success';
    title?: string;
    message?: string;
    className?: string;
    ariaLive?: 'off' | 'polite' | 'assertive';
    action?: Snippet;
    children?: Snippet;
  }
  let { variant = 'info', title, message, className = '', ariaLive = 'polite', action, children }: Props = $props();
</script>

<div class={`gui-step-alert gui-step-alert--${variant} ${className}`.trim()} role={variant === 'error' ? 'alert' : 'status'} aria-live={ariaLive}>
  <div class="gui-step-alert__content">
    <div>
      {#if title}<div class="gui-step-alert__title">{title}</div>{/if}
      {#if message}<div>{message}</div>{/if}
      {@render children?.()}
    </div>
    {#if action}<div>{@render action()}</div>{/if}
  </div>
</div>

<style>
  .gui-step-alert { border:1px solid #e4e4e7; border-radius:.875rem; padding:.75rem; }
  .gui-step-alert__content { display:flex; justify-content:space-between; gap:.75rem; align-items:flex-start; }
  .gui-step-alert__title { font-weight:600; margin-bottom:.25rem; }
  .gui-step-alert--info { background:#eff6ff; border-color:#bfdbfe; }
  .gui-step-alert--warning { background:#fffbeb; border-color:#fde68a; }
  .gui-step-alert--error { background:#fef2f2; border-color:#fecaca; }
  .gui-step-alert--success { background:#f0fdf4; border-color:#bbf7d0; }
</style>
