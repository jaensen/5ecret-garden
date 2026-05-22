import { describe, expect, it, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { initPopupHistorySync, popupControls, popupState, popupHistoryForwardNoopTick } from '../../packages/ui-popup-runtime/src/index';

const COMPONENT_A = {} as any;
const COMPONENT_B = {} as any;

function setupFakeWindow() {
  const listeners = new Map<string, Set<(event: any) => void>>();
  const entries: Record<string, unknown>[] = [{}];
  let index = 0;

  const dispatchPopState = (state: any) => {
    for (const listener of listeners.get('popstate') ?? []) {
      listener({ state });
    }
  };

  const history = {
    get state() { return entries[index]; },
    pushState: vi.fn((state: any) => { entries.splice(index + 1); entries.push({ ...(state ?? {}) }); index = entries.length - 1; }),
    replaceState: vi.fn((state: any) => { entries[index] = { ...(state ?? {}) }; }),
    back: vi.fn(() => { if (index <= 0) return; index -= 1; dispatchPopState(entries[index]); }),
    go: vi.fn((delta: number) => {
      const target = index + Math.trunc(delta);
      if (target < 0 || target >= entries.length) return;
      index = target;
      dispatchPopState(entries[index]);
    })
  };

  const fakeWindow = {
    history,
    location: { href: 'https://example.com/mock' },
    addEventListener(type: string, listener: (event: any) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: (event: any) => void) {
      listeners.get(type)?.delete(listener);
    }
  } as any;

  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = fakeWindow;
  return {
    restore() { (globalThis as any).window = originalWindow; }
  };
}

afterEach(() => {
  popupState.set({ content: null, stack: [] });
  popupHistoryForwardNoopTick.set(0);
});

describe('@garden-ui/popup-runtime', () => {
  it('opens and backs through history-aware popup depth', () => {
    const { restore } = setupFakeWindow();
    const dispose = initPopupHistorySync();
    popupControls.open({ title: 'A', component: COMPONENT_A, props: {} });
    popupControls.open({ title: 'B', component: COMPONENT_B, props: {} });
    expect(get(popupState).stack).toHaveLength(1);
    popupControls.back();
    expect(get(popupState).content?.component).toBe(COMPONENT_A);
    dispose();
    restore();
  });

  it('closes all popup levels', () => {
    const { restore } = setupFakeWindow();
    const dispose = initPopupHistorySync();
    popupControls.open({ title: 'A', component: COMPONENT_A, props: {} });
    popupControls.open({ title: 'B', component: COMPONENT_B, props: {} });
    popupControls.close();
    expect(get(popupState).content).toBeNull();
    expect(get(popupState).stack).toHaveLength(0);
    dispose();
    restore();
  });

  it('runs onClose for discarded popup levels when closing, backing, replacing, and popping', () => {
    const onA = vi.fn();
    const onB = vi.fn();
    const onC = vi.fn();
    const onD = vi.fn();

    popupControls.open({ id: 'a', title: 'A', component: COMPONENT_A, props: {}, onClose: onA });
    popupControls.open({ id: 'b', title: 'B', component: COMPONENT_B, props: {}, onClose: onB });
    popupControls.back();
    expect(onB).toHaveBeenCalledTimes(1);
    expect(get(popupState).content?.id).toBe('a');

    popupControls.replace({ id: 'c', title: 'C', component: COMPONENT_A, props: {}, onClose: onC });
    expect(onA).toHaveBeenCalledTimes(1);
    expect(get(popupState).content?.id).toBe('c');

    popupControls.open({ id: 'd', title: 'D', component: COMPONENT_B, props: {}, onClose: onD });
    popupControls.popTo((entry) => entry.id === 'c');
    expect(onD).toHaveBeenCalledTimes(1);
    expect(get(popupState).content?.id).toBe('c');

    popupControls.close();
    expect(onC).toHaveBeenCalledTimes(1);
    expect(get(popupState).content).toBeNull();
  });
});
