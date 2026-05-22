<script lang="ts">
  let { onDefaultAction = undefined as (() => void) | undefined } = $props();
</script>

<div data-ui-initial-focus tabindex="-1">
  <div data-popup-static-focus tabindex="-1">Static focus target</div>
  <button type="button" data-ui-default-action onclick={() => onDefaultAction?.()}>Confirm</button>
</div>
