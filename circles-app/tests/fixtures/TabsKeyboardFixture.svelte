<script lang="ts">
  import { Tabs, Tab } from '@garden-ui/tabs';

  let selected = $state<string | null>('alpha');
</script>

<button type="button" data-before-tabs>Before</button>

<Tabs id="tabs-fixture-primary" bind:selected={selected} variant="boxed" size="md">
  <Tab id="alpha" title="Alpha">
    <button type="button" data-panel-button>Panel action</button>
  </Tab>
  <Tab id="beta" title="Beta">
    <div>Beta panel</div>
  </Tab>
  <Tab id="gamma" title="Gamma" disabled={true}>
    <div>Gamma panel</div>
  </Tab>
</Tabs>
