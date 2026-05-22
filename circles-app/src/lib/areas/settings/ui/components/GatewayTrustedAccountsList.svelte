<script lang="ts">
  import { ListShell } from '@garden-ui/list-shell';
  import type { Readable } from 'svelte/store';
  import AvatarRowPlaceholder from '$lib/shared/ui/lists/placeholders/AvatarRowPlaceholder.svelte';
  import VirtualList from '$lib/shared/ui/lists/VirtualList.svelte';
  import TrustRowView from '$lib/areas/settings/ui/components/TrustRow.svelte';
  import type { TrustRow } from '$lib/areas/settings/model/gatewayTypes';
  import type { Writable } from 'svelte/store';
  import { readable, writable } from 'svelte/store';
  import { createListInputArrowDownHandler } from '@garden-ui/keyboard-list';
  import { createSearchablePaginatedList } from '$lib/shared/state/searchablePaginatedList';

  type TrustRowItem = TrustRow & {
    showRemove?: boolean;
    onRemove?: () => void;
  };

  interface Props {
    rows: Readable<TrustRowItem[]>;
    loading?: boolean;
    emptyLabel?: string;
    noMatchesLabel?: string;
    rowHeight?: number;
    pageSize?: number;
  }

  let {
    rows,
    loading = false,
    emptyLabel = 'No trusted accounts yet.',
    noMatchesLabel = 'No matching trusted accounts.',
    rowHeight = 72,
    pageSize = 25
  }: Props = $props();

  let trustListScopeEl: HTMLDivElement | null = $state(null);
  const emptyItems = readable<any[]>([]);

  let searchQuery = $state<Writable<string>>(writable(''));
  let filteredItems = $state<Readable<any[]>>(emptyItems);
  let paginatedItems = $state<any>(emptyItems);

  $effect(() => {
    const next = createSearchablePaginatedList(rows, {
      pageSize,
      addressOf: (item) => String(item.trustReceiver) as any,
    });

    searchQuery = next.searchQuery;
    filteredItems = next.filteredItems;
    paginatedItems = next.paginatedItems;
  });

  const onInputArrowDown = createListInputArrowDownHandler({
    getScope: () => trustListScopeEl,
    rowSelector: '[data-gateway-trust-row]'
  });
</script>

<div data-gateway-trust-list-scope bind:this={trustListScopeEl}>
  <ListShell
    query={searchQuery}
    searchPlaceholder="Search by address or name"
    onInputKeydown={onInputArrowDown}
    inputDataAttribute="data-gateway-trust-search-input"
    {loading}
    isEmpty={$rows.length === 0}
    isNoMatches={$rows.length > 0 && $filteredItems.length === 0}
    emptyLabel={emptyLabel}
    noMatchesLabel={noMatchesLabel}
  >
    <VirtualList
      store={paginatedItems}
      row={TrustRowView}
      getKey={(item) => String(item.trustReceiver)}
      rowHeight={rowHeight}
      expectedPageSize={pageSize}
      maxPlaceholderPages={2}
      placeholderRow={AvatarRowPlaceholder}
    />
  </ListShell>
</div>
