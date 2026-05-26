<script lang="ts">
  import { popupControls } from '$lib/shared/state/popup';
  import { sanitizeUrl } from '$lib/shared/ui/content/markdown/ast';

  let copyIcon = $state('/copy.svg');

  interface Props {
    to?: string;
  }

  const { to = '' }: Props = $props();

  const destination = $derived(sanitizeUrl(to) ?? null);

  function copyDestination(): void {
    if (!destination) return;
    navigator.clipboard?.writeText(destination).catch(() => {});
    copyIcon = '/check.svg';
    setTimeout(() => {
      copyIcon = '/copy.svg';
    }, 1000);
  }

  function onBack() {
    popupControls.back();
  }

  function onContinue() {
    if (!destination) return;
    window.open(destination, '_blank', 'noopener,noreferrer');
    popupControls.back();
  }
</script>

<div class="w-full">
  {#if destination}
    <div
      class="bg-base-100 border border-base-content/10 rounded-lg p-4 space-y-3"
    >
      <div class="text-sm opacity-70">
        You are about to open this link in a new tab:
      </div>
      <div
        class="relative min-h-11 rounded-xl border border-base-300/80 bg-base-200/55 pr-12"
      >
        <div
          class="min-h-11 overflow-x-auto whitespace-nowrap px-3 py-3 pr-0 font-mono text-sm leading-5 text-base-content/80"
        >
          {destination}
        </div>

        <button
          type="button"
          class="btn-icon-action absolute right-1.5 top-1/2 -translate-y-1/2"
          title="Copy address"
          aria-label="Copy address"
          onclick={copyDestination}
        >
          <img src={copyIcon} alt="" class="w-4 h-4" />
        </button>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          onclick={onContinue}>Continue</button
        >
        <button type="button" class="btn btn-ghost btn-sm" onclick={onBack}
          >Cancel</button
        >
      </div>
    </div>
  {:else}
    <div class="space-y-3">
      <div class="alert alert-error">Invalid or unsupported link.</div>
      <div class="flex justify-end">
        <button type="button" class="btn btn-ghost btn-sm" onclick={onBack}
          >Back</button
        >
      </div>
    </div>
  {/if}
</div>
