<script lang="ts">
    import type { Component } from 'svelte';
    import { ListShell } from '@garden-ui/list-shell';
    import AvatarRowPlaceholder from '$lib/shared/ui/lists/placeholders/AvatarRowPlaceholder.svelte';
    import VirtualList from '$lib/shared/ui/lists/VirtualList.svelte';
    import TrustRelationRow from '$lib/shared/ui/profile/components/TrustRelationRow.svelte';
    import type { Address } from '@circles-sdk/utils';
    import type { Readable, Writable } from 'svelte/store';
    import { readable, writable } from 'svelte/store';
    import { createListInputArrowDownHandler } from '@garden-ui/keyboard-list';
    import { createSearchablePaginatedList } from '$lib/shared/state/searchablePaginatedList';
    import { usePopupListFocusRestore } from '$lib/shared/ui/profile/utils/popupListFocusRestore';

    interface Props {
        addresses: Readable<Address[]>;
        row?: Component<{ item: Address }>;
        getKey?: (addr: Address) => string;
        emptyLabel?: string;
        noMatchesLabel?: string;
        loading?: boolean;
        error?: string | null;
        rowHeight?: number;
        pageSize?: number;
        searchPlaceholder?: string;
    }

    let {
        addresses,
        row = TrustRelationRow,
        getKey = (addr) => String(addr),
        emptyLabel = 'No connections',
        noMatchesLabel = 'No matches',
        loading = false,
        error = null,
        rowHeight = 64,
        pageSize = 25,
        searchPlaceholder = 'Search by address or name'
    }: Props = $props();

    let listScopeEl: HTMLDivElement | null = $state(null);
    const emptyItems = readable<any[]>([]);

    let searchQuery = $state<Writable<string>>(writable(''));
    let filteredItems = $state<Readable<any[]>>(emptyItems);
    let paginatedItems = $state<any>(emptyItems);

    $effect(() => {
        const next = createSearchablePaginatedList(addresses, {
            pageSize,
            addressOf: (item) => String(item) as Address,
        });

        searchQuery = next.searchQuery;
        filteredItems = next.filteredItems;
        paginatedItems = next.paginatedItems;
    });

    const onInputArrowDown = createListInputArrowDownHandler({
        getScope: () => listScopeEl,
        rowSelector: '[data-trust-relation-row]'
    });
    usePopupListFocusRestore({
        getScope: () => listScopeEl,
        rowSelector: '[data-trust-relation-row]',
        rowAddressAttribute: 'data-row-address',
    });
</script>

<div data-profile-relations-list-scope bind:this={listScopeEl}>
    <ListShell
        query={searchQuery}
        searchPlaceholder={searchPlaceholder}
        onInputKeydown={onInputArrowDown}
        inputDataAttribute="data-profile-relations-search-input"
        {loading}
        {error}
        isEmpty={$addresses.length === 0}
        isNoMatches={$addresses.length > 0 && $filteredItems.length === 0}
        emptyLabel={emptyLabel}
        noMatchesLabel={noMatchesLabel}
    >
        <VirtualList
            store={paginatedItems}
            {row}
            getKey={getKey}
            rowHeight={rowHeight}
            expectedPageSize={pageSize}
            maxPlaceholderPages={2}
            placeholderRow={AvatarRowPlaceholder}
        />
    </ListShell>
</div>