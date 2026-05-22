import { derived, type Readable } from 'svelte/store';
import { createStoreListController } from '@garden-ui/list-data';

export type PaginatedReadable<T = any> = Readable<{
  data: T[];
  next: () => Promise<boolean>;
  ended: boolean;
}>;

export function createPaginatedList<T = any>(
  source: Readable<T[]>,
  opts: { pageSize?: number; initialPageCount?: number } = {}
): PaginatedReadable<T> {
  const controller = createStoreListController(source, {
    pageSize: opts.pageSize,
    initialPageCount: opts.initialPageCount,
  });

  return derived(controller, ($controller) => ({
    data: $controller.items,
    next: controller.loadMore,
    ended: $controller.ended,
    error: $controller.error,
  }));
}
