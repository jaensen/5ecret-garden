<script lang="ts">
  import { circles } from '$lib/shared/state/circles';
  import type { Profile } from '$lib/shared/utils/profile';
  import CommonConnections from '$lib/shared/ui/profile/components/CommonConnections.svelte';
  import TrustRelationsList from '$lib/shared/ui/profile/components/TrustRelationsList.svelte';
  import HoldersList from '$lib/shared/ui/profile/components/HoldersList.svelte';
  import { contacts } from '$lib/shared/state/contacts';
  import {
    type AvatarRow,
    CirclesQuery,
    type TrustRelation,
    type TrustRelationRow,
  } from '@circles-sdk/data';
  import Untrust from '$lib/areas/contacts/ui/pages/Untrust.svelte';
  import { openAddTrustFlow } from '$lib/areas/trust/flows/addTrust/openAddTrustFlow';
  import { openSendFlowPopup } from '$lib/areas/wallet/flows/send/openSendFlowPopup';
  import { getProfile } from '$lib/shared/utils/profile';
  import {
    formatTrustRelation,
    getTypeString,
  } from '$lib/shared/utils/helpers';
  import Avatar from '$lib/shared/ui/avatar/Avatar.svelte';
  import { popupControls } from '$lib/shared/state/popup';
  import { popupState } from '$lib/shared/state/popup';
  import JumpLink from '$lib/shared/ui/content/jump/JumpLink.svelte';
  import AddressComponent from '$lib/shared/ui/primitives/Address.svelte';
  import { uint256ToAddress, type Address } from '@circles-sdk/utils';
  import { transitiveTransfer } from '$lib/areas/wallet/ui/pages/SelectAsset.svelte';
  import {
    getAccountHoldings,
    getGroupCollateral,
    getGroupTokenHolders,
    getTreasuryAddress,
    getVaultAddress,
  } from '$lib/shared/utils/vault';
  import { goto } from '$app/navigation';
  import { avatarState } from '$lib/shared/state/avatar.svelte';

  /* NEW: tabs */
  import { Tabs, Tab } from '@garden-ui/tabs';
  import type { TabIdOf } from '$lib/shared/ui/primitives/tabs/tabId';
  // Namespaces explorer (read-only) for other profiles
  import { ProfileHeroCard, ProfileNamespaces } from '$lib/shared/ui/profile';
  import { loadProfileOrInit } from '@circles-market/sdk';
  import type { ProfilesBindings } from '@circles-market/sdk';
  import { getProfilesBindings } from '$lib/shared/model/profile/bindings';
  import { TrustScoreBadge } from '$lib/shared/ui/profile';
  import TrustHistoryHeatmap from '$lib/areas/trust/ui/TrustHistoryHeatmap.svelte';
  import PersonalMintHistoryHeatmap from '$lib/areas/minting/ui/PersonalMintHistoryHeatmap.svelte';
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import { ArrowLeft as LArrowLeft, Star as LStar, X as LX } from 'lucide';
  import { createAvatarDataSource } from '$lib/shared/data/circles/avatarDataSource';
  import {
    bookmarksStateStore,
    profileBookmarksService,
    profileBookmarksStore,
    type ProfileBookmark,
  } from '$lib/areas/settings/state/profileBookmarks';
  import HelpPopover from '$lib/shared/ui/primitives/HelpPopover.svelte';
  import { TRUST_ROUTING_HELP_LINES } from '$lib/shared/content/trustRoutingCopy';

  function normalizeAddress(value: string | Address): Address {
    return String(value).trim().toLowerCase() as Address;
  }

  interface Props {
    address: Address | undefined;
    trustVersion: number | undefined;
    isPopup?: boolean;
  }

  let { address, trustVersion, isPopup = false }: Props = $props();

  $effect(() => {
    const hasAddress: boolean = !!address;
    if (hasAddress) {
      initialize(address as Address);
    }
  });

  let otherAvatar: AvatarRow | undefined = $state();
  let profile: Profile | undefined = $state();
  let mintHandler: Address | undefined = $state();

  let trustRow: TrustRelationRow | undefined = $state();
  const relationText = $derived.by(() => {
    if (!trustRow) return 'Not connected';
    const formatted = formatTrustRelation(trustRow.relation, profile);
    return formatted === 'None' ? 'Not connected' : formatted;
  });
  const relationOverlayUrl = $derived.by(() => {
    switch (trustRow?.relation) {
      case 'trusts':
        return '/badge-sent.svg';
      case 'trustedBy':
        return '/badge-received.svg';
      case 'mutuallyTrusts':
        return '/mutual.svg';
      default:
        return undefined;
    }
  });
  const relationIsPositive = $derived.by(
    () =>
      trustRow?.relation === 'trusts' ||
      trustRow?.relation === 'trustedBy' ||
      trustRow?.relation === 'mutuallyTrusts'
  );
  const hasTrustRow = $derived(!!trustRow);
  let collateralInTreasury: Array<{
    avatar: Address;
    amount: bigint;
    amountToRedeem: bigint;
    amountToRedeemInCircles: number;
    trustRelation?: TrustRelation;
  }> = $state([]);
  let collateralLoading: boolean = $state(false);
  let collateralError: string | null = $state(null);

  let tokenHolders: Array<{
    avatar: Address;
    amount: bigint;
    amountToRedeem: bigint;
    amountToRedeemInCircles: number;
    trustRelation?: TrustRelation;
  }> = $state([]);
  let holdersLoading: boolean = $state(false);
  let holdersError: string | null = $state(null);

  let holdings: Array<{
    avatar: Address;
    amount: bigint;
    amountToRedeem: bigint;
    amountToRedeemInCircles: number;
    trustRelation?: TrustRelation;
  }> = $state([]);
  let holdingsLoading: boolean = $state(false);
  let holdingsError: string | null = $state(null);

  // ─────────────────────────────────────────────────────────────
  // Namespaces explorer for the displayed profile (auto-load)
  // ─────────────────────────────────────────────────────────────
  let otherResolvedAvatar: Address | null = $state(null);
  let otherNamespaces: Record<string, string> = $state({});
  let otherLoading: boolean = $state(false);
  let otherError: string | null = $state(null);
  // Track which address' namespaces are currently loaded
  let namespacesFor: string | null = $state(null);

  function getBindings(): ProfilesBindings {
    return getProfilesBindings().bindings;
  }

  async function loadNamespacesFor(addr: Address): Promise<void> {
    const norm = normalizeAddress(addr as any) as Address;
    namespacesFor = String(norm).toLowerCase();
    otherLoading = true;
    otherError = null;
    otherNamespaces = {};
    otherResolvedAvatar = norm as Address;
    try {
      const { profile } = await loadProfileOrInit(
        getBindings(),
        norm as Address
      );
      const nsObj =
        profile?.namespaces && typeof profile.namespaces === 'object'
          ? profile.namespaces
          : {};
      otherNamespaces = { ...(nsObj as Record<string, string>) };
    } catch (e: any) {
      otherError = String(e?.message ?? e);
    } finally {
      otherLoading = false;
    }
  }

  // Auto-load when the page knows the address and whenever it changes
  $effect(() => {
    if (!address) {
      otherResolvedAvatar = null;
      otherNamespaces = {};
      namespacesFor = null;
      return;
    }
    const want = normalizeAddress(String(address)).toLowerCase();
    if (!otherLoading && namespacesFor !== want) {
      void loadNamespacesFor(address);
    }
  });

  async function initialize(address: Address) {
    const sdk = $circles;
    if (!sdk) {
      return;
    }
    const avatarDataSource = createAvatarDataSource(sdk);

    const [other, prof] = await Promise.all([
      avatarDataSource.getAvatarInfo(address),
      getProfile(address),
    ]);
    otherAvatar = other;
    profile = prof;

    trustRow = $contacts?.data[address]?.row;

    const isGroup: boolean = otherAvatar?.type === 'CrcV2_RegisterGroup';
    const isHuman: boolean = otherAvatar?.type === 'CrcV2_RegisterHuman';

    const toTokenRows = (
      result: { columns: string[]; rows: any[][] } | null,
      avatarColumn: 'tokenId' | 'account'
    ) => {
      if (!result) return [];
      const { columns, rows } = result;
      const avatarIdx = columns.indexOf(avatarColumn);
      const colBal = columns.indexOf('demurragedTotalBalance');
      return rows
        .map((row) => ({
          avatar: uint256ToAddress(BigInt(row[avatarIdx])),
          amount: BigInt(row[colBal]),
          amountToRedeemInCircles: 0,
          amountToRedeem: 0n,
        }))
        .sort((a, b) =>
          a.amount > b.amount ? -1 : a.amount === b.amount ? 0 : 1
        );
    };

    const loadMintHandler = async () => {
      try {
        const findMintHandlerQuery = new CirclesQuery<any>(sdk.circlesRpc, {
          namespace: 'V_CrcV2',
          table: 'Groups',
          columns: ['mintHandler'],
          filter: [
            {
              Type: 'FilterPredicate',
              FilterType: 'Equals',
              Column: 'group',
              Value: address,
            },
          ],
          sortOrder: 'DESC',
          limit: 1,
        });
        mintHandler = (await findMintHandlerQuery.getSingleRow())
          ?.mintHandler as Address | undefined;
      } catch (e) {
        mintHandler = undefined;
      }
    };

    const loadCollateral = async () => {
      collateralLoading = true;
      collateralError = null;
      try {
        const [vaultRes, treasuryRes] = await Promise.allSettled([
          getVaultAddress(sdk.circlesRpc, otherAvatar!.avatar),
          getTreasuryAddress(sdk.circlesRpc, otherAvatar!.avatar),
        ]);
        const vaultAddress =
          vaultRes.status === 'fulfilled' ? vaultRes.value : null;
        const treasuryAddress =
          treasuryRes.status === 'fulfilled' ? treasuryRes.value : null;
        const balanceOwner: string = vaultAddress ?? treasuryAddress ?? '';

        if (!balanceOwner) {
          collateralInTreasury = [];
          return;
        }
        const balancesResult = await getGroupCollateral(
          sdk.circlesRpc,
          balanceOwner
        );
        collateralInTreasury = toTokenRows(balancesResult, 'tokenId');
      } catch (e: any) {
        collateralError = e?.message ?? 'Failed to load collateral';
        collateralInTreasury = [];
      } finally {
        collateralLoading = false;
      }
    };

    const loadHoldings = async () => {
      holdingsLoading = true;
      holdingsError = null;
      try {
        const holdingsResult = await getAccountHoldings(
          sdk.circlesRpc,
          address
        );
        holdings = toTokenRows(holdingsResult, 'tokenId');
      } catch (e: any) {
        holdingsError = e?.message ?? 'Failed to load holdings';
        holdings = [];
      } finally {
        holdingsLoading = false;
      }
    };

    const loadTokenHolders = async () => {
      holdersLoading = true;
      holdersError = null;
      try {
        const tokenHoldersResult = await getGroupTokenHolders(
          sdk.circlesRpc,
          address
        );
        tokenHolders = toTokenRows(tokenHoldersResult, 'account');
      } catch (e: any) {
        holdersError = e?.message ?? 'Failed to load holders';
        tokenHolders = [];
      } finally {
        holdersLoading = false;
      }
    };

    if (isGroup) {
      await Promise.allSettled([
        loadMintHandler(),
        loadCollateral(),
        loadTokenHolders(),
      ]);
    } else {
      await Promise.allSettled([
        loadHoldings(),
        ...(isHuman ? [loadTokenHolders()] : []),
      ]);
    }
  }

  const TAB_IDS = [
    'common_connections',
    'trusts',
    'trusted_by',
    'trust_history',
    'minting_history',
    'collateral',
    'holders',
    'holdings',
    'explore_namespaces',
  ] as const;
  type TabId = TabIdOf<typeof TAB_IDS>;

  const tabPanelClass = 'p-4 bg-base-100 border-none';

  let selectedTab = $state<TabId>('common_connections');
  let commonConnectionsCount = $state(0);
  let trustsCount = $state(0);
  let trustedByCount = $state(0);
  let trustHistoryEventCount = $state(0);
  let mintingHistoryEventCount = $state(0);
  let bookmarkedProfiles: ProfileBookmark[] = $state([]);
  let showBookmarkEditor: boolean = $state(false);
  let bookmarkNoteInput: string = $state('');
  let bookmarkFolders: string[] = $state([]);
  let bookmarkFolderSelection: string = $state('');
  let newBookmarkFolderInput: string = $state('');
  let bookmarkButtonEl: HTMLButtonElement | null = $state(null);
  let bookmarkPopoverEl: HTMLDivElement | null = $state(null);

  const normalizedAddress = $derived.by(() => {
    if (!address) return null;
    const v = String(address).trim().toLowerCase();
    return /^0x[a-f0-9]{40}$/.test(v) ? v : null;
  });

  const currentBookmark = $derived(
    normalizedAddress
      ? bookmarkedProfiles.find((v) => v.address === normalizedAddress)
      : undefined
  );
  const isBookmarked = $derived(!!currentBookmark);

  $effect(() => {
    const unsubscribe = profileBookmarksStore.subscribe((value) => {
      bookmarkedProfiles = value;
    });
    return () => unsubscribe();
  });

  $effect(() => {
    const unsubscribe = bookmarksStateStore.subscribe((value) => {
      bookmarkFolders = value.folders;
    });
    return () => unsubscribe();
  });

  function resolveBookmarkFolderInput(): string | undefined {
    const fromNewInput = profileBookmarksService.ensureProfileFolder(
      newBookmarkFolderInput
    );
    if (fromNewInput) {
      bookmarkFolderSelection = fromNewInput;
      newBookmarkFolderInput = '';
      return fromNewInput;
    }

    const selected = bookmarkFolderSelection.trim();
    return selected.length > 0 ? selected : undefined;
  }

  function openBookmarkEditor(): void {
    if (!address) return;
    const currentFolder = currentBookmark?.folder ?? '';
    bookmarkNoteInput = currentBookmark?.note ?? '';
    bookmarkFolderSelection = currentFolder;
    newBookmarkFolderInput = '';
    showBookmarkEditor = !showBookmarkEditor;
  }

  function saveBookmarkWithCurrentNote(): void {
    if (!address) return;
    profileBookmarksService.upsertProfile(String(address), {
      note: bookmarkNoteInput,
      folder: resolveBookmarkFolderInput(),
    });
    showBookmarkEditor = false;
  }

  function removeBookmark(): void {
    if (!address) return;
    profileBookmarksService.removeProfile(String(address));
    showBookmarkEditor = false;
  }

  $effect(() => {
    if (!showBookmarkEditor) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const bookmarkButtonNode = bookmarkButtonEl as HTMLButtonElement | null;
      const bookmarkPopoverNode = bookmarkPopoverEl as HTMLDivElement | null;
      const insideButton = !!(
        bookmarkButtonNode &&
        target &&
        bookmarkButtonNode.contains(target)
      );
      const insidePopover = !!(
        bookmarkPopoverNode &&
        target &&
        bookmarkPopoverNode.contains(target)
      );
      if (!insideButton && !insidePopover) {
        showBookmarkEditor = false;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        showBookmarkEditor = false;
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  const availableTabIds = $derived(
    (() => {
      const ids: TabId[] = [
        'common_connections',
        'trusts',
        'trusted_by',
        'trust_history',
        'minting_history',
      ];
      if (otherAvatar?.type === 'CrcV2_RegisterGroup') ids.push('collateral');
      if (
        otherAvatar?.type === 'CrcV2_RegisterGroup' ||
        otherAvatar?.type === 'CrcV2_RegisterHuman'
      ) {
        ids.push('holders');
      }
      if (
        otherAvatar?.type === 'CrcV2_RegisterHuman' ||
        otherAvatar?.type === 'CrcV2_RegisterOrganization'
      ) {
        ids.push('holdings');
      }
      ids.push('explore_namespaces');
      return ids;
    })()
  );

  const tabOrder = $derived.by(() => {
    const ids = [...availableTabIds];
    const namespacesIndex = ids.indexOf('explore_namespaces');
    if (namespacesIndex > -1) {
      ids.splice(namespacesIndex, 1);
      ids.push('explore_namespaces');
    }
    return ids;
  });

  $effect(() => {
    // When conditional tabs appear/disappear, ensure `selectedTab` always points to a visible tab.
    if (!availableTabIds.includes(selectedTab)) {
      selectedTab = availableTabIds[0] ?? 'common_connections';
    }
  });

  function normalizeMetric(value: number, cap: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(Math.min(100, (value / cap) * 100));
  }

  const heroRingMetrics = $derived.by(() => {
    return [
      {
        label: 'Common connections',
        value: normalizeMetric(commonConnectionsCount, 24),
        tone: 'info',
        hint: `${commonConnectionsCount} shared connections`,
      },
      {
        label: 'Trusts',
        value: normalizeMetric(trustsCount, 40),
        tone: 'success',
        hint: `${trustsCount} profiles trusted`,
      },
      {
        label: 'Trusted by',
        value: normalizeMetric(trustedByCount, 200),
        tone: 'warning',
        hint: `${trustedByCount} profiles trust this one`,
      },
      {
        label: 'Trust history',
        value: normalizeMetric(trustHistoryEventCount, 40),
        tone: 'primary',
        hint: `${trustHistoryEventCount} trust events`,
      },
      {
        label: 'Minting history',
        value: normalizeMetric(mintingHistoryEventCount, 60),
        tone: 'warning',
        hint: `${mintingHistoryEventCount} mint events`,
      },
      {
        label: 'Holders',
        value: normalizeMetric(tokenHolders.length, 40),
        tone: 'info',
        hint: `${tokenHolders.length} holders`,
      },
      {
        label: 'Holdings',
        value: normalizeMetric(holdings.length, 40),
        tone: 'success',
        hint: `${holdings.length} holdings`,
      },
    ];
  });
</script>

<div class="space-y-6">
  {#snippet profileActions()}
    <button
      class="btn btn-ghost btn-circle btn-sm btn-action-outline btn-touch-square"
      type="button"
      aria-label="Trust details"
      title="Trust details"
      onclick={() => {
        const infoButton = document.querySelector<HTMLElement>(
          '.hero-overlay-button'
        );
        infoButton?.click();
        infoButton?.focus();
      }}
    >
      <img src="/trust.svg" alt="" class="w-5 h-5" aria-hidden="true" />
    </button>

    {#if !avatarState.isGroup}
      <button
        class="btn btn-ghost btn-sm btn-action-outline"
        onclick={() => {
          openSendFlowPopup({
            selectedAddress: otherAvatar?.avatar,
            selectedAsset: transitiveTransfer(),
            amount: undefined,
            transitiveOnly: true,
          });
        }}
      >
        <img src="/send-new.svg" alt="Send" class="w-5 h-5" />
        Send
      </button>
    {/if}
    {#if otherAvatar?.type === 'CrcV2_RegisterGroup' && !!mintHandler && !avatarState.isGroup}
      <button
        class="btn btn-primary btn-sm"
        onclick={() => {
          openSendFlowPopup({
            selectedAddress: mintHandler,
            selectedAsset: transitiveTransfer(),
            amount: undefined,
            transitiveOnly: true,
          });
        }}
      >
        Mint
      </button>
    {/if}
    {#if trustRow?.relation === 'trusts'}
      <button
        class="btn btn-primary btn-sm"
        onclick={() => {
          popupControls.open({
            title: !avatarState.isGroup ? 'Untrust' : 'Remove member',
            kind: 'confirm',
            dismiss: 'explicit',
            component: Untrust,
            props: {
              address: address,
              trustVersion: trustVersion,
            },
          });
        }}
      >
        {!avatarState.isGroup ? 'Untrust' : 'Remove member'}
      </button>
    {:else if trustRow?.relation === 'mutuallyTrusts'}
      <button
        class="btn btn-primary btn-sm"
        onclick={() => {
          popupControls.open({
            title: !avatarState.isGroup ? 'Untrust' : 'Remove member',
            kind: 'confirm',
            dismiss: 'explicit',
            component: Untrust,
            props: {
              address: address,
            },
          });
        }}
      >
        {!avatarState.isGroup ? 'Untrust' : 'Remove member'}
      </button>
    {:else if trustRow?.relation === 'trustedBy'}
      <button
        class="btn btn-primary btn-sm"
        onclick={() => {
          if (!address) return;
          if (!avatarState.avatar) {
            throw new Error('Avatar store not available');
          }

          openAddTrustFlow({
            context: {
              actorType: avatarState.isGroup ? 'group' : 'avatar',
              actorAddress: avatarState.avatar.address,
              selectedTrustees: [address],
            },
          });
        }}
      >
        {!avatarState.isGroup ? 'Trust back' : 'Add as member'}
      </button>
    {:else}
      <button
        class="btn btn-primary btn-sm"
        onclick={() => {
          if (!address) return;
          if (!avatarState.avatar) {
            throw new Error('Avatar store not available');
          }

          openAddTrustFlow({
            context: {
              actorType: avatarState.isGroup ? 'group' : 'avatar',
              actorAddress: avatarState.avatar.address,
              selectedTrustees: [address],
            },
          });
        }}
      >
        {!avatarState.isGroup ? 'Trust' : 'Add as member'}
      </button>
    {/if}
  {/snippet}

  {#if isPopup}
    <div class="mb-2 flex items-center gap-3">
      <button
        data-popup-close-control
        class="btn btn-ghost btn-circle btn-sm"
        onclick={() => popupControls.back()}
        aria-label={$popupState.stack.length > 0 ? 'Back' : 'Close'}
        title={$popupState.stack.length > 0 ? 'Back' : 'Close'}
      >
        <Lucide
          icon={$popupState.stack.length > 0 ? LArrowLeft : LX}
          size={16}
          class="shrink-0"
          ariaLabel=""
        />
      </button>

      <div class="ml-auto flex items-center justify-end gap-2 flex-wrap">
        {@render profileActions()}
      </div>
    </div>
  {:else}
    <div
      class="flex items-center justify-end gap-2 flex-wrap -mt-1 mb-1 sm:mb-2"
    >
      {@render profileActions()}
    </div>
  {/if}

  <div class={isPopup ? '-mt-10 sm:-mt-14 mb-2' : ''}>
    <ProfileHeroCard
      {address}
      {profile}
      avatarInfo={otherAvatar}
      {relationText}
      {relationOverlayUrl}
      {hasTrustRow}
      {relationIsPositive}
      {isBookmarked}
      {showBookmarkEditor}
      {bookmarkFolders}
      bind:bookmarkFolderSelection
      bind:newBookmarkFolderInput
      bind:bookmarkNoteInput
      trustRoutingHelpLines={TRUST_ROUTING_HELP_LINES}
      ringMetrics={heroRingMetrics}
      showChartButton={otherAvatar?.type === 'CrcV2_RegisterGroup'}
      onOpenBookmarkEditor={openBookmarkEditor}
      onCloseBookmarkEditor={() => (showBookmarkEditor = false)}
      onRemoveBookmark={removeBookmark}
      onSaveBookmark={saveBookmarkWithCurrentNote}
      onGotoChart={() => {
        popupControls.closeAndThen(() => {
          void goto('/groups/metrics/' + address);
        });
      }}
    />
  </div>

  <div class="w-[80%] sm:w-[60%] border-b border-base-300"></div>
</div>

<Tabs
  id="profile-tabs"
  bind:selected={selectedTab}
  variant="boxed"
  size="sm"
  class="w-full p-0 mt-6"
  fitted={false}
  {tabOrder}
>
  <Tab
    id="common_connections"
    title="Common connections"
    badge={commonConnectionsCount}
    panelClass={tabPanelClass}
  >
    <div class="w-full">
      <CommonConnections
        otherAvatarAddress={otherAvatar?.avatar}
        bind:commonConnectionsCount
      />
    </div>
  </Tab>

  <Tab
    id="trusts"
    title="Trusts"
    badge={trustsCount}
    panelClass={tabPanelClass}
  >
    <div class="w-full">
      <TrustRelationsList
        avatarAddress={otherAvatar?.avatar}
        relation="trusts"
        bind:count={trustsCount}
      />
    </div>
  </Tab>

  <Tab
    id="trusted_by"
    title="Trusted by"
    badge={trustedByCount}
    panelClass={tabPanelClass}
  >
    <div class="w-full">
      <TrustRelationsList
        avatarAddress={otherAvatar?.avatar}
        relation="trustedBy"
        bind:count={trustedByCount}
      />
    </div>
  </Tab>

  <Tab
    id="trust_history"
    title="Trust history"
    badge={trustHistoryEventCount}
    panelClass={tabPanelClass}
  >
    <div class="w-full">
      <TrustHistoryHeatmap
        {address}
        granularity="month"
        showGranularitySwitch={true}
        bind:eventCount={trustHistoryEventCount}
      />
    </div>
  </Tab>

  <Tab
    id="minting_history"
    title="Minting hstory"
    badge={mintingHistoryEventCount}
    panelClass={tabPanelClass}
  >
    <div class="w-full">
      <PersonalMintHistoryHeatmap
        {address}
        bind:eventCount={mintingHistoryEventCount}
      />
    </div>
  </Tab>

  {#if otherAvatar?.type === 'CrcV2_RegisterGroup'}
    <Tab
      id="collateral"
      title="Collateral"
      badge={collateralInTreasury.length}
      panelClass={tabPanelClass}
    >
      <div class="w-full">
        {#if collateralLoading}
          <div class="w-full py-6 text-center text-base-content/60">
            Loading…
          </div>
        {:else if collateralError}
          <div class="w-full py-6 text-center text-error">
            {collateralError}
          </div>
        {:else}
          <HoldersList
            holders={collateralInTreasury}
            emptyLabel="No collateral"
            noMatchesLabel="No matching collateral"
            searchPlaceholder="Search collateral by address or name"
          />
        {/if}
      </div>
    </Tab>
  {/if}

  {#if otherAvatar?.type === 'CrcV2_RegisterGroup' || otherAvatar?.type === 'CrcV2_RegisterHuman'}
    <Tab
      id="holders"
      title="Holders"
      badge={tokenHolders.length}
      panelClass={tabPanelClass}
    >
      <div class="w-full">
        {#if holdersLoading}
          <div class="w-full py-6 text-center text-base-content/60">
            Loading…
          </div>
        {:else if holdersError}
          <div class="w-full py-6 text-center text-error">{holdersError}</div>
        {:else}
          <HoldersList holders={tokenHolders} />
        {/if}
      </div>
    </Tab>
  {/if}

  {#if otherAvatar?.type === 'CrcV2_RegisterHuman' || otherAvatar?.type === 'CrcV2_RegisterOrganization'}
    <Tab
      id="holdings"
      title="Holdings"
      badge={holdings.length}
      panelClass={tabPanelClass}
    >
      <div class="w-full">
        {#if holdingsLoading}
          <div class="w-full py-6 text-center text-base-content/60">
            Loading…
          </div>
        {:else if holdingsError}
          <div class="w-full py-6 text-center text-error">{holdingsError}</div>
        {:else}
          <HoldersList holders={holdings} />
        {/if}
      </div>
    </Tab>
  {/if}

  <!-- Explore namespaces tab: auto-load the viewed profile's namespaces (read-only) -->
  <Tab id="explore_namespaces" title="Namespaces" panelClass={tabPanelClass}>
    <div class="space-y-3">
      {#if otherError}
        <div class="alert alert-error text-sm">{otherError}</div>
      {/if}

      {#if otherLoading}
        <div class="flex items-center gap-2 text-base-content/70 py-2">
          <span class="loading loading-spinner loading-sm"></span>
          <span>Loading namespaces…</span>
        </div>
      {:else if otherResolvedAvatar}
        <ProfileNamespaces
          avatar={otherResolvedAvatar}
          namespaces={otherNamespaces}
          readonly={true}
        />
      {:else}
        <div class="text-sm opacity-60">No avatar selected.</div>
      {/if}
    </div>
  </Tab>
</Tabs>
