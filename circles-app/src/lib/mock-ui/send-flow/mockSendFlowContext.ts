export type MockRecipient = {
  id: string;
  name: string;
  address: string;
};

export type MockSendFlowContext = {
  recipient?: MockRecipient;
  amount: string;
  note: string;
  routeStatus: 'ready' | 'loading' | 'unavailable';
};

export function createMockSendFlowContext(initial?: Partial<MockSendFlowContext>): MockSendFlowContext {
  return {
    recipient: initial?.recipient,
    amount: initial?.amount ?? '',
    note: initial?.note ?? '',
    routeStatus: initial?.routeStatus ?? 'ready'
  };
}

export const MOCK_RECIPIENTS: MockRecipient[] = [
  { id: 'alice', name: 'Alice Example', address: '0x1111...aaaa' },
  { id: 'bob', name: 'Bob Example', address: '0x2222...bbbb' },
  { id: 'carol', name: 'Carol Example', address: '0x3333...cccc' }
];
