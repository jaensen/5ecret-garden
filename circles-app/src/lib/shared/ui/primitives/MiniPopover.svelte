<script lang="ts">
  import { onMount } from 'svelte';
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import { X as LX } from 'lucide';

  interface Props {
    title?: string;
    open?: boolean;
    triggerClass?: string;
    align?: 'start' | 'end' | 'center';
    widthClass?: string;
    panelClass?: string;
    mobileTitle?: string;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
  }

  let {
    title = '',
    open = $bindable(false),
    triggerClass = '',
    align = 'end',
    widthClass = 'w-80',
    panelClass = '',
    mobileTitle = title,
    closeOnBackdrop = true,
    closeOnEscape = true,
    onOpen = undefined,
    onClose = undefined,
  }: Props = $props();

  const usesWideTrigger = $derived(triggerClass.includes('btn-utility-soft'));

  let rootEl: HTMLDivElement | null = $state(null);
  let triggerEl: HTMLButtonElement | null = $state(null);
  let desktopPanelEl: HTMLDivElement | null = $state(null);
  let mobilePanelEl: HTMLDivElement | null = $state(null);
  let isMobile = $state(false);

  const ALIGN_CLASS: Record<NonNullable<Props['align']>, string> = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  function updateViewportMode(): void {
    if (typeof window === 'undefined') return;
    isMobile = window.matchMedia('(max-width: 640px)').matches;
  }

  function close(): void {
    onClose?.();
    open = false;
  }

  function toggle(): void {
    if (open) {
      close();
      return;
    }
    onOpen?.();
    open = true;
  }

  function onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
      return;
    }

    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      open = true;
    }
  }

  $effect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootEl) return;
      if (rootEl.contains(target)) return;
      if (closeOnBackdrop) close();
    };

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        close();
        triggerEl?.focus();
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeydown);

    queueMicrotask(() => {
      const targetPanel = isMobile ? mobilePanelEl : desktopPanelEl;
      const focusTarget = targetPanel?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusTarget?.focus();
    });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeydown);
    };
  });

  onMount(() => {
    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    return () => {
      window.removeEventListener('resize', updateViewportMode);
    };
  });
</script>

<div bind:this={rootEl} class="mini-popover-root relative inline-flex">
  <button
    bind:this={triggerEl}
    type="button"
    class={`mini-popover-trigger inline-flex items-center rounded-full overflow-hidden ${usesWideTrigger ? 'justify-start px-3 gap-2 min-h-10 h-10 w-auto min-w-0 max-w-none' : 'justify-center btn-touch-square p-0'} ${triggerClass}`.trim()}
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-label={title || mobileTitle || 'Open popover'}
    onclick={toggle}
    onkeydown={onTriggerKeydown}
  >
    <slot name="trigger" />
  </button>

  {#if open}
    <button
      type="button"
      class={`mini-popover-backdrop ui-blur-backdrop ${isMobile ? 'mini-popover-backdrop--mobile' : 'mini-popover-backdrop--desktop'}`}
      aria-label={`Close ${mobileTitle || title || 'popover'}`}
      onclick={() => closeOnBackdrop && close()}
    ></button>

    <div
      bind:this={desktopPanelEl}
      class={`mini-popover-panel mini-popover-panel--desktop ${ALIGN_CLASS[align]} ${widthClass} ${panelClass}`.trim()}
      role="dialog"
      aria-modal="false"
      aria-label={title || mobileTitle || 'Popover'}
    >
      <slot />
    </div>

    <div class="mini-popover-mobile-shell" aria-hidden={!isMobile}>
      <div
        bind:this={mobilePanelEl}
        class={`mini-popover-panel mini-popover-panel--mobile ${panelClass}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={mobileTitle || title || 'Popover'}
      >
        <div class="mini-popover-mobile-header">
          <div class="text-sm font-semibold text-base-content/80">
            {mobileTitle || title}
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-touch-square"
            aria-label="Close popover"
            onclick={close}
          >
            <Lucide icon={LX} size={16} ariaLabel="" />
          </button>
        </div>
        <div class="mini-popover-mobile-content">
          <slot name="mobile-content">
            <slot />
          </slot>
        </div>
      </div>
    </div>
  {/if}
</div>
