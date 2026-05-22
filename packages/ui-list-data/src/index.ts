import { derived, get, readable, writable, type Readable } from 'svelte/store';

export type ListStatus =
  | 'idle'
  | 'loading-initial'
  | 'ready'
  | 'loading-more'
  | 'refreshing'
  | 'error';

export type ListSnapshot<T> = {
  items: T[];
  status: ListStatus;
  ended: boolean;
  error: string | null;
  totalCount?: number;
};

export type ListController<T> = Readable<ListSnapshot<T>> & {
  loadMore: () => Promise<boolean>;
  reload: () => Promise<void>;
  reset: () => void;
};

export type ArrayListControllerOptions = {
  pageSize?: number;
  initialPageCount?: number;
};

function createController<T>(initial: ListSnapshot<T>) {
  const inner = writable(initial);
  return {
    subscribe: inner.subscribe,
    set: inner.set,
    update: inner.update,
    get snapshot() {
      return get(inner);
    }
  };
}

export function createArrayListController<T>(items: T[], opts: ArrayListControllerOptions = {}): ListController<T> {
  const pageSize = opts.pageSize ?? 25;
  const initialPageCount = Math.max(1, opts.initialPageCount ?? 1);
  let visibleCount = Math.min(items.length, pageSize * initialPageCount);
  const controller = createController<T>({
    items: items.slice(0, visibleCount),
    status: 'ready',
    ended: visibleCount >= items.length,
    error: null,
    totalCount: items.length
  });

  const loadMore = async () => {
    const snap = controller.snapshot;
    if (snap.ended || snap.status === 'loading-more') return false;
    controller.update((current) => ({ ...current, status: 'loading-more' }));
    visibleCount = Math.min(items.length, visibleCount + pageSize);
    controller.set({
      items: items.slice(0, visibleCount),
      status: 'ready',
      ended: visibleCount >= items.length,
      error: null,
      totalCount: items.length
    });
    return visibleCount < items.length;
  };

  const reload = async () => {
    visibleCount = Math.min(items.length, pageSize * initialPageCount);
    controller.set({
      items: items.slice(0, visibleCount),
      status: 'ready',
      ended: visibleCount >= items.length,
      error: null,
      totalCount: items.length
    });
  };

  const reset = () => {
    visibleCount = Math.min(items.length, pageSize * initialPageCount);
    controller.set({
      items: items.slice(0, visibleCount),
      status: 'ready',
      ended: visibleCount >= items.length,
      error: null,
      totalCount: items.length
    });
  };

  return { subscribe: controller.subscribe, loadMore, reload, reset };
}

export function createStoreListController<T>(items: Readable<T[]>, opts: ArrayListControllerOptions = {}): ListController<T> {
  const pageSize = opts.pageSize ?? 25;
  const initialPageCount = Math.max(1, opts.initialPageCount ?? 1);
  const currentItems = writable<T[]>([]);
  let full: T[] = [];
  let visibleCount = 0;

  items.subscribe((arr) => {
    full = Array.isArray(arr) ? arr : [];
    visibleCount = Math.min(full.length, pageSize * initialPageCount);
    currentItems.set(full.slice(0, visibleCount));
  });

  const snapshot = derived(currentItems, ($items): ListSnapshot<T> => ({
    items: $items,
    status: 'ready',
    ended: visibleCount >= full.length,
    error: null,
    totalCount: full.length
  }));

  const loadMore = async () => {
    if (visibleCount >= full.length) return false;
    visibleCount = Math.min(full.length, visibleCount + pageSize);
    currentItems.set(full.slice(0, visibleCount));
    return visibleCount < full.length;
  };

  const reload = async () => {
    visibleCount = Math.min(full.length, pageSize * initialPageCount);
    currentItems.set(full.slice(0, visibleCount));
  };

  const reset = () => {
    visibleCount = Math.min(full.length, pageSize * initialPageCount);
    currentItems.set(full.slice(0, visibleCount));
  };

  return { subscribe: snapshot.subscribe, loadMore, reload, reset };
}

export type PagedListControllerOptions<T> = {
  pageSize?: number;
  getQuery?: () => string | undefined;
  loadPage: (args: { page: number; pageSize: number; query?: string }) => Promise<{
    items: T[];
    ended: boolean;
    totalCount?: number;
  }>;
};

export function createPagedListController<T>(opts: PagedListControllerOptions<T>): ListController<T> {
  const pageSize = opts.pageSize ?? 25;
  let page = 0;
  let items: T[] = [];
  let ended = false;
  let totalCount: number | undefined = undefined;
  let initialLoad: Promise<void> | null = null;
  let inFlightLoad: Promise<boolean> | null = null;
  let query = opts.getQuery?.();
  const controller = createController<T>({
    items: [],
    status: 'idle',
    ended: false,
    error: null,
    totalCount: undefined
  });

  const loadInitial = async () => {
    controller.update((current) => ({ ...current, status: 'loading-initial', error: null }));
    try {
      query = opts.getQuery?.();
      const result = await opts.loadPage({ page: 0, pageSize, query });
      page = 1;
      items = result.items;
      ended = result.ended;
      totalCount = result.totalCount;
      controller.set({ items, status: 'ready', ended, error: null, totalCount });
    } catch (error) {
      controller.set({ items: [], status: 'error', ended: false, error: error instanceof Error ? error.message : 'Failed to load', totalCount });
    }
  };

  const ensureInitialLoaded = async () => {
    if (initialLoad) {
      await initialLoad;
    }
  };

  const loadMore = async () => {
    await ensureInitialLoaded();
    const snap = controller.snapshot;
    const nextQuery = opts.getQuery?.();
    const queryChanged = nextQuery !== query;
    if (snap.ended && !queryChanged) return false;
    if (inFlightLoad) return inFlightLoad;

    inFlightLoad = (async () => {
      controller.update((current) => ({ ...current, status: 'loading-more', error: null }));
      try {
        if (queryChanged) {
          page = 0;
          items = [];
          ended = false;
          query = nextQuery;
        }
        const result = await opts.loadPage({ page, pageSize, query });
        page += 1;
        items = [...items, ...result.items];
        ended = result.ended;
        totalCount = result.totalCount ?? totalCount;
        controller.set({ items, status: 'ready', ended, error: null, totalCount });
        return !ended;
      } catch (error) {
        controller.set({ items, status: 'error', ended, error: error instanceof Error ? error.message : 'Failed to load more', totalCount });
        return false;
      } finally {
        inFlightLoad = null;
      }
    })();

    return inFlightLoad;
  };

  const reload = async () => {
    await ensureInitialLoaded();
    page = 0;
    items = [];
    ended = false;
    initialLoad = loadInitial().finally(() => {
      initialLoad = null;
    });
    await initialLoad;
  };

  const reset = () => {
    page = 0;
    items = [];
    ended = false;
    controller.set({ items: [], status: 'idle', ended: false, error: null, totalCount: undefined });
  };

  initialLoad = loadInitial().finally(() => {
    initialLoad = null;
  });

  return { subscribe: controller.subscribe, loadMore, reload, reset };
}

export function withFilter<T>(controller: ListController<T>, filterFn: (item: T) => boolean): ListController<T> {
  const filtered = derived(controller, ($controller): ListSnapshot<T> => ({
    ...$controller,
    items: $controller.items.filter(filterFn),
    totalCount: $controller.totalCount
  }));
  return {
    subscribe: filtered.subscribe,
    loadMore: controller.loadMore,
    reload: controller.reload,
    reset: controller.reset
  };
}

export function withSort<T>(controller: ListController<T>, compareFn: (a: T, b: T) => number): ListController<T> {
  const sorted = derived(controller, ($controller): ListSnapshot<T> => ({
    ...$controller,
    items: [...$controller.items].sort(compareFn)
  }));
  return {
    subscribe: sorted.subscribe,
    loadMore: controller.loadMore,
    reload: controller.reload,
    reset: controller.reset
  };
}
