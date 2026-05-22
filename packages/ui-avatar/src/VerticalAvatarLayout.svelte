<script lang="ts">
  import type { AvatarDisplayProfile } from './index';

  interface Props {
    profile: AvatarDisplayProfile | undefined;
    showBookmarkBadge?: boolean;
    onclick?: (e: MouseEvent) => void | undefined;
    descriptionRenderer?: import('svelte').Snippet<[string]>;
  }

  let { profile, showBookmarkBadge = false, onclick, descriptionRenderer }: Props = $props();

  let imgError: boolean = $state(false);
  const imgUrl = $derived(profile?.previewImageUrl || '');
  function onImgError() { imgError = true; }
  $effect(() => { imgUrl; imgError = false; });
</script>

<div class="w-full flex flex-col items-center text-center">
  <button class="cursor-pointer" {onclick}>
    <span class="relative inline-flex">
      {#if imgUrl && !imgError}
        <img
          src={imgUrl}
          alt={profile?.name ?? 'Profile avatar'}
          class="w-20 h-20 object-cover rounded-full"
          onerror={onImgError}
        />
      {:else}
        <img src="/logo.svg" alt="Fallback" class="w-20 h-20 object-cover rounded-full" />
      {/if}

      {#if showBookmarkBadge}
        <span
          class="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-content text-[11px] leading-none font-bold border border-base-100"
          aria-label="Bookmarked"
          title="Bookmarked"
        >
          ★
        </span>
      {/if}
    </span>
  </button>
  <div class="flex flex-col items-center p-4 gap-y-0.5">
    <span class="font-semibold text-base-content">{profile?.name}</span>
    {#if profile?.description}
      {#if descriptionRenderer}
        {@render descriptionRenderer(profile.description)}
      {:else}
        <p class="text-sm text-base-content/70 mt-0">{profile.description}</p>
      {/if}
    {/if}
  </div>
</div>