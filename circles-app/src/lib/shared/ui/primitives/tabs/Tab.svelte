<script lang="ts">
  import { Tab as GardenTab } from '@garden-ui/tabs';
  import type { Snippet } from 'svelte';

  type Props = {
    id?: string;
    title?: string;
    badge?: number | string;
    disabled?: boolean;
    panelClass?: string;
    hostId?: string;
    children?: Snippet;
  };

  let {
    id = '',
    title = '',
    badge = undefined,
    disabled = false,
    panelClass = '',
    hostId = undefined,
    children,
  }: Props = $props();
</script>

<GardenTab {id} {title} {badge} {disabled} {panelClass} {hostId}>
  {@render children?.()}
</GardenTab>
