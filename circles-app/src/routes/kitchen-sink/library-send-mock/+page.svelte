<script lang="ts">
  import { onMount } from 'svelte';
  import { PopupHost } from '@garden-ui/popup';
  import { initPopupHistorySync } from '@garden-ui/popup-runtime';
  import { openMockSendFlow } from '$lib/mock-ui/send-flow/openMockSendFlow';
  import { Tabs, Tab } from '@garden-ui/tabs';

  let selectedTab = $state<string | null>('demo');

  onMount(() => initPopupHistorySync());
</script>

<svelte:head>
  <title>Library Send Mock</title>
</svelte:head>

<div class="page">
  <h1>Library send-flow mock</h1>
  <p>This page proves the extracted UI packages can reproduce the send-flow interaction model.</p>

  <Tabs bind:selected={selectedTab} variant="boxed" size="md">
    <Tab id="demo" title="Demo">
      <div class="panel">
        <button type="button" class="launch" data-open-mock-send onclick={openMockSendFlow}>Open mock send flow</button>
      </div>
    </Tab>
    <Tab id="notes" title="Notes">
      <div class="panel">
        <ul>
          <li>Popup shell and runtime come from the new library packages.</li>
          <li>Recipient list uses new keyboard-list + list-shell packages.</li>
          <li>Flow headers and review rows use new flow-step package.</li>
        </ul>
      </div>
    </Tab>
  </Tabs>
</div>

<PopupHost />

<style>
  .page { max-width: 56rem; margin: 0 auto; padding: 1.5rem; display:flex; flex-direction:column; gap:1rem; }
  .panel { padding: 1rem 0; }
  .launch {
    border: 0; background:#2563eb; color:#fff; border-radius:.875rem; padding:.85rem 1.1rem; cursor:pointer;
  }
  .launch:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
</style>
