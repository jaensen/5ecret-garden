<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { Snippet } from 'svelte';

  interface Props {
    query: Writable<string>;
    placeholder?: string;
    class?: string;
    actions?: Snippet;
    onInputKeydown?: (event: KeyboardEvent) => void;
    onInputFocus?: (event: FocusEvent) => void;
    inputDataAttribute?: string;
    inputEl?: HTMLInputElement | null;
  }

  let {
    query,
    placeholder = 'Search…',
    class: className = '',
    actions,
    onInputKeydown,
    onInputFocus,
    inputDataAttribute,
    inputEl = $bindable(null)
  }: Props = $props();

  $effect(() => {
    if (!inputEl || !inputDataAttribute) return;
    const attrs = inputDataAttribute.split(/\s+/).map((it) => it.trim()).filter(Boolean);
    for (const attr of attrs) inputEl.setAttribute(attr, 'true');
    return () => {
      if (!inputEl) return;
      for (const attr of attrs) inputEl.removeAttribute(attr);
    };
  });
</script>

<div class={`gui-list-toolbar ${className}`.trim()}>
  <input
    type="text"
    bind:this={inputEl}
    class="gui-list-toolbar__input"
    {placeholder}
    bind:value={$query}
    onkeydown={onInputKeydown}
    onfocus={onInputFocus}
  />
  {@render actions?.()}
</div>

<style>
  .gui-list-toolbar { display:flex; align-items:center; gap:.5rem; margin-bottom:.75rem; }
  .gui-list-toolbar__input {
    width:100%; padding:.625rem .75rem; border:1px solid #d4d4d8; border-radius:.75rem; background:#fff;
  }
  .gui-list-toolbar__input:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
</style>
