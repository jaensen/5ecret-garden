<script lang="ts">
  const typeContractRows = [
    {
      domain: 'profile',
      file: '$lib/shared/model/profile/bindings.ts',
      exports: 'CidV0, ProfilesBindingsWithMedia, getProfilesBindings(...)'
    },
    {
      domain: 'profile',
      file: '$lib/shared/model/profile/namespacesEditor.ts',
      exports: 'loadNamespaceLinks(...), rewriteNamespaceFromLinks(...), applyEditableLinkMetadata(...)'
    },
    {
      domain: 'settings',
      file: '$lib/areas/settings/model/gatewayTypes.ts',
      exports: 'GatewayRow, TrustRow, gateway-related UI contracts'
    }
  ];

  const sampleOrderEvent = {
    orderId: 'order-42',
    at: new Date().toISOString(),
    status: 'PROCESSING',
    source: 'kitchen-sink-demo'
  };
</script>

<section class="rounded-xl border border-base-300 bg-base-100 p-4 space-y-4">
  <h2 class="text-lg font-semibold">Data & Types</h2>
  <p class="text-sm opacity-70">
    Contract-focused playground for surviving shared and settings type modules after the market/admin removal.
  </p>

  <div class="space-y-2">
    <h3 class="font-medium">Type contract index</h3>
    <div class="overflow-x-auto">
      <table class="table table-xs">
        <thead>
          <tr><th>Domain</th><th>Module</th><th>Exports (excerpt)</th></tr>
        </thead>
        <tbody>
          {#each typeContractRows as row}
            <tr>
              <td><span class="badge badge-outline badge-sm">{row.domain}</span></td>
              <td><code>{row.file}</code></td>
              <td class="opacity-80">{row.exports}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-2">
    <h3 class="font-medium">Order event payload snapshot (mock)</h3>
    <div class="rounded-lg border border-base-300 p-3 bg-base-200/20 text-xs">
      <pre class="whitespace-pre-wrap break-all">{JSON.stringify(sampleOrderEvent, null, 2)}</pre>
    </div>
  </div>
</section>
