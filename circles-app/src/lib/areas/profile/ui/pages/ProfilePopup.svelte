<script lang="ts">
  import Profile from './Profile.svelte';
  import type { Address } from '@circles-sdk/utils';
  const { address, trustVersion } = $props<{
    address?: Address;
    trustVersion?: number;
  }>();
</script>

<div class="profile-popup-shell">
  <Profile {address} {trustVersion} isPopup={true} />
</div>

<style>
  .profile-popup-shell {
    overflow: visible;
  }
</style>
