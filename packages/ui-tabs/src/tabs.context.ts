import type { Readable } from 'svelte/store';

export type TabRegistration = {
  id: string;
  title: string;
  disabled: boolean;
  badge?: number | string;
};

export type TabsContext = {
  register(info: TabRegistration): () => void;
  isSelected(id: string): boolean;
  select(id: string, focus?: boolean): void;
  selected$?: Readable<string | null>;
  getHostId?: () => string;
};

export const TABS_CTX = Symbol('GardenUiTabsContext');
