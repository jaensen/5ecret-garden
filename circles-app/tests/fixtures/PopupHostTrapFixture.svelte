<script lang="ts">
  let { onClose = undefined as (() => void) | undefined } = $props();
</script>

<button type="button" data-ui-initial-focus>First</button>
<button type="button" onclick={() => onClose?.()}>Second</button>
