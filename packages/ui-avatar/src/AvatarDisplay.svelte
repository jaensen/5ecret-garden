<script lang="ts">
  import type { Snippet } from 'svelte';
  import HorizontalAvatarLayout from './HorizontalAvatarLayout.svelte';
  import VerticalAvatarLayout from './VerticalAvatarLayout.svelte';
  import AvatarSkeletonHorizontal from './AvatarSkeletonHorizontal.svelte';
  import AvatarSkeletonSmall from './AvatarSkeletonSmall.svelte';
  import AvatarSkeletonVertical from './AvatarSkeletonVertical.svelte';
  import type { AvatarDisplayProfile, AvatarDisplayView } from './index';
  import { fade } from 'svelte/transition';

  interface Props {
    profile?: AvatarDisplayProfile;
    clickable?: boolean;
    view: AvatarDisplayView;
    pictureOverlayUrl?: string | undefined;
    showBookmarkBadge?: boolean;
    topInfo?: string | undefined;
    bottomInfo?: string | undefined;
    placeholderAvatar?: boolean;
    placeholderTop?: boolean;
    placeholderBottom?: boolean;
    title?: string;
    typeLabel?: string;
    onActivate?: (e: MouseEvent) => void;
    descriptionRenderer?: Snippet<[string]>;
  }

  let {
    profile = undefined,
    clickable = true,
    view,
    pictureOverlayUrl,
    showBookmarkBadge = false,
    topInfo,
    bottomInfo,
    placeholderAvatar = true,
    placeholderTop = true,
    placeholderBottom = true,
    title,
    typeLabel,
    onActivate,
    descriptionRenderer,
  }: Props = $props();

  const placeholderHasTopInfo = $derived(placeholderTop && !!topInfo);
  const placeholderHasBottomInfo = $derived(placeholderBottom && !!bottomInfo);
  const tooltipText = $derived(title ?? profile?.name ?? 'Profile');
  const computedBottomInfo = $derived.by(() => {
    const normalizedType = typeLabel && typeLabel !== 'None' ? typeLabel : undefined;
    if (bottomInfo && normalizedType) return `${normalizedType} • ${bottomInfo}`;
    return normalizedType ?? bottomInfo;
  });

  function handleActivate(e: MouseEvent) {
    if (!clickable) return;
    onActivate?.(e);
  }
</script>

{#if !profile}
  {#if view === 'horizontal' || view === 'horizontal_reverse'}
    <AvatarSkeletonHorizontal
      reverse={view === 'horizontal_reverse'}
      showAvatar={placeholderAvatar}
      showTop={placeholderHasTopInfo}
      showBottom={placeholderHasBottomInfo}
      {showBookmarkBadge}
      showOverlay={!!pictureOverlayUrl}
    />
  {:else if view === 'small' || view === 'small_no_text'}
    <AvatarSkeletonSmall showAvatar={placeholderAvatar} showText={view === 'small' && placeholderTop} />
  {:else if view === 'small_reverse'}
    <AvatarSkeletonSmall reverse={true} showAvatar={placeholderAvatar} showText={placeholderTop} />
  {:else}
    <AvatarSkeletonVertical
      showAvatar={placeholderAvatar}
      showTop={placeholderTop}
      showBottom={placeholderBottom}
      {showBookmarkBadge}
    />
  {/if}
{:else if view === 'horizontal' || view === 'horizontal_reverse'}
  <div transition:fade title={tooltipText}>
    <HorizontalAvatarLayout
      {pictureOverlayUrl}
      {showBookmarkBadge}
      reverse={view === 'horizontal_reverse'}
      onclick={handleActivate}
      {profile}
      {topInfo}
      bottomInfo={computedBottomInfo}
    />
  </div>
{:else if view === 'small' || view === 'small_no_text'}
  <div class="inline-flex items-center gap-2" transition:fade>
    <button
      class="cursor-pointer inline-flex items-center"
      onclick={handleActivate}
      aria-label={tooltipText}
      title={tooltipText}
      disabled={!clickable}
    >
      <span class="relative inline-flex">
        <img src={profile?.previewImageUrl || '/logo.svg'} alt="User Icon" class="w-6 h-6 object-cover rounded-full" />
        {#if showBookmarkBadge}
          <span class="absolute -top-1 -right-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warning text-warning-content text-[9px] leading-none font-bold border border-base-100" aria-label="Bookmarked" title="Bookmarked">★</span>
        {/if}
      </span>
    </button>
    {#if view === 'small'}
      <span class="text-sm font-medium truncate max-w-[12rem] align-middle">{profile?.name}</span>
    {/if}
  </div>
{:else if view === 'small_reverse'}
  <div class="inline-flex items-center gap-2" transition:fade>
    <span class="text-sm font-medium truncate max-w-[12rem] align-middle text-right">{profile?.name}</span>
    <button
      class="cursor-pointer inline-flex items-center"
      onclick={handleActivate}
      aria-label={tooltipText}
      title={tooltipText}
      disabled={!clickable}
    >
      <span class="relative inline-flex">
        <img src={profile?.previewImageUrl || '/logo.svg'} alt="User Icon" class="w-6 h-6 object-cover rounded-full" />
        {#if showBookmarkBadge}
          <span class="absolute -top-1 -right-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warning text-warning-content text-[9px] leading-none font-bold border border-base-100" aria-label="Bookmarked" title="Bookmarked">★</span>
        {/if}
      </span>
    </button>
  </div>
{:else}
  <div transition:fade title={tooltipText}>
    <VerticalAvatarLayout onclick={handleActivate} {profile} {showBookmarkBadge} {descriptionRenderer} />
  </div>
{/if}