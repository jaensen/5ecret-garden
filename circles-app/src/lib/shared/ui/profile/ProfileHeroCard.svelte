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
</script>

<div class="w-full sm:w-[92%] lg:w-3/5 mx-auto">
  <div
    class="rounded-[2rem] border border-base-300/80 bg-gradient-to-b from-base-100 via-base-100 to-base-200/30 px-4 py-6 sm:px-6 shadow-sm"
  >
    <div class="flex flex-col items-center text-center gap-4">
      <div
        class="relative flex min-h-[20rem] items-center justify-center pt-8 pb-10 sm:min-h-0 sm:pt-2 sm:pb-4"
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
          class="absolute right-0 top-6 sm:top-1/2 sm:-right-6 sm:-translate-y-1/2"
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
  :global(.hero-overlay-button) {
    @apply btn btn-ghost btn-circle min-h-0 h-[22px] w-[22px] min-w-[22px] max-w-[22px] rounded-full border-2 border-base-100 bg-base-100 p-[2px] shadow-sm;
  }

  :global(.hero-overlay-button svg) {
    @apply text-base-content/55;
  }

  :global(.hero-overlay-button:hover svg),
  :global(.hero-overlay-button:focus-visible svg) {
    @apply text-base-content/80;
  }
</style>
