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
    isPopup?: boolean;
    relationText: string;
    relationOverlayUrl?: string | undefined;
    relationIconUrl?: string | undefined;
    onRelationAction?: () => void;
    relationActionLabel?: string;
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
    isPopup = false,
    relationText,
    relationOverlayUrl = undefined,
    relationIconUrl = undefined,
    onRelationAction,
    relationActionLabel = '',
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
  const relationButtonEnabled = $derived(
    typeof onRelationAction === 'function'
  );
</script>

<div class="mx-auto w-full sm:w-[92%] lg:w-3/5">
  <div
    class={`relative overflow-visible ${isPopup ? 'pt-0 sm:pb-3' : 'pb-0 sm:pb-5'}`}
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

    {#if isPopup}
      <div
        class="pointer-events-none absolute left-1/2 top-0 z-20 flex w-full -translate-x-1/2 items-start justify-center"
      >
        <div
          class="pointer-events-auto relative -translate-y-[30%] sm:-translate-y-[38%]"
        >
          <div
            class="absolute left-1/2 top-1/2 h-[9.5rem] w-[9.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-2xl sm:h-[12rem] sm:w-[12rem]"
          ></div>
          <ProfileScoreDonut
            class="relative z-10"
            {address}
            imageUrl={profile?.previewImageUrl}
            name={profile?.name}
            showBookmarkBadge={isBookmarked}
            size={80}
            mobileScale={1.4}
            pictureOverlayUrl={undefined}
            pictureOverlayAlt="Overlay"
            overlayButtonLabel={relationActionLabel}
            overlayButtonTitle={relationActionLabel}
            overlayButtonTone="trust"
            onOverlayButtonClick={onRelationAction}
            avatarType={avatarInfo?.type}
            rings={ringMetrics}
          />
        </div>
      </div>
    {/if}

    <div
      class={`flex flex-col items-center text-center ${isPopup ? 'gap-3 rounded-[2rem] bg-white px-4 pb-3 pt-28 shadow-sm ring-1 ring-base-200/70 sm:px-6 sm:pt-36' : 'gap-4'}`}
    >
      <div
        class={`relative flex w-full items-start justify-center overflow-visible ${isPopup ? 'min-h-0 pb-0' : 'min-h-[9rem] pb-2 sm:min-h-[10rem]'}`}
      >
        {#if !isPopup}
          <div
            class="absolute left-1/2 top-0 z-10 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:top-1/2 sm:-translate-y-1/2"
          >
            <button
              type="button"
              class={`btn btn-ghost btn-sm rounded-full min-h-10 h-10 px-3.5 gap-2 border border-base-300/70 bg-base-100/95 shadow-sm z-20 ${relationButtonEnabled ? 'cursor-pointer' : 'cursor-default'} ${relationIsPositive ? 'text-success' : 'text-base-content/70'} sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-[calc(100%+5.5rem)] sm:-translate-y-1/2`}
              onclick={() => onRelationAction?.()}
              aria-label={hasTrustRow ? relationText : 'Not connected'}
              title={hasTrustRow ? relationText : 'Not connected'}
            >
              {#if relationIconUrl}
                <img
                  src={relationIconUrl}
                  alt=""
                  class="action-icon"
                  aria-hidden="true"
                />
              {/if}
              <span class="text-xs font-medium truncate max-w-[16rem]">
                {hasTrustRow ? relationText : 'Not connected'}
              </span>
            </button>
          </div>
        {/if}

        <div
          class={`absolute left-1/2 -translate-x-1/2 rounded-full bg-primary/5 blur-2xl sm:top-1/2 sm:-translate-y-1/2 ${isPopup ? 'hidden' : 'top-4 h-[18rem] w-[18rem] sm:h-[12.5rem] sm:w-[12.5rem]'}`}
        ></div>

        {#if !isPopup}
          <div
            class="absolute right-1 top-2 z-20 sm:left-1/2 sm:right-auto sm:top-1/2 sm:translate-x-[calc(100%+4rem)] sm:-translate-y-1/2"
          >
            <HelpPopover
              title="Trust & routing"
              lines={trustRoutingHelpLines}
              buttonClass="hero-overlay-button"
              widthClass="w-80"
            />
          </div>
        {/if}

        {#if !isPopup}
          <ProfileScoreDonut
            class="z-10"
            {address}
            imageUrl={profile?.previewImageUrl}
            name={profile?.name}
            showBookmarkBadge={isBookmarked}
            size={96}
            mobileScale={2}
            pictureOverlayUrl={relationOverlayUrl}
            pictureOverlayAlt="Overlay"
            overlayButtonLabel=""
            overlayButtonTitle=""
            overlayButtonTone="default"
            onOverlayButtonClick={undefined}
            avatarType={avatarInfo?.type}
            rings={ringMetrics}
          />
        {/if}
      </div>

      <div class={`space-y-1 ${isPopup ? 'mt-0 sm:mt-1' : ''}`}>
        <h1
          class={`font-semibold tracking-tight text-base-content ${isPopup ? 'text-lg sm:text-xl' : 'text-xl'}`}
        >
          {profile?.name ?? 'Profile'}
        </h1>
        <p
          class={`text-base-content/72 max-w-md ${isPopup ? 'text-[13px] leading-snug' : 'text-sm'}`}
        >
          {hasTrustRow
            ? relationText
            : 'Trust and profile details at a glance.'}
        </p>
        <!-- Popup trust explainer text intentionally disabled; trust details stay in the dedicated action/panel flow. -->
        <!--
        <p
          class={`text-base-content/55 ${isPopup ? 'text-[11px]' : 'text-xs'}`}
        >
          Trust = you accept Circles from this account.
        </p>
        -->
      </div>

      <div
        class={`flex flex-wrap items-center justify-center ${isPopup ? 'gap-1.5' : 'gap-2'}`}
      >
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
                size={18}
                class={isBookmarked
                  ? 'action-icon action-icon--soft-stroke text-yellow-500 fill-yellow-500'
                  : 'action-icon action-icon--soft-stroke text-base-content/60'}
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
            <img src="/chart.svg" alt="Chart" class="action-icon" />
            <span>Metrics</span>
          </button>
        {/if}

        {#if address}
          <JumpLink
            url={'https://gnosisscan.io/address/' + address}
            className="btn-utility-soft"
          >
            <img src="/external.svg" alt="External Link" class="action-icon" />
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
