<script lang="ts">
  import { AvatarDisplay } from '@garden-ui/avatar';

  let activated = $state(0);
  const profile = {
    name: 'Alice',
    description: 'Profile description',
    previewImageUrl: '',
  };
</script>

<div class="space-y-4">
  <AvatarDisplay
    profile={profile}
    view="horizontal"
    topInfo="Top"
    bottomInfo="Bottom"
    typeLabel="Human"
    showBookmarkBadge={true}
    pictureOverlayUrl="/safe.svg"
    onActivate={() => (activated += 1)}
  />

  <AvatarDisplay
    profile={profile}
    view="vertical"
    showBookmarkBadge={true}
  >
    {#snippet descriptionRenderer(description: string)}
      <div data-avatar-description>{description.toUpperCase()}</div>
    {/snippet}
  </AvatarDisplay>

  <AvatarDisplay view="small" topInfo="Placeholder top" placeholderAvatar={true} placeholderTop={true} />

  <div data-activated={activated}></div>
</div>