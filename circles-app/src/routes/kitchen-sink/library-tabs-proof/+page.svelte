<script lang="ts">
  import { Tabs, Tab } from '@garden-ui/tabs';

  let selectedMain = $state<string | null>('overview');
  let selectedSecondary = $state<string | null>('first');
  let selectedMany = $state<string | null>('tab-01');
  const manyTabs = Array.from({ length: 18 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      id: `tab-${number}`,
      title: `Long tab ${number}`
    };
  });
</script>

<svelte:head>
  <title>Library Tabs Proof</title>
</svelte:head>

<div class="page">
  <h1>Library tabs proof</h1>
  <p>This route demonstrates the extracted tabs package as a standalone proof surface.</p>

  <section class="section">
    <h2>Main tabs</h2>
    <button type="button" class="before-button" data-before-main-tabs>Before tabs</button>
    <Tabs id="library-tabs-proof-main" bind:selected={selectedMain} variant="boxed" size="md">
      <Tab id="overview" title="Overview">
        <div class="panel">
          <p>Overview content.</p>
          <button type="button" data-main-panel-action>Panel action</button>
        </div>
      </Tab>
      <Tab id="activity" title="Activity">
        <div class="panel">Activity content.</div>
      </Tab>
      <Tab id="disabled" title="Disabled" disabled={true}>
        <div class="panel">Disabled panel.</div>
      </Tab>
    </Tabs>
  </section>

  <section class="section">
    <h2>Secondary tabs</h2>
    <Tabs id="library-tabs-proof-secondary" bind:selected={selectedSecondary} variant="underline" size="sm">
      <Tab id="first" title="First">
        <div class="panel">First secondary panel.</div>
      </Tab>
      <Tab id="second" title="Second">
        <div class="panel">Second secondary panel.</div>
      </Tab>
      <Tab id="third" title="Third">
        <div class="panel">Third secondary panel.</div>
      </Tab>
    </Tabs>
  </section>

  <section class="section many-tabs-section" data-many-tabs-proof>
    <h2>Many tabs / horizontal overflow</h2>
    <p class="hint">
      This intentionally narrow container demonstrates that large tab sets stay horizontally scrollable. On touch devices,
      drag left/right on the tab row to pan through the tabs.
    </p>
    <div class="many-tabs-frame">
      <Tabs id="library-tabs-proof-many" bind:selected={selectedMany} variant="boxed" size="sm" class="many-tabs-scroller">
        {#each manyTabs as tab (tab.id)}
          <Tab id={tab.id} title={tab.title}>
            <div class="panel" data-many-tabs-panel={tab.id}>
              Selected many-tab panel: {tab.title}
            </div>
          </Tab>
        {/each}
      </Tabs>
    </div>
    <div class="hint" data-many-tabs-selected>Selected many tab: {selectedMany}</div>
  </section>

  <section class="section note">
    <ul>
      <li>ArrowLeft/ArrowRight switch active tabs.</li>
      <li>Home/End jump within enabled tabs.</li>
      <li>ArrowDown moves focus into the active panel.</li>
      <li>Disabled tabs are skipped during keyboard traversal.</li>
      <li>Large tab sets scroll horizontally; touch users can drag the tab row left/right.</li>
    </ul>
  </section>
</div>

<style>
  .page { max-width: 56rem; margin: 0 auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .section { display: flex; flex-direction: column; gap: .75rem; }
  .panel { padding: 1rem 0; }
  .many-tabs-frame { max-width: 22rem; border: 1px dashed #d4d4d8; border-radius: .75rem; padding: .25rem; }
  .hint { color: #52525b; font-size: .9rem; }
  .before-button {
    align-self: flex-start; border: 1px solid #d4d4d8; background: #fff; border-radius: .75rem; padding: .6rem .9rem;
  }
  .before-button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
  .note { color: #52525b; }
</style>
