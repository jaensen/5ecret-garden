<script lang="ts">
  import type { Address } from '@circles-sdk/utils';
  import type { AvatarRow } from '@circles-sdk/data';
  import type { AppProfileCore as Profile } from '$lib/shared/model/profile';
  import AddressComponent from '$lib/shared/ui/primitives/Address.svelte';
  import HelpPopover from '$lib/shared/ui/primitives/HelpPopover.svelte';
  import MiniPopover from '$lib/shared/ui/primitives/MiniPopover.svelte';
  import JumpLink from '$lib/shared/ui/content/jump/JumpLink.svelte';
  import Lucide from '$lib/shared/ui/icons/Lucide.svelte';
  import { Star as LStar } from 'lucide';
  import { getTypeString } from '$lib/shared/utils/helpers';
  import ProfileScoreDonut from './ProfileScoreDonut.svelte';

  interface Props {
    address: Address | undefined;
    profile: Profile | undefined;
    avatarInfo: AvatarRow | undefined;
    relationText: string;
    relationOverlayUrl?: string | undefined;
    compactActionLabel?: string;
    compactActionIconUrl?: string;
    compactActionTone?: 'success' | 'default';
    onCompactAction?: () => void;
    hasTrustRow: boolean;
    relationIsPositive: boolean;
    isBookmarked: boolean;
    showBookmarkEditor: boolean;
    bookmarkFolders: string[];
    bookmarkFolderSelection: string;
    newBookmarkFolderInput: string;
    bookmarkNoteInput: string;
    trustRoutingHelpLines: string[];
    ringMetrics?: Array<{
      label: string;
      value: number;
      tone?: string;
      hint?: string;
    }>;
    showChartButton?: boolean;
    onCloseBookmarkEditor: () => void;
    onRemoveBookmark: () => void;
    onSaveBookmark: () => void;
    onOpenBookmarkEditor?: () => void;
    onGotoChart?: () => void;
  }

  let {
    address,
    profile,
    avatarInfo,
    relationText,
    relationOverlayUrl = undefined,
    compactActionLabel = '',
    compactActionIconUrl = '/trust.svg',
    compactActionTone = 'default',
    onCompactAction,
    hasTrustRow,
    relationIsPositive,
    isBookmarked,
    showBookmarkEditor = false,
    bookmarkFolders,
    bookmarkFolderSelection = $bindable(''),
    newBookmarkFolderInput = $bindable(''),
    bookmarkNoteInput = $bindable(''),
    trustRoutingHelpLines,
    ringMetrics = [],
    showChartButton = false,
    onCloseBookmarkEditor,
    onRemoveBookmark,
    onSaveBookmark,
    onOpenBookmarkEditor,
    onGotoChart,
  }: Props = $props();

  const typeLabel = $derived(getTypeString(avatarInfo?.type || ''));
  const hasCompactAction = $derived(
    !!compactActionLabel.trim() && typeof onCompactAction === 'function'
  );
</script>

<div class="w-full sm:w-[92%] lg:w-3/5 mx-auto">
  <div
    class="relative rounded-[2rem] bg-gradient-to-b from-base-100 via-base-100 to-base-200/30 px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-5 shadow-sm"
  >
    {#if hasCompactAction}
      <div
        class="pointer-events-none absolute left-1/2 top-0 z-20 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 sm:w-auto"
      >
        <div class="flex justify-center sm:justify-end">
          <button
            type="button"
            class={`hero-compact-action pointer-events-auto inline-flex items-center justify-center overflow-hidden rounded-full border bg-base-100/95 px-2.5 py-2 shadow-lg backdrop-blur-md motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out hover:px-4 hover:shadow-xl focus-visible:px-4 ${compactActionTone === 'success' ? 'border-success/35 text-success hover:bg-success/10' : 'border-base-300/80 text-base-content/75 hover:border-base-content/20 hover:bg-base-200/80'}`}
            aria-label={compactActionLabel}
            title={compactActionLabel}
            onclick={onCompactAction}
          >
            <span
              class={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${compactActionTone === 'success' ? 'border-success/25 bg-success/10' : 'border-base-300/80 bg-base-100'}`}
            >
              <img
                src={compactActionIconUrl}
                alt=""
                class="h-4 w-4"
                aria-hidden="true"
              />
            </span>
            <span
              class="max-w-0 overflow-hidden whitespace-nowrap pl-0 text-sm font-semibold motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out hover:max-w-40 hover:pl-2 focus-visible:max-w-40 focus-visible:pl-2"
            >
              {compactActionLabel}
            </span>
          </button>
        </div>
      </div>
    {/if}

    <div class="flex flex-col items-center text-center gap-4">
      <div
        class="relative flex min-h-[14rem] items-center justify-center pt-3 pb-4 sm:min-h-0 sm:pt-0 sm:pb-0"
      >
        <div
          class="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-2xl sm:h-[12.5rem] sm:w-[12.5rem]"
        ></div>

        <div class="absolute -top-1 left-1/2 -translate-x-1/2">
          <div
            class={`badge badge-sm border border-base-300/70 bg-base-100/95 shadow-sm ${relationIsPositive ? 'text-success' : 'text-base-content/70'}`}
          >
            {hasTrustRow ? relationText : 'Not connected'}
          </div>
        </div>

        <div
          class="absolute right-1 top-2 sm:right-0 sm:top-1/2 sm:-translate-y-1/2"
        >
          <HelpPopover
            title="Trust & routing"
            lines={trustRoutingHelpLines}
            buttonClass="hero-overlay-button"
            widthClass="w-80"
          />
        </div>

        <ProfileScoreDonut
          {address}
          imageUrl={profile?.previewImageUrl}
          name={profile?.name}
          showBookmarkBadge={isBookmarked}
          size={96}
          mobileScale={2}
          pictureOverlayUrl={relationOverlayUrl}
          pictureOverlayAlt="Overlay"
          avatarType={avatarInfo?.type}
          rings={ringMetrics}
        />
      </div>

      <div class="space-y-1">
        <h1 class="text-xl font-semibold tracking-tight text-base-content">
          {profile?.name ?? 'Profile'}
        </h1>
        <p class="text-sm text-base-content/72 max-w-md">
          {hasTrustRow
            ? relationText
            : 'Trust and profile details at a glance.'}
        </p>
        <p class="text-xs text-base-content/55">
          Trust = you accept Circles from this account.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-2">
        <AddressComponent address={address ?? '0x0'} />

        {#if address}
          <MiniPopover
            title={isBookmarked ? 'Edit bookmark' : 'Bookmark profile'}
            mobileTitle="Profile bookmark"
            widthClass="w-72"
            triggerClass="btn-utility-soft"
            panelClass="mini-popover-surface p-3 space-y-2 text-left"
            bind:open={showBookmarkEditor}
            onOpen={onOpenBookmarkEditor}
          >
            <svelte:fragment slot="trigger">
              <Lucide
                icon={LStar}
                size={16}
                class={isBookmarked
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-base-content/60'}
              />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </svelte:fragment>

            <div class="space-y-2 text-left">
              <div class="text-xs font-semibold">Profile bookmark</div>
              <div class="space-y-1">
                <div class="text-[11px] opacity-70">Folder</div>
                {#if bookmarkFolders.length > 0}
                  <select
                    class="select select-bordered select-sm w-full"
                    bind:value={bookmarkFolderSelection}
                  >
                    <option value="">No folder</option>
                    {#each bookmarkFolders as folder (folder)}
                      <option value={folder}>{folder}</option>
                    {/each}
                  </select>
                {:else}
                  <div class="text-xs opacity-60">
                    No folders yet. Create one below.
                  </div>
                {/if}
                <input
                  class="input input-bordered input-sm w-full"
                  type="text"
                  maxlength="64"
                  placeholder="Create folder (e.g. Friends)"
                  bind:value={newBookmarkFolderInput}
                />
              </div>
              <textarea
                class="textarea textarea-bordered textarea-sm w-full"
                rows={3}
                placeholder="Add a note (optional)"
                bind:value={bookmarkNoteInput}
              ></textarea>
              <div class="flex items-center justify-end gap-2">
                <button
                  class="btn btn-ghost btn-xs"
                  type="button"
                  onclick={onCloseBookmarkEditor}
                >
                  Cancel
                </button>
                {#if isBookmarked}
                  <button
                    class="btn btn-ghost btn-xs"
                    type="button"
                    onclick={onRemoveBookmark}
                  >
                    Remove
                  </button>
                {/if}
                <button
                  class="btn btn-primary btn-xs"
                  type="button"
                  onclick={onSaveBookmark}
                >
                  Save
                </button>
              </div>
            </div>

            <svelte:fragment slot="mobile-content">
              <div class="space-y-2 text-left">
                <div class="text-xs font-semibold">Profile bookmark</div>
                <div class="space-y-1">
                  <div class="text-[11px] opacity-70">Folder</div>
                  {#if bookmarkFolders.length > 0}
                    <select
                      class="select select-bordered select-sm w-full"
                      bind:value={bookmarkFolderSelection}
                    >
                      <option value="">No folder</option>
                      {#each bookmarkFolders as folder (folder)}
                        <option value={folder}>{folder}</option>
                      {/each}
                    </select>
                  {:else}
                    <div class="text-xs opacity-60">
                      No folders yet. Create one below.
                    </div>
                  {/if}
                  <input
                    class="input input-bordered input-sm w-full"
                    type="text"
                    maxlength="64"
                    placeholder="Create folder (e.g. Friends)"
                    bind:value={newBookmarkFolderInput}
                  />
                </div>
                <textarea
                  class="textarea textarea-bordered textarea-sm w-full"
                  rows={3}
                  placeholder="Add a note (optional)"
                  bind:value={bookmarkNoteInput}
                ></textarea>
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="btn btn-ghost btn-xs"
                    type="button"
                    onclick={onCloseBookmarkEditor}
                  >
                    Cancel
                  </button>
                  {#if isBookmarked}
                    <button
                      class="btn btn-ghost btn-xs"
                      type="button"
                      onclick={onRemoveBookmark}
                    >
                      Remove
                    </button>
                  {/if}
                  <button
                    class="btn btn-primary btn-xs"
                    type="button"
                    onclick={onSaveBookmark}
                  >
                    Save
                  </button>
                </div>
              </div>
            </svelte:fragment>
          </MiniPopover>
        {/if}

        {#if showChartButton}
          <button type="button" class="btn-utility-soft" onclick={onGotoChart}>
            <img src="/chart.svg" alt="Chart" class="w-4 h-4" />
            <span>Metrics</span>
          </button>
        {/if}

        {#if address}
          <JumpLink
            url={'https://gnosisscan.io/address/' + address}
            className="btn-utility-soft"
          >
            <img src="/external.svg" alt="External Link" class="w-4" />
            <span>Explorer</span>
          </JumpLink>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .hero-compact-action:not(:hover):not(:focus-visible) {
    width: 3.25rem;
    min-width: 3.25rem;
    max-width: 3.25rem;
  }
</style>
