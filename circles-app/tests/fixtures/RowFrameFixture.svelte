<script lang="ts">
  import { RowFrame } from '@garden-ui/row';

  let { onActivate = undefined as (() => void) | undefined } = $props();
</script>

<RowFrame clickable={true} selected={true} onclick={() => onActivate?.()} data-clickable-row>
  {#snippet leading()}<span data-leading>👤</span>{/snippet}
  {#snippet title()}Alice Example{/snippet}
  {#snippet subtitle()}Primary row subtitle{/snippet}
  {#snippet meta()}Row metadata{/snippet}
  {#snippet trailing()}<button type="button" data-trailing-action onclick={() => onActivate?.()}>CRC</button>{/snippet}
</RowFrame>

<RowFrame clickable={true} disabled={true} onclick={() => onActivate?.()} data-disabled-row>
  {#snippet title()}Disabled row{/snippet}
</RowFrame>

<RowFrame dense={true} noLeading={true} data-passive-row>
  {#snippet title()}Passive dense row{/snippet}
</RowFrame>