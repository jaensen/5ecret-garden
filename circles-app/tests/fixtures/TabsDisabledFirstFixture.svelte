<script lang="ts">
  import { Tabs, Tab } from '@garden-ui/tabs';

  let selected = $state<string | null>(null);
</script>

<Tabs id="tabs-disabled-first" bind:selected={selected} variant="boxed" size="md">
  <Tab id="disabled" title="Disabled" disabled={true}>
    <button type="button" data-disabled-panel-action>Hidden disabled action</button>
  </Tab>
  <Tab id="enabled" title="Enabled">
    <button type="button" data-enabled-panel-action>Enabled action</button>
  </Tab>
</Tabs>

<div data-selected-value>{selected}</div>