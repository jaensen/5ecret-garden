import { describe, expect, it } from 'vitest';
import { get, readable, writable } from 'svelte/store';
import {
  createArrayListController,
  createPagedListController,
  createStoreListController,
  withFilter,
  withSort
} from '../../packages/ui-list-data/src/index';

describe('@garden-ui/list-data', () => {
  it('supports simple array pagination', async () => {
    const controller = createArrayListController([1, 2, 3, 4, 5], { pageSize: 2, initialPageCount: 1 });
    expect(get(controller).items).toEqual([1, 2]);
    await controller.loadMore();
    expect(get(controller).items).toEqual([1, 2, 3, 4]);
    await controller.loadMore();
    expect(get(controller).items).toEqual([1, 2, 3, 4, 5]);
    expect(get(controller).ended).toBe(true);
  });

  it('supports store-backed data', async () => {
    const store = writable([1, 2, 3]);
    const controller = createStoreListController(store, { pageSize: 2, initialPageCount: 1 });
    expect(get(controller).items).toEqual([1, 2]);
    store.set([9, 8, 7, 6]);
    expect(get(controller).items).toEqual([9, 8]);
  });

  it('supports paged remote loading', async () => {
    const controller = createPagedListController<number>({
      pageSize: 2,
      loadPage: async ({ page, pageSize }) => {
        const all = [1, 2, 3, 4, 5];
        const start = page * pageSize;
        const items = all.slice(start, start + pageSize);
        return { items, ended: start + pageSize >= all.length, totalCount: all.length };
      }
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(get(controller).items).toEqual([1, 2]);
    await controller.loadMore();
    expect(get(controller).items).toEqual([1, 2, 3, 4]);
    await controller.loadMore();
    expect(get(controller).items).toEqual([1, 2, 3, 4, 5]);
    expect(get(controller).ended).toBe(true);
  });

  it('passes current query to paged loaders and resets when the query changes', async () => {
    let query = 'a';
    const calls: Array<{ page: number; query?: string }> = [];
    const controller = createPagedListController<string>({
      pageSize: 2,
      getQuery: () => query,
      loadPage: async ({ page, pageSize, query }) => {
        calls.push({ page, query });
        const all = query === 'b' ? ['banana', 'blueberry', 'blackberry'] : ['apple', 'apricot', 'avocado'];
        const start = page * pageSize;
        return { items: all.slice(start, start + pageSize), ended: start + pageSize >= all.length, totalCount: all.length };
      }
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(get(controller).items).toEqual(['apple', 'apricot']);

    query = 'b';
    await controller.loadMore();

    expect(calls).toEqual([
      { page: 0, query: 'a' },
      { page: 0, query: 'b' }
    ]);
    expect(get(controller).items).toEqual(['banana', 'blueberry']);
    expect(get(controller).ended).toBe(false);
  });

  it('can start a new server-filtered query even after the previous query ended', async () => {
    let query = 'short';
    const controller = createPagedListController<string>({
      pageSize: 2,
      getQuery: () => query,
      loadPage: async ({ page, pageSize, query }) => {
        const all = query === 'long' ? ['one', 'two', 'three'] : ['only'];
        const start = page * pageSize;
        return { items: all.slice(start, start + pageSize), ended: start + pageSize >= all.length, totalCount: all.length };
      }
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(get(controller).items).toEqual(['only']);
    expect(get(controller).ended).toBe(true);

    query = 'long';
    await controller.loadMore();

    expect(get(controller).items).toEqual(['one', 'two']);
    expect(get(controller).ended).toBe(false);
  });

  it('supports filter and sort wrappers', () => {
    const controller = createArrayListController([3, 1, 4, 2], { pageSize: 10 });
    const filtered = withFilter(controller, (item) => item >= 2);
    const sorted = withSort(filtered, (a, b) => a - b);
    expect(get(sorted).items).toEqual([2, 3, 4]);
  });
});