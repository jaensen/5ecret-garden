<script lang="ts">
  import type { Snippet } from 'svelte';
  import FlowStepHeader from './FlowStepHeader.svelte';
  interface Props extends Record<string, any> {
    step: number;
    total: number;
    title: string;
    subtitle?: string;
    labels?: readonly string[];
    className?: string;
    headerProps?: Record<string, unknown>;
    children?: Snippet;
  }
  let { step, total, title, subtitle, labels = [], className = 'gui-step-scaffold', headerProps = {}, children, ...rest }: Props = $props();
</script>

<div class={className} tabindex="-1" data-ui-initial-focus {...rest}>
  <FlowStepHeader {step} {total} {title} {subtitle} {labels} {...headerProps} />
  {@render children?.()}
</div>

<style>
  .gui-step-scaffold {
    width:100%; display:flex; flex-direction:column; gap:1rem; padding:1rem; border:1px solid #e4e4e7; background:#fff; border-radius:1rem;
  }
</style>
