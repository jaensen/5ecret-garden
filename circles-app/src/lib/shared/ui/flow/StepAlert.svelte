<script lang="ts">
  import { StepAlert as PackageStepAlert } from '@garden-ui/flow-step';
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

  let {
    variant = 'info',
    title,
    message,
    className = '',
    ariaLive = 'polite',
    action,
    children,
  }: Props = $props();

  const variantClass = $derived(`alert-${variant}`);
</script>

<PackageStepAlert
  {variant}
  {title}
  {message}
  {ariaLive}
  {action}
  {children}
  unstyled
  className={`alert ${variantClass} py-2 text-sm ${className}`.trim()}
  contentClassName="w-full flex items-start justify-between gap-3"
  bodyClassName="min-w-0"
  titleClassName="font-semibold"
  actionClassName="ml-auto shrink-0 flex justify-end self-start text-right"
/>
