<script lang="ts">
  import { onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { popupState } from '$lib/shared/state/popup';
  import { headerDropdownOpen } from '$lib/shared/state/headerDropdown';
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import {
    Home as LHome,
    Users as LUsers,
    Layers as LLayers,
    Settings as LSettings,
    Circle as LCircle,
    ShoppingBag as LShoppingBag,
  } from 'lucide';

  type Icon =
    | 'dashboard'
    | 'contacts'
    | 'groups'
    | 'market'
    | 'settings'
    | 'default';
  type Item = { name: string; link: string; icon?: Icon };

  interface Props {
    items: Item[];
    maxWidthClass?: string; // e.g. 'max-w-4xl' or 'page page--lg'
  }

  let { items, maxWidthClass = 'max-w-4xl' }: Props = $props();
  const LABEL_HIDE_DELAY_MS = 2100;

  let compactNavLabels = $state(false);
  let labelsRevealed = $state(false);
  let compactTimer: ReturnType<typeof setTimeout> | null = null;
  let revealTimer: ReturnType<typeof setTimeout> | null = null;

  function isActive(link: string): boolean {
    return $page.url.pathname === link;
  }

  function guessIcon(name: string, link: string): Icon {
    const n = name.toLowerCase();
    const l = link.toLowerCase();

    const isDashboard = n.includes('dashboard') || l.includes('/dashboard');
    const isContacts = n.includes('contact') || l.includes('/contacts');
    const isGroups = n.includes('group') || l.includes('/groups');
    const isMarket = n.includes('market') || l.includes('/market');
    const isSettings = n.includes('setting') || l.includes('/settings');

    if (isDashboard) {
      return 'dashboard';
    }
    if (isContacts) {
      return 'contacts';
    }
    if (isGroups) {
      return 'groups';
    }
    if (isMarket) {
      return 'market';
    }
    if (isSettings) {
      return 'settings';
    }
    return 'default';
  }

  function clearCompactTimer(): void {
    if (compactTimer) {
      clearTimeout(compactTimer);
      compactTimer = null;
    }
  }

  function clearRevealTimer(): void {
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
  }

  function scheduleCompactLabels(): void {
    clearCompactTimer();
    compactNavLabels = false;

    compactTimer = setTimeout(() => {
      compactNavLabels = true;
      compactTimer = null;
    }, LABEL_HIDE_DELAY_MS);
  }

  function revealLabels(): void {
    clearRevealTimer();
    labelsRevealed = true;
  }

  function hideRevealedLabels(): void {
    labelsRevealed = false;
  }

  function revealLabelsTemporarily(): void {
    revealLabels();

    revealTimer = setTimeout(() => {
      labelsRevealed = false;
      revealTimer = null;
    }, LABEL_HIDE_DELAY_MS);
  }

  // Lucide icon map to remove if/else chains.
  const ICONS: Record<Icon, any> = {
    dashboard: LHome,
    contacts: LUsers,
    groups: LLayers,
    market: LShoppingBag,
    settings: LSettings,
    default: LCircle,
  };

  // runes-friendly
  let isPopupOpen: boolean = $derived($popupState.content !== null);
  let isHeaderDropdownOpen: boolean = $derived($headerDropdownOpen === true);
  let shouldHide: boolean = $derived(isPopupOpen || isHeaderDropdownOpen);
  let isCompact: boolean = $derived(compactNavLabels && !labelsRevealed);

  $effect(() => {
    $page.url.pathname;
    shouldHide;

    if (!shouldHide) {
      scheduleCompactLabels();
    } else {
      clearCompactTimer();
      clearRevealTimer();
      compactNavLabels = false;
      labelsRevealed = false;
    }
  });

  onDestroy(() => {
    clearCompactTimer();
    clearRevealTimer();
  });
</script>

<nav
  class={`fixed inset-x-0 z-20 transition-all duration-200
            ${shouldHide ? 'translate-y-8 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
  style="bottom: calc(env(safe-area-inset-bottom) + 16px);"
  aria-hidden={shouldHide ? 'true' : 'false'}
>
  <div
    class={`mx-auto ${maxWidthClass} pointer-events-none flex justify-center`}
  >
    <div class="pointer-events-auto max-w-full">
      <!-- Use DaisyUI's look, but kill its full-width/fixed behavior -->
      <div
        class={`btm-nav btm-nav--float bg-base-100/90 backdrop-blur-md border shadow-lg rounded-full px-2 py-1 max-w-full overflow-hidden justify-center motion-safe:transition-[width] motion-safe:duration-[450ms] motion-safe:ease-out motion-reduce:transition-none ${isCompact ? 'w-[min(calc(100vw-2rem),13rem)] gap-1' : 'w-[min(calc(100vw-2rem),28rem)] gap-0'}`}
        onpointerenter={revealLabelsTemporarily}
        onpointerleave={hideRevealedLabels}
        onfocusin={revealLabelsTemporarily}
        onfocusout={hideRevealedLabels}
      >
        {#each items as item (item.link)}
          {@const iconKind = item.icon ?? guessIcon(item.name, item.link)}
          {@const iconDef = ICONS[iconKind] ?? LCircle}
          {@const active = isActive(item.link)}
          {@const baseClasses =
            'inline-flex items-center rounded-full whitespace-nowrap overflow-hidden transition-colors duration-200 motion-reduce:transition-none'}
          {@const focusClasses =
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 focus-visible:outline-offset-2'}
          {@const stateClasses = active
            ? 'bottom-nav-active text-white'
            : 'text-base-content/90 hover:text-base-content hover:bg-base-200'}
          {@const compactClasses = isCompact
            ? 'h-11 min-h-11 min-w-11 max-w-11 px-0 py-0 justify-center gap-0 aspect-square'
            : 'h-auto min-w-11 max-w-56 px-4 py-2 gap-3'}

          <a
            href={item.link}
            aria-current={active ? 'page' : undefined}
            aria-label={item.name}
            title={isCompact ? item.name : undefined}
            class={`${baseClasses} ${compactClasses} ${stateClasses} ${focusClasses}`}
            onpointerdown={() => revealLabelsTemporarily()}
          >
            <Lucide
              icon={iconDef}
              size={28}
              class="shrink-0 stroke-current pt-2"
            />
            <span
              class={`leading-none -mt-2 whitespace-nowrap overflow-hidden motion-safe:transition-[max-width] motion-safe:ease-out motion-reduce:transition-none ${isCompact ? 'max-w-0 motion-safe:duration-300 motion-safe:delay-100' : 'max-w-40 motion-safe:duration-[360ms] motion-safe:delay-0'}`}
              aria-hidden={isCompact ? 'true' : undefined}
            >
              <span
                class={`inline-block motion-safe:transition-opacity motion-safe:ease-out motion-reduce:transition-none ${isCompact ? 'opacity-0 motion-safe:duration-200 motion-safe:delay-0' : 'opacity-100 motion-safe:duration-200 motion-safe:delay-150'}`}
                >{item.name}</span
              >
            </span>
          </a>
        {/each}
      </div>
    </div>
  </div>
</nav>

<style>
  /* Neutralize DaisyUI's fixed, full-width defaults for the floating variant. */
  :global(.btm-nav.btm-nav--float) {
    position: static;
    left: auto;
    right: auto;
    bottom: auto;
    grid-auto-columns: max-content;
  }
  :global(.btm-nav.btm-nav--float > *) {
    width: auto;
    min-width: max-content;
  }
  :global(.btm-nav.btm-nav--float a) {
    min-width: 0;
  }

  :global(.btm-nav.btm-nav--float a.bottom-nav-active) {
    background: var(--brand-gradient);
    box-shadow:
      0 4px 18px -6px rgba(56, 49, 139, 0.5),
      0 2px 10px -5px rgba(223, 101, 82, 0.22),
      inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  }
</style>
