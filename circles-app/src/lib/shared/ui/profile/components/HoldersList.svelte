<script lang="ts">
    import { ListShell } from '@garden-ui/list-shell';
    import HoldersRow from '$lib/shared/ui/profile/components/HoldersRow.svelte';
    import AvatarRowPlaceholder from '$lib/shared/ui/lists/placeholders/AvatarRowPlaceholder.svelte';
    import VirtualList from '$lib/shared/ui/lists/VirtualList.svelte';
    import type { Address } from '@circles-sdk/utils';
    import type { TrustRelation } from '@circles-sdk/data';
    import type { Readable, Writable } from 'svelte/store';
    import { readable, writable } from 'svelte/store';
    import { createListInputArrowDownHandler } from '@garden-ui/keyboard-list';
    import { createSearchablePaginatedList } from '$lib/shared/state/searchablePaginatedList';
    import { usePopupListFocusRestore } from '$lib/shared/ui/profile/utils/popupListFocusRestore';

    interface HolderRow {
        avatar: Address;
        amount: bigint;
        amountToRedeem: bigint;
        amountToRedeemInCircles: number;
        trustRelation?: TrustRelation;
    }

    interface Props {
        holders: HolderRow[];
        emptyLabel?: string;
        noMatchesLabel?: string;
        searchPlaceholder?: string;
    }

    let {
        holders,
        emptyLabel = 'No holders',
        noMatchesLabel = 'No matches',
        searchPlaceholder = 'Search by address or name'
    }: Props = $props();
    let listScopeEl: HTMLDivElement | null = $state(null);

    const holdersStore = writable<HolderRow[]>([]);
    const emptyItems = readable<any[]>([]);

    let searchQuery = $state<Writable<string>>(writable(''));
    let filteredItems = $state<Readable<any[]>>(emptyItems);
    let paginatedItems = $state<any>(emptyItems);

    $effect(() => {
        holdersStore.set(holders);
    });

    $effect(() => {
        const next = createSearchablePaginatedList(holdersStore, {
            pageSize: 25,
            addressOf: (item) => String(item.avatar) as Address,
        });

        searchQuery = next.searchQuery;
        filteredItems = next.filteredItems;
        paginatedItems = next.paginatedItems;
    });

    const onInputArrowDown = createListInputArrowDownHandler({
        getScope: () => listScopeEl,
        rowSelector: '[data-holder-row]'
    });
    usePopupListFocusRestore({
        getScope: () => listScopeEl,
        rowSelector: '[data-holder-row]',
        rowAddressAttribute: 'data-row-address',
    });
</script>

<div
    data-profile-holders-list-scope
    bind:this={listScopeEl}
>
    <ListShell
        query={searchQuery}
        searchPlaceholder={searchPlaceholder}
        onInputKeydown={onInputArrowDown}
        inputDataAttribute="data-holders-search-input"
        isEmpty={$holdersStore.length === 0}
        isNoMatches={$holdersStore.length > 0 && $filteredItems.length === 0}
        {emptyLabel}
        {noMatchesLabel}
    >
        <VirtualList
            store={paginatedItems}
            row={HoldersRow}
            getKey={(item) => String(item.avatar)}
            rowHeight={64}
            pageSize={25}
            expectedPageSize={25}
            maxPlaceholderPages={2}
            placeholderRow={AvatarRowPlaceholder}
        />
    </ListShell>
</div>