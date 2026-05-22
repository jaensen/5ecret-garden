<script lang="ts">
  import { FlowStepHeader as PackageFlowStepHeader } from '@garden-ui/flow-step';

  interface Props {
    step: number;
    total: number;
    title: string;
    subtitle?: string;
    labels?: readonly string[];
  }

  let { step, total, title, subtitle, labels = [] }: Props = $props();
</script>

<PackageFlowStepHeader
  {step}
  {total}
  {title}
  {subtitle}
  {labels}
  className="space-y-1.5"
  topClassName="flex items-start justify-between gap-3"
  titleWrapClassName="min-w-0"
  titleClassName="text-sm font-medium leading-tight text-base-content/90"
  subtitleClassName="text-xs text-base-content/60 mt-0.5"
  badgeClassName="badge badge-ghost badge-xs shrink-0 text-base-content/70"
  progressClassName="flex items-center gap-1"
  segmentClassName="h-1 flex-1 rounded-full bg-base-300 transition-colors"
  activeSegmentClassName="bg-primary opacity-75"
  inactiveSegmentClassName="opacity-45"
  labelsClassName="text-[10px] flex items-center justify-between gap-2"
  labelClassName="truncate transition-opacity text-base-content"
  activeLabelClassName="opacity-80"
  inactiveLabelClassName="opacity-45"
/>
