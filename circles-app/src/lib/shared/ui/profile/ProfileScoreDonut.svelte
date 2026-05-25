<script lang="ts">
  import { normalizeEvmAddress as normalizeAddress } from '@circles-market/sdk';
  import type { Address } from '@circles-sdk/utils';
  import { getTypeString } from '$lib/shared/utils/helpers';
  import {
    fetchTrusteeValidation,
    getCachedTrusteeValidation,
    type TrusteeValidationResponse,
  } from '$lib/shared/model/profile';

  interface Props {
    address: Address | undefined;
    class?: string;
    imageUrl?: string | undefined;
    name?: string | undefined;
    showBookmarkBadge?: boolean;
    size?: number;
    mobileScale?: number;
    pictureOverlayUrl?: string | undefined;
    pictureOverlayAlt?: string;
    avatarType?: string | undefined;
    rings?: Array<{
      label: string;
      value: number;
      rawValue?: number;
      tone?: string;
      hint?: string;
    }>;
  }

  let {
    address,
    class: className = '',
    imageUrl = '',
    name = 'Profile avatar',
    showBookmarkBadge = false,
    size = 128,
    mobileScale = 1,
    pictureOverlayUrl = undefined,
    pictureOverlayAlt = 'Overlay',
    avatarType = undefined,
    rings = [],
  }: Props = $props();

  let trustScoreAbortController: AbortController | null = null;
  let trustScoreFor: string | null = $state(null);
  let trustScoreLoading: boolean = $state(false);
  let trustScoreError: string | null = $state(null);
  let trustScoreSupported: boolean | null = $state(null);
  let gnosisTrustScore: number | null = $state(null);
  let overallDangerScore: number | null = $state(null);
  let trustScoreSummary: string = $state('');
  let imgError: boolean = $state(false);
  let activeRingIndex: number | null = $state(null);
  let ringsAnimatedIn: boolean = $state(false);
  let isDesktop: boolean = $state(false);

  const safeImageUrl = $derived(imageUrl?.trim() || '/logo.svg');
  const avatarTypeLabel = $derived(getTypeString(avatarType ?? ''));
  const avatarTypeIcon = $derived.by(() => {
    if (avatarType === 'CrcV2_RegisterGroup') return '/group.svg';
    if (avatarType === 'CrcV2_RegisterOrganization') return '/organization.svg';
    return '/person.svg';
  });
  const scoreValue = $derived.by(() => {
    if (
      typeof gnosisTrustScore !== 'number' ||
      !Number.isFinite(gnosisTrustScore)
    ) {
      return null;
    }
    return Math.max(0, Math.min(100, gnosisTrustScore));
  });
  function formatScoreValue(value: number | null): string {
    return typeof value === 'number' && Number.isFinite(value)
      ? value.toFixed(0)
      : '—';
  }

  const formattedScore = $derived(formatScoreValue(scoreValue));
  function formatDangerScore(value: number | null): string | null {
    return typeof value === 'number' && Number.isFinite(value)
      ? value.toFixed(2)
      : null;
  }

  const formattedDangerScore = $derived(formatDangerScore(overallDangerScore));
  const trustScoreTitle = $derived.by(() => {
    const lines: string[] = [];
    if (trustScoreSummary) lines.push(trustScoreSummary);
    if (formattedDangerScore !== null) {
      lines.push(`Risk details: danger ${formattedDangerScore}`);
    }
    return lines.length > 0 ? lines.join('\n') : undefined;
  });

  const avatarSize = $derived(Math.round(size * 0.7));
  const avatarHaloWidth = 4;
  const ringGap = 2;
  const ringStrokeWidth = $derived(isDesktop ? 14 : 14);
  const trustRingRadius = $derived(
    avatarSize / 2 + avatarHaloWidth + ringGap + ringStrokeWidth / 2
  );
  const circumference = $derived(2 * Math.PI * trustRingRadius);
  const dashOffset = $derived.by(() => {
    if (scoreValue === null) return circumference;
    return circumference * (1 - scoreValue / 100);
  });
  const viewBoxSize = $derived(size + 12);
  const center = $derived(viewBoxSize / 2);
  const scoreToneClass = $derived.by(() => {
    if (scoreValue === null) return 'text-base-content/35';
    if (scoreValue >= 75) return 'text-info';
    if (scoreValue >= 45) return 'text-warning';
    return 'text-error';
  });
  const ringStep = $derived(ringStrokeWidth + 2);
  const normalizedRings = $derived.by(() =>
    rings.map((ring, index) => {
      const value = Math.max(0, Math.min(100, Number(ring.value) || 0));
      const r = trustRingRadius + ringStep + index * ringStep;
      const c = 2 * Math.PI * r;
      const offset = c * (1 - value / 100);
      const initialOffset = c;
      const toneClass =
        ring.tone === 'success'
          ? 'text-success'
          : ring.tone === 'warning'
            ? 'text-warning'
            : ring.tone === 'info'
              ? 'text-info'
              : 'text-primary';
      const directionClass = index % 2 === 0 ? '-rotate-90' : 'rotate-90';
      return {
        ...ring,
        index,
        value,
        radius: r,
        circumference: c,
        dashOffset: offset,
        animatedOffset: ringsAnimatedIn ? offset : initialOffset,
        toneClass,
        directionClass,
        displayValue:
          ring.rawValue != null ? String(ring.rawValue) : `${value} / 100`,
      };
    })
  );
  const outerRingExtent = $derived(
    normalizedRings.length > 0
      ? normalizedRings[normalizedRings.length - 1].radius + 8
      : trustRingRadius + 8
  );
  const canvasSize = $derived(Math.max(viewBoxSize, outerRingExtent * 2 + 24));
  const canvasCenter = $derived(canvasSize / 2);
  const activeRing = $derived.by(() => {
    if (typeof activeRingIndex === 'number') {
      return normalizedRings[activeRingIndex] ?? null;
    }

    return null;
  });

  const trustAnimatedOffset = $derived(
    ringsAnimatedIn ? dashOffset : circumference
  );

  function applyTrustScoreResponse(response: TrusteeValidationResponse): void {
    trustScoreSupported = response.supported ?? null;
    gnosisTrustScore =
      typeof response.gnosis_trust_score === 'number'
        ? response.gnosis_trust_score
        : null;
    overallDangerScore =
      typeof response.overall_danger_score === 'number'
        ? response.overall_danger_score
        : null;
    trustScoreSummary = response.summary ?? response.tldr ?? '';
    trustScoreError = null;
  }

  async function loadTrustScore(trusteeAddress: Address): Promise<void> {
    const normalizedTrustee = normalizeAddress(
      String(trusteeAddress)
    ).toLowerCase();
    trustScoreFor = normalizedTrustee;

    const cached = getCachedTrusteeValidation(normalizedTrustee);
    if (cached) {
      applyTrustScoreResponse(cached);
      trustScoreLoading = false;
      return;
    }

    trustScoreLoading = true;
    trustScoreError = null;
    trustScoreSupported = null;
    gnosisTrustScore = null;
    overallDangerScore = null;
    trustScoreSummary = '';

    if (trustScoreAbortController) {
      trustScoreAbortController.abort();
    }

    const controller = new AbortController();
    trustScoreAbortController = controller;

    try {
      const result = await fetchTrusteeValidation(normalizedTrustee, {
        signal: controller.signal,
      });

      if (trustScoreFor !== normalizedTrustee) {
        return;
      }
      applyTrustScoreResponse(result);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      if (trustScoreFor === normalizedTrustee) {
        trustScoreError = error?.message ?? 'Failed to load trust score';
      }
    } finally {
      if (trustScoreFor === normalizedTrustee) {
        trustScoreLoading = false;
      }
    }
  }

  function onImgError() {
    imgError = true;
  }

  $effect(() => {
    safeImageUrl;
    imgError = false;
  });

  $effect(() => {
    if (!address) {
      if (trustScoreAbortController) {
        trustScoreAbortController.abort();
      }
      trustScoreFor = null;
      trustScoreLoading = false;
      trustScoreError = null;
      trustScoreSupported = null;
      gnosisTrustScore = null;
      overallDangerScore = null;
      trustScoreSummary = '';
      return;
    }

    const normalizedAddress = normalizeAddress(String(address)).toLowerCase();
    if (!trustScoreLoading && trustScoreFor !== normalizedAddress) {
      setTimeout(() => {
        if (
          address &&
          normalizeAddress(String(address)).toLowerCase() === normalizedAddress
        ) {
          void loadTrustScore(address);
        }
      }, 0);
    }
  });

  $effect(() => {
    const ringKey = `${address ?? 'none'}|${rings.length}|${scoreValue ?? 'na'}`;
    ringKey;
    ringsAnimatedIn = false;
    const timer = setTimeout(() => {
      ringsAnimatedIn = true;
    }, 40);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      isDesktop = false;
      return;
    }

    const query = window.matchMedia('(min-width: 768px)');
    const sync = () => {
      isDesktop = query.matches;
    };

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  });
</script>

<div
  class={`profile-score-donut relative inline-flex items-center justify-center ${className}`.trim()}
  title={trustScoreTitle}
  style={`--mobile-donut-scale:${mobileScale}; --ring-stroke-uniform:${ringStrokeWidth}px;`}
>
  <svg
    class="profile-score-donut__rings overflow-visible drop-shadow-sm"
    width={canvasSize}
    height={canvasSize}
    viewBox={`0 0 ${canvasSize} ${canvasSize}`}
    aria-hidden="true"
  >
    {#each normalizedRings as ring}
      <g
        class={`origin-center ${ring.directionClass}`}
        role="button"
        tabindex="0"
        onpointerenter={() => (activeRingIndex = ring.index)}
        onpointerleave={() => (activeRingIndex = null)}
        onclick={() =>
          (activeRingIndex =
            activeRingIndex === ring.index ? null : ring.index)}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activeRingIndex =
              activeRingIndex === ring.index ? null : ring.index;
          }
        }}
      >
        <title
          >{ring.hint
            ? `${ring.label}: ${ring.value}. ${ring.hint}`
            : `${ring.label}: ${ring.value}`}</title
        >
        <circle
          cx={canvasCenter}
          cy={canvasCenter}
          r={ring.radius}
          fill="none"
          stroke="oklch(var(--b3) / 0.22)"
          style="stroke-width: var(--ring-stroke-uniform);"
        />
        <circle
          cx={canvasCenter}
          cy={canvasCenter}
          r={ring.radius}
          fill="none"
          stroke="currentColor"
          class={`${ring.toneClass} transition-all ease-out`}
          stroke-linecap="round"
          style={`stroke-width: var(--ring-stroke-uniform); transition-duration: ${760 + ring.index * 110}ms; transition-delay: ${ring.index * 55}ms;`}
          stroke-dasharray={ring.circumference}
          stroke-dashoffset={ring.animatedOffset}
        />
        <circle
          cx={canvasCenter}
          cy={canvasCenter}
          r={ring.radius}
          fill="none"
          stroke="transparent"
          style="stroke-width: calc(var(--ring-stroke-uniform) + 8px); cursor: pointer;"
        />
      </g>
    {/each}

    <g class="origin-center -rotate-90">
      <title>{trustScoreTitle ?? 'Trust score ring'}</title>
      <circle
        cx={canvasCenter}
        cy={canvasCenter}
        r={trustRingRadius}
        fill="none"
        stroke="oklch(var(--b3) / 0.55)"
        style="stroke-width: var(--ring-stroke-uniform);"
      />
      <circle
        cx={canvasCenter}
        cy={canvasCenter}
        r={trustRingRadius}
        fill="none"
        stroke="currentColor"
        class={`${scoreToneClass} transition-all ease-out`}
        stroke-linecap="round"
        style="stroke-width: var(--ring-stroke-uniform); transition-duration: 720ms; transition-delay: 0ms;"
        stroke-dasharray={circumference}
        stroke-dashoffset={trustAnimatedOffset}
      />
      <circle
        cx={canvasCenter}
        cy={canvasCenter}
        r={trustRingRadius}
        fill="none"
        stroke="transparent"
        style="stroke-width: calc(var(--ring-stroke-uniform) + 8px); cursor: pointer;"
      />
    </g>
  </svg>

  <div class="absolute inset-0 flex items-center justify-center">
    <div
      class="relative rounded-full bg-base-100 shadow-sm ring-[3px] ring-base-100/90 overflow-hidden"
      style={`width:${avatarSize}px;height:${avatarSize}px;`}
    >
      <img
        src={imgError ? '/logo.svg' : safeImageUrl}
        alt={name}
        class="h-full w-full object-cover rounded-full"
        onerror={onImgError}
      />

      {#if showBookmarkBadge}
        <span
          class="absolute -top-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-content text-[11px] leading-none font-bold border border-base-100"
          aria-label="Bookmarked"
          title="Bookmarked"
        >
          ★
        </span>
      {/if}

      {#if pictureOverlayUrl}
        <img
          src={pictureOverlayUrl}
          alt={pictureOverlayAlt}
          class="absolute -bottom-1 -right-1 h-[22px] w-[22px] rounded-full border-2 border-base-100 bg-base-100 block p-[2px] shadow-sm"
        />
      {:else if avatarTypeLabel !== 'None'}
        <img
          src={avatarTypeIcon}
          alt={avatarTypeLabel}
          title={avatarTypeLabel}
          class="absolute -bottom-1 -right-1 h-[22px] w-[22px] rounded-full border-2 border-base-100 bg-base-100 block p-[2px] shadow-sm"
        />
      {/if}
    </div>
  </div>

  {#if activeRing}
    <div
      class="absolute -top-16 left-1/2 z-10 -translate-x-1/2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-base-300/70 bg-base-100/95 px-3 py-2 shadow-lg backdrop-blur-md text-center"
    >
      <div class="text-[11px] uppercase tracking-[0.18em] text-base-content/45">
        {activeRing.label}
      </div>
      <div class="text-sm font-semibold text-base-content mt-0.5">
        {activeRing.displayValue}
      </div>
      {#if activeRing.hint}
        <div class="text-xs text-base-content/65 mt-1 leading-snug">
          {activeRing.hint}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .profile-score-donut {
    --mobile-donut-scale: 1;
  }

  .profile-score-donut__rings {
    transform: scale(var(--mobile-donut-scale));
    transform-origin: center;
  }

  .profile-score-donut :global(.text-primary) {
    color: oklch(var(--p));
  }

  .profile-score-donut :global(.text-info) {
    color: oklch(var(--in));
  }

  .profile-score-donut :global(.text-success) {
    color: oklch(var(--su));
  }

  .profile-score-donut :global(.text-warning) {
    color: oklch(var(--wa));
  }

  @media (min-width: 640px) {
    .profile-score-donut__rings {
      transform: scale(1);
    }
  }
</style>
