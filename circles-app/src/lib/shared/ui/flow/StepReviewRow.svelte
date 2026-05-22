<script lang="ts">
  import { StepReviewRow as PackageStepReviewRow } from '@garden-ui/flow-step';
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

  let {
    label,
    value,
    onChange,
    changeLabel = 'Change',
    className = '',
    valueClassName = '',
    children,
  }: Props = $props();
</script>

<PackageStepReviewRow
  {label}
  {value}
  {onChange}
  {changeLabel}
  {children}
  unstyled
  className={`flex items-start justify-between gap-3 ${className}`.trim()}
  mainClassName="min-w-0"
  labelClassName="text-xs text-base-content/60"
  valueClassName={`text-sm ${valueClassName}`.trim()}
  buttonClassName="btn btn-ghost btn-xs"
/>
