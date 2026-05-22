<script lang="ts">
  import { StepSection as PackageStepSection } from '@garden-ui/flow-step';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    className?: string;
    titleClassName?: string;
    children?: Snippet;
  }

  let {
    title,
    subtitle,
    className = '',
    titleClassName = '',
    children,
  }: Props = $props();
</script>

<PackageStepSection {title} {subtitle} {className} {titleClassName} {children} />
