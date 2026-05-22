<script lang="ts">
  import { setContext } from 'svelte';
  import { tick } from 'svelte';
  import { derived, get, readable, writable, type Readable } from 'svelte/store';
  import { ListShell } from '@garden-ui/list-shell';
  import { createListInputArrowDownHandler } from '@garden-ui/keyboard-list';
  import { Tabs, Tab } from '@garden-ui/tabs';
  import {
    createArrayListController,
    createPagedListController,
    createStoreListController,
    type ListController,
    type ListSnapshot
  } from '@garden-ui/list-data';
  import GenericList from '$lib/shared/ui/lists/GenericList.svelte';
  import ListProofRow from '$lib/mock-ui/list-proof/ListProofRow.svelte';
  import { MOCK_LIST_ITEMS, type MockListItem } from '$lib/mock-ui/list-proof/mockListData';

  const allItems = readable(MOCK_LIST_ITEMS);
  const storeBackedItems = writable(MOCK_LIST_ITEMS);
  const query = writable('');
  let sourceMode = $state<'array' | 'store' | 'paged'>('array');
  const PROOF_PAGE_SIZE = 20;
  const PROOF_ROW_HEIGHT = 104;

  const arrayBase = createArrayListController(MOCK_LIST_ITEMS, { pageSize: PROOF_PAGE_SIZE, initialPageCount: 1 });
  const storeBase = createStoreListController(storeBackedItems, { pageSize: PROOF_PAGE_SIZE, initialPageCount: 1 });
  const pagedBase = createPagedListController<MockListItem>({
    pageSize: PROOF_PAGE_SIZE,
    loadPage: async ({ page, pageSize }) => {
      await Promise.resolve();
      const start = page * pageSize;
      const slice = MOCK_LIST_ITEMS.slice(start, start + pageSize);
      return {
        items: slice,
        ended: start + pageSize >= MOCK_LIST_ITEMS.length,
        totalCount: MOCK_LIST_ITEMS.length
      };
    }
  });

  const activeBaseController = $derived.by<ListController<MockListItem>>(() => {
    if (sourceMode === 'store') return storeBase;
    if (sourceMode === 'paged') return pagedBase;
    return arrayBase;
  });

  const genericListStoreInner = writable<{ data: MockListItem[]; next: () => Promise<boolean>; ended: boolean; error?: string | null }>({
    data: [],
    next: async () => false,
    ended: false,
    error: null
  });
  const genericListStore: Readable<{ data: MockListItem[]; next: () => Promise<boolean>; ended: boolean; error?: string | null }> = {
    subscribe: genericListStoreInner.subscribe
  };

  const filteredTotals = writable({
    totalCount: MOCK_LIST_ITEMS.length,
    visibleCount: 0,
    status: 'idle',
    ended: false,
    error: null as string | null
  });
  let loadAllRuns = $state(0);
  const loadQueues = new WeakMap<ListController<MockListItem>, Promise<boolean>>();

  const locallyFilteredItems = derived([allItems, query], ([$items, $query]) => {
    const q = $query.trim().toLowerCase();
    if (!q) return $items;
    return $items.filter((item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q));
  });

  const storeDerivedFilteredItems = derived([storeBackedItems, query], ([$items, $query]) => {
    const q = $query.trim().toLowerCase();
    if (!q) return $items;
    return $items.filter((item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q));
  });

  const displayFilteredTotal = $derived.by(() => {
    if (sourceMode === 'store') return $storeDerivedFilteredItems.length;
    return $locallyFilteredItems.length;
  });

  function publishControllerSnapshot(controller: ListController<MockListItem>, snapshot: ListSnapshot<MockListItem> = get(controller)): void {
    const q = get(query).trim().toLowerCase();
    const filteredItems = q
      ? snapshot.items.filter((item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q))
      : snapshot.items;

    genericListStoreInner.set({
      data: filteredItems,
      next: () => loadMoreQueued(controller),
      ended: snapshot.ended,
      error: snapshot.error
    });

    filteredTotals.set({
      totalCount: snapshot.totalCount ?? MOCK_LIST_ITEMS.length,
      visibleCount: filteredItems.length,
      status: snapshot.status,
      ended: snapshot.ended,
      error: snapshot.error
    });
  }

  function loadMoreQueued(controller: ListController<MockListItem>): Promise<boolean> {
    const queued = loadQueues.get(controller);
    if (queued) return queued;

    const nextLoad = controller.loadMore()
      .then((hasMore) => {
        publishControllerSnapshot(controller);
        return hasMore;
      })
      .catch(() => {
        publishControllerSnapshot(controller);
        return false;
      })
      .finally(() => {
        if (loadQueues.get(controller) === nextLoad) {
          loadQueues.delete(controller);
        }
      });
    loadQueues.set(controller, nextLoad);
    return nextLoad;
  }

  $effect(() => {
    const controller = activeBaseController;
    const unsubscribe = controller.subscribe(($controller: ListSnapshot<MockListItem>) => {
      publishControllerSnapshot(controller, $controller);
    });

    return () => unsubscribe();
  });

  $effect(() => {
    $query;
    publishControllerSnapshot(activeBaseController);
  });

  let selectedItem: MockListItem | null = $state(null);
  let scopeEl: HTMLDivElement | null = $state(null);

  setContext('library-list-proof-activate', (item: MockListItem) => {
    selectedItem = item;
  });

  const onInputKeydown = createListInputArrowDownHandler({
    getScope: () => scopeEl,
    rowSelector: '[data-library-list-proof-row]'
  });

  function getCurrentController(): ListController<MockListItem> {
    if (sourceMode === 'store') return storeBase;
    if (sourceMode === 'paged') return pagedBase;
    return arrayBase;
  }

  function syncFromController(controller: ListController<MockListItem>): void {
    publishControllerSnapshot(controller);
  }

  async function loadMoreCurrent(): Promise<void> {
    const controller = getCurrentController();
    await loadMoreQueued(controller);
    await tick();
    await Promise.resolve();
    syncFromController(controller);
  }

  async function loadAllCurrent(): Promise<void> {
    const controller = getCurrentController();
    let guard = 0;
    const maxLoads = Math.ceil(MOCK_LIST_ITEMS.length / PROOF_PAGE_SIZE) + 2;
    while (guard < maxLoads) {
      const snapBefore = get(controller);
      if (snapBefore.ended) break;

      const hasMore = await loadMoreQueued(controller);
      await tick();
      await Promise.resolve();

      const snapAfter = get(controller);
      guard += 1;
      if (snapAfter.ended || !hasMore) break;
    }
    syncFromController(controller);
    loadAllRuns += 1;
  }

  async function reloadCurrent(): Promise<void> {
    const controller = getCurrentController();
    await controller.reload();
    await tick();
    await Promise.resolve();
    syncFromController(controller);
  }

  function prependStoreItem(): void {
    storeBackedItems.update((items) => [
      {
        id: `injected-${items.length + 1}`,
        title: `Injected store item ${items.length + 1}`,
        subtitle: 'Inserted into the reactive store-backed source'
      },
      ...items
    ]);
  }
</script>

<svelte:head>
  <title>Library List Proof</title>
</svelte:head>

<div class="page" bind:this={scopeEl} data-library-list-proof-scope>
  <h1>Library list proof</h1>
  <p>
    Dedicated proof of the list stack with <strong>10,000 generated items</strong>. This uses the current generic list
    renderer + virtual list + paginated adapter pattern.
  </p>

  <div class="meta">
    <div><strong>Source mode:</strong> {sourceMode}</div>
    <div><strong>Total dataset:</strong> {MOCK_LIST_ITEMS.length.toLocaleString()}</div>
    <div><strong>Filtered total:</strong> {displayFilteredTotal.toLocaleString()}</div>
    <div><strong>Visible items:</strong> {$filteredTotals.visibleCount.toLocaleString()}</div>
    <div><strong>Status:</strong> {$filteredTotals.status}</div>
    <div><strong>Ended:</strong> {$filteredTotals.ended ? 'yes' : 'no'}</div>
    <div><strong>Load-all runs:</strong> {loadAllRuns}</div>
    <div><strong>Selected:</strong> {selectedItem ? selectedItem.title : 'None'}</div>
  </div>

  {#if $filteredTotals.ended}
    <div data-library-list-proof-ended="true"></div>
  {/if}

  <Tabs id="library-list-proof-source-tabs" bind:selected={sourceMode} variant="boxed" size="sm">
    <Tab id="array" title="Array source" />
    <Tab id="store" title="Store source" />
    <Tab id="paged" title="Paged source" />
  </Tabs>

  {#if sourceMode === 'store'}
    <div class="controls">
      <button type="button" class="control-button" data-library-list-proof-add-store-item onclick={prependStoreItem}>
        Add item to store source
      </button>
    </div>
  {/if}

  <div class="controls">
    <button type="button" class="control-button" data-library-list-proof-load-more onclick={() => void loadMoreCurrent()}>
      Load more
    </button>
    <button type="button" class="control-button" data-library-list-proof-load-all onclick={() => void loadAllCurrent()}>
      Load all
    </button>
    <button type="button" class="control-button" data-library-list-proof-reload onclick={() => void reloadCurrent()}>
      Reload source
    </button>
  </div>

  <ListShell
    query={query}
    searchPlaceholder="Search 10k generated rows"
    onInputKeydown={onInputKeydown}
    inputDataAttribute="data-ui-initial-input data-library-list-proof-input"
    isEmpty={displayFilteredTotal === 0}
    emptyLabel="No generated rows match your search"
  >
    <GenericList
      store={genericListStore}
      row={ListProofRow}
      getKey={(item: MockListItem) => item.id}
      rowHeight={PROOF_ROW_HEIGHT}
      expectedPageSize={PROOF_PAGE_SIZE}
      maxPlaceholderPages={2}
    />
  </ListShell>

  <section class="assessment">
    <h2>Adapter / data-source assessment</h2>
    <ul>
      <li><strong>Good for:</strong> in-memory arrays, derived filtering, paged reveal, and virtualized row rendering.</li>
      <li><strong>Now proven:</strong> the same UI layer works with array, store-backed, and paged-remote controller variants.</li>
      <li><strong>Still deferred:</strong> iterator, async iterator, and observable adapters.</li>
      <li><strong>Design intent:</strong> the controller contract is generic, while domain-shaped search helpers stay outside the base list-data package.</li>
    </ul>
  </section>
</div>

<style>
  .page { max-width: 64rem; margin: 0 auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: .75rem;
    border: 1px solid #e4e4e7;
    background: #fafafa;
    border-radius: 1rem;
    padding: 1rem;
  }
  .assessment {
    border: 1px solid #e4e4e7;
    background: #fff;
    border-radius: 1rem;
    padding: 1rem;
  }
  .controls { display: flex; gap: .75rem; }
  .control-button {
    border: 1px solid #d4d4d8; background: #fff; border-radius: .75rem; padding: .6rem .9rem;
  }
</style>
