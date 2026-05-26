<script lang="ts">
  import { page } from '$app/stores';
  import { sanitizeUrl } from '$lib/shared/ui/content/markdown/ast';

  let copyIcon = $state('/copy.svg');

  const rawTo = $derived($page.url.searchParams.get('to') ?? '');
  const destination = $derived(sanitizeUrl(rawTo));

  function copyDestination(): void {
    if (!destination) return;
    navigator.clipboard?.writeText(destination).catch(() => {});
    copyIcon = '/check.svg';
    setTimeout(() => {
      copyIcon = '/copy.svg';
    }, 1000);
  }
</script>

<div class="w-full flex justify-center px-4">
  <div class="w-full max-w-md mt-10 space-y-4">
    <h1 class="text-xl font-semibold">Leaving this app</h1>

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

        <div class="flex flex-wrap gap-2">
          <a
            class="btn btn-primary"
            href={destination}
            target="_blank"
            rel="noopener noreferrer">Continue</a
          >
          <button
            type="button"
            class="btn btn-ghost"
            onclick={() => history.back()}>Back</button
          >
        </div>
      </div>
    {:else}
      <div class="space-y-3">
        <div class="alert alert-error">Invalid or unsupported link.</div>
        <button
          type="button"
          class="btn btn-ghost"
          onclick={() => history.back()}>Back</button
        >
      </div>
    {/if}
  </div>
</div>
