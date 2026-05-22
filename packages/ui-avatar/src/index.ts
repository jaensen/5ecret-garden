export { default as AvatarDisplay } from './AvatarDisplay.svelte';
export { default as HorizontalAvatarLayout } from './HorizontalAvatarLayout.svelte';
export { default as VerticalAvatarLayout } from './VerticalAvatarLayout.svelte';
export { default as AvatarSkeletonHorizontal } from './AvatarSkeletonHorizontal.svelte';
export { default as AvatarSkeletonVertical } from './AvatarSkeletonVertical.svelte';
export { default as AvatarSkeletonSmall } from './AvatarSkeletonSmall.svelte';

export type AvatarDisplayProfile = {
  name?: string;
  description?: string;
  previewImageUrl?: string;
};

export type AvatarDisplayView = 'horizontal' | 'horizontal_reverse' | 'vertical' | 'small' | 'small_no_text' | 'small_reverse';