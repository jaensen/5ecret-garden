<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
    clickable?: boolean;
    selected?: boolean;
    disabled?: boolean;
    dense?: boolean;
    noLeading?: boolean;
    className?: string;
    activationKeys?: Array<'Enter' | ' '>;
    onclick?: (event: MouseEvent) => void;
    leading?: Snippet;
    title?: Snippet;
    subtitle?: Snippet;
    meta?: Snippet;
    trailing?: Snippet;
    children?: Snippet;
  };

  let {
    clickable = false,
    selected = false,
    disabled = false,
    dense = false,
    noLeading = false,
    class: classAttr = '',
    className = '',
    activationKeys = ['Enter', ' '],
    onclick,
    onkeydown,
    role = undefined,
    tabindex = undefined,
    leading,
    title,
    subtitle,
    meta,
    trailing,
    children,
    ...rest
  }: Props = $props();

  let el: HTMLDivElement | null = $state(null);

  const isInteractive = $derived(clickable && !disabled);
  const resolvedRole = $derived(role ?? (isInteractive ? 'button' : 'group'));
  const resolvedTabindex = $derived(tabindex ?? (isInteractive ? 0 : undefined));

  function isNestedInteractiveTarget(target: EventTarget | null): boolean {
    const node = target instanceof Element ? target : null;
    if (!node || node === el) return false;
    return Boolean(node.closest('button, a[href], input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [data-ui-row-ignore-activation]'));
  }

  function handleClick(event: MouseEvent): void {
    if (!isInteractive) return;
    if (isNestedInteractiveTarget(event.target)) return;
    onclick?.(event);
  }

  function handleKeydown(event: KeyboardEvent): void {
    onkeydown?.(event as KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement });
    if (event.defaultPrevented || !isInteractive) return;
    if (isNestedInteractiveTarget(event.target)) return;
    if (!activationKeys.includes(event.key as 'Enter' | ' ')) return;
    event.preventDefault();
    el?.click();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  {...rest}
  bind:this={el}
  data-ui-row
  data-ui-row-clickable={isInteractive ? 'true' : undefined}
  data-ui-row-selected={selected ? 'true' : undefined}
  data-ui-row-disabled={disabled ? 'true' : undefined}
  data-ui-row-dense={dense ? 'true' : undefined}
  data-ui-row-no-leading={noLeading ? 'true' : undefined}
  class={`gui-row ${classAttr} ${className}`.trim()}
  role={resolvedRole}
  aria-disabled={disabled ? 'true' : undefined}
  aria-selected={selected ? 'true' : undefined}
  tabindex={resolvedTabindex}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  {#if !noLeading}
    <div class="gui-row__leading" data-ui-row-leading>
      {@render leading?.()}
    </div>
  {/if}

  <div class="gui-row__content" data-ui-row-content>
    {#if title}
      <div class="gui-row__title" data-ui-row-title>{@render title()}</div>
    {/if}
    {#if subtitle}
      <div class="gui-row__subtitle" data-ui-row-subtitle>{@render subtitle()}</div>
    {/if}
    {#if meta}
      <div class="gui-row__meta" data-ui-row-meta>{@render meta()}</div>
    {/if}
    {@render children?.()}
  </div>

  {#if trailing}
    <div class="gui-row__trailing" data-ui-row-trailing>
      {@render trailing()}
    </div>
  {/if}
</div>

<style>
  .gui-row {
    --gui-row-height: var(--row-height, 56px);
    --gui-row-pad-x: var(--row-pad-x, 1rem);
    --gui-row-pad-y: var(--row-pad-y, .75rem);
    --gui-row-gap: var(--row-gap, .75rem);
    --gui-row-radius: var(--row-radius, .875rem);
    --gui-row-bg: var(--row-bg, transparent);
    --gui-row-bg-hover: var(--row-bg-hover, rgb(15 23 42 / 0.04));
    --gui-row-bg-selected: var(--row-bg-selected, rgb(59 130 246 / 0.08));
    --gui-row-border: var(--row-border, transparent);
    --gui-row-border-hover: var(--row-border-hover, transparent);
    --gui-row-border-selected: var(--row-border-selected, transparent);
    --gui-row-focus: var(--row-focus, var(--row-border-selected, #2563eb));
    --gui-row-fg: var(--row-fg, #18181b);
    --gui-row-muted: var(--row-fg-muted, #52525b);
    --gui-row-muted-2: var(--row-fg-muted-2, #71717a);

    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    width: 100%;
    min-height: var(--gui-row-height);
    box-sizing: border-box;
    padding: var(--gui-row-pad-y) var(--gui-row-pad-x);
    gap: var(--gui-row-gap);
    color: var(--gui-row-fg);
    background: var(--gui-row-bg);
    border: 1px solid var(--gui-row-border);
    border-radius: var(--gui-row-radius);
    transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 80ms ease;
  }

  .gui-row[data-ui-row-no-leading='true'] { grid-template-columns: minmax(0, 1fr) auto; }
  .gui-row[data-ui-row-clickable='true'] { cursor: pointer; }
  .gui-row[data-ui-row-clickable='true']:hover { background: var(--gui-row-bg-hover); border-color: var(--gui-row-border-hover); }
  .gui-row[data-ui-row-clickable='true']:active { filter: brightness(.99); }
  .gui-row[data-ui-row-selected='true'] {
    background: var(--gui-row-bg-selected);
    border-color: var(--gui-row-border-selected);
    box-shadow: inset 0 0 0 max(0px, 2px) var(--gui-row-border-selected, transparent);
  }
  .gui-row[data-ui-row-disabled='true'] { opacity: .6; cursor: not-allowed; }
  .gui-row[data-ui-row-dense='true'] { --gui-row-height: 44px; --gui-row-pad-x: .75rem; --gui-row-pad-y: .5rem; }
  .gui-row:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--gui-row-focus); }

  .gui-row__leading,
  .gui-row__trailing { display: flex; align-items: center; gap: .5rem; min-width: 0; }
  .gui-row__content { min-width: 0; display: grid; gap: 2px; }
  .gui-row__title,
  .gui-row__subtitle,
  .gui-row__meta { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gui-row__title { font-weight: 600; color: var(--gui-row-fg); }
  .gui-row__subtitle { font-size: .875rem; color: var(--gui-row-muted); }
  .gui-row__meta { font-size: .75rem; color: var(--gui-row-muted-2); }
</style>