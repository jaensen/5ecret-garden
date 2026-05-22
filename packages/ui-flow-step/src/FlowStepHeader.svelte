<script lang="ts">
  interface Props {
    step: number;
    total: number;
    title: string;
    subtitle?: string;
    labels?: readonly string[];
  }
  let { step, total, title, subtitle, labels = [] }: Props = $props();
  const activeIndex = $derived.by(() => total <= 0 ? 0 : Math.max(0, Math.min(total - 1, step - 1)));
</script>

<header class="gui-step-header">
  <div class="gui-step-header__top">
    <div class="gui-step-header__title-wrap">
      <h2 class="gui-step-header__title">{title}</h2>
      {#if subtitle}<p class="gui-step-header__subtitle">{subtitle}</p>{/if}
    </div>
    <div class="gui-step-header__badge">{step}/{total}</div>
  </div>
  <div class="gui-step-header__progress" aria-label={`Step ${step} of ${total}`}>
    {#each Array(total) as _, index}
      <span class="gui-step-header__progress-segment" class:gui-step-header__progress-segment--active={index <= activeIndex}></span>
    {/each}
  </div>
  {#if labels.length}
    <div class="gui-step-header__labels">
      {#each labels as label, index}
        <span class:gui-step-header__labels--active={index === activeIndex}>{label}</span>
      {/each}
    </div>
  {/if}
</header>

<style>
  .gui-step-header { display:flex; flex-direction:column; gap:.5rem; }
  .gui-step-header__top { display:flex; justify-content:space-between; gap:.75rem; }
  .gui-step-header__title { margin:0; font-size:1rem; }
  .gui-step-header__subtitle { margin:.25rem 0 0; color:#52525b; font-size:.875rem; }
  .gui-step-header__badge { font-size:.75rem; padding:.2rem .45rem; border:1px solid #d4d4d8; border-radius:999px; }
  .gui-step-header__progress { display:flex; gap:.25rem; }
  .gui-step-header__progress-segment { height:.25rem; flex:1; border-radius:999px; background:#e4e4e7; }
  .gui-step-header__progress-segment--active { background:#2563eb; }
  .gui-step-header__labels { display:flex; justify-content:space-between; gap:.5rem; font-size:.75rem; color:#71717a; }
  .gui-step-header__labels--active { color:#18181b; font-weight:600; }
</style>
