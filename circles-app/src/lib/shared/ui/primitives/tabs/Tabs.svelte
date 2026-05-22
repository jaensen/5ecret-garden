<script lang="ts">
  import { Tabs as GardenTabs } from '@garden-ui/tabs';
  import type { Snippet } from 'svelte';

  type LegacyVariant = 'plain' | 'bordered' | 'lifted' | 'boxed';
  type LegacySize = 'xs' | 'sm' | 'md' | 'lg';
  type GardenVariant = 'plain' | 'boxed' | 'underline';
  type GardenSize = 'sm' | 'md' | 'lg';

  type Props = {
    selected?: string | null;
    defaultValue?: string | null;
    variant?: LegacyVariant;
    size?: LegacySize;
    fitted?: boolean;
    class?: string;
    id?: string;
    tabOrder?: string[];
    children?: Snippet;
  };

  let {
    selected = $bindable<string | null>(null),
    defaultValue = null,
    variant = 'bordered',
    size = 'md',
    fitted = false,
    class: className = '',
    id = undefined,
    tabOrder = undefined,
    children,
  }: Props = $props();

  const mappedVariant: GardenVariant = $derived(
    variant === 'boxed' ? 'boxed' : variant === 'plain' ? 'plain' : 'underline'
  );
  const mappedSize: GardenSize = $derived(size === 'xs' || size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md');
</script>

<GardenTabs
  bind:selected
  {defaultValue}
  variant={mappedVariant}
  size={mappedSize}
  {fitted}
  class={className}
  {id}
  {tabOrder}
>
  {@render children?.()}
</GardenTabs>
