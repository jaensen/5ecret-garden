export type MockListItem = {
  id: string;
  title: string;
  subtitle: string;
};

export const MOCK_LIST_ITEMS: MockListItem[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: `item-${index + 1}`,
  title: `Generated item ${index + 1}`,
  subtitle: `Row ${index + 1} · ${(index % 17) + 1} tags · virtualized proof`
}));
