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
    overlayButtonLabel?: string;
    overlayButtonTitle?: string;
    overlayButtonTone?: 'trust' | 'default';
    onOverlayButtonClick?: (() => void) | undefined;
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
    overlayButtonLabel = '',
    overlayButtonTitle = '',
    overlayButtonTone = 'default',
    onOverlayButtonClick = undefined,
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
  let showScoreInAvatar: boolean = $state(false);
  let showOverlayButtonLabel: boolean = $state(false);
  let scorePreviewTimeout: ReturnType<typeof setTimeout> | null = null;
  let imgError: boolean = $state(false);
  let activeRingIndex: number | null = $state(null);
  let ringsAnimatedIn: boolean = $state(false);
  let isDesktop: boolean = $state(false);

  type RingSegment = {
    start: number;
    length: number;
    revealOrder: number;
    revealDirection: number;
    revealAngle: number;
  };

  const safeImageUrl = $derived(imageUrl?.trim() || '/logo.svg');
  const avatarTypeLabel = $derived(getTypeString(avatarType ?? ''));
  const hasOverlayButton = $derived(typeof onOverlayButtonClick === 'function');
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
  const canPreviewScoreInAvatar = $derived(
    overlayButtonTone === 'trust' && formattedScore !== '—'
  );
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

  const avatarSize = $derived(Math.round(size * (isDesktop ? 0.98 : 0.84)));
  const avatarHaloWidth = 4;
  const innerRingGap = 3;
  const outerRingGap = 8;
  const ringStrokeWidth = $derived(isDesktop ? 14 : 14);
  const trustRingRadius = $derived(
    avatarSize / 2 + avatarHaloWidth + innerRingGap + ringStrokeWidth / 2
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
    return 'text-trust-accent';
  });
  const ringStep = $derived(ringStrokeWidth + outerRingGap);
  function buildRingSegments(
    value: number,
    circumferenceValue: number,
    ringIndex: number,
    strokeWidth: number
  ): RingSegment[] {
    const filledLength = circumferenceValue * (value / 100);
    if (filledLength <= 0.001) return [];

    if (value < 20) {
      return [
        {
          start: 0,
          length: filledLength,
          revealOrder: 0,
          revealDirection: ringIndex % 2 === 0 ? 1 : -1,
          revealAngle: 4,
        },
      ];
    }

    const small = 1.0;
    const medium = 2.25;
    const large = 3.4;
    const motifs = [
      [small, small, small, medium, large],
      [small, small, medium, small, large],
      [small, medium, small, small, large],
      [small, small, small, large, medium],
      [small, small, medium, large, small],
    ];

    const motif = motifs[ringIndex % motifs.length];
    const segments: RingSegment[] = [];
    const minSegment = strokeWidth * 0.9;
    const gapPx = Math.max(
      strokeWidth * 1.35,
      Math.max(9, Math.min(12, Math.round(strokeWidth * 0.8)))
    );
    const plannedLengths: number[] = [];
    let consumed = 0;
    let motifIndex = 0;

    while (consumed < filledLength - minSegment * 0.45) {
      const desiredLength = motif[motifIndex % motif.length] * strokeWidth;
      const remaining = filledLength - consumed;
      const segmentLength = Math.min(desiredLength, remaining);

      if (segmentLength >= minSegment * 0.55) {
        plannedLengths.push(segmentLength);
      } else if (plannedLengths.length > 0) {
        plannedLengths[plannedLengths.length - 1] += remaining;
        break;
      } else {
        plannedLengths.push(filledLength);
        break;
      }

      consumed += segmentLength;
      motifIndex += 1;

      const remainingAfterSegment = filledLength - consumed;
      if (remainingAfterSegment <= gapPx + minSegment * 0.55) {
        if (remainingAfterSegment > 0 && plannedLengths.length > 0) {
          plannedLengths[plannedLengths.length - 1] += remainingAfterSegment;
        }
        break;
      }

      consumed += gapPx;
    }

    const totalSegmentLength = plannedLengths.reduce(
      (sum, length) => sum + length,
      0
    );
    const totalGapLength = gapPx * Math.max(0, plannedLengths.length - 1);
    const occupiedLength = totalSegmentLength + totalGapLength;
    const startOffset = Math.max(0, (filledLength - occupiedLength) / 2);
    let cursor = startOffset;

    for (const segmentLength of plannedLengths) {
      segments.push({
        start: cursor,
        length: segmentLength,
        revealOrder: 0,
        revealDirection: 0,
        revealAngle: 0,
      });
      cursor += segmentLength + gapPx;
    }

    const centeredIndices: number[] = [];
    const midLeft = Math.floor((segments.length - 1) / 2);
    const midRight = Math.ceil((segments.length - 1) / 2);
    for (let step = 0; step < segments.length; step += 1) {
      const leftIndex = midLeft - step;
      const rightIndex = midRight + step;
      if (step === 0) {
        if (leftIndex >= 0) centeredIndices.push(leftIndex);
        if (rightIndex !== leftIndex && rightIndex < segments.length) {
          centeredIndices.push(rightIndex);
        }
        continue;
      }
      if (ringIndex % 2 === 0) {
        if (rightIndex < segments.length) centeredIndices.push(rightIndex);
        if (leftIndex >= 0) centeredIndices.push(leftIndex);
      } else {
        if (leftIndex >= 0) centeredIndices.push(leftIndex);
        if (rightIndex < segments.length) centeredIndices.push(rightIndex);
      }
    }

    centeredIndices.forEach((segmentIndex, order) => {
      if (segments[segmentIndex]) {
        segments[segmentIndex].revealOrder = order;
        const centerPivot = (segments.length - 1) / 2;
        const relativeIndex = segmentIndex - centerPivot;
        const outwardDirection =
          relativeIndex === 0
            ? ringIndex % 2 === 0
              ? 1
              : -1
            : relativeIndex > 0
              ? 1
              : -1;
        segments[segmentIndex].revealDirection =
          ringIndex % 2 === 0 ? outwardDirection : -outwardDirection;
        segments[segmentIndex].revealAngle = Math.max(2.5, 8 - order * 1.1);
      }
    });

    return segments.length > 0
      ? segments
      : [
          {
            start: 0,
            length: filledLength,
            revealOrder: 0,
            revealDirection: ringIndex % 2 === 0 ? 1 : -1,
            revealAngle: 4,
          },
        ];
  }

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
          : ring.tone === 'emerald'
            ? 'text-emerald'
            : ring.tone === 'warning'
              ? 'text-warning'
              : ring.tone === 'amber'
                ? 'text-amber'
                : ring.tone === 'info'
                  ? 'text-info'
                  : ring.tone === 'sky'
                    ? 'text-sky'
                    : ring.tone === 'violet'
                      ? 'text-violet'
                      : ring.tone === 'rose'
                        ? 'text-rose'
                        : 'text-primary';
      const directionClass = index % 2 === 0 ? '-rotate-90' : 'rotate-90';
      const segments = buildRingSegments(value, c, index, ringStrokeWidth);
      const spinClass =
        index % 2 === 0
          ? 'profile-score-donut__segment-orbit--cw'
          : 'profile-score-donut__segment-orbit--ccw';
      const spinDurationMs = 14000 + index * 4200;
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
        segments,
        spinClass,
        spinDurationMs,
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
  const mobileFitScale = $derived.by(() => {
    if (isDesktop || typeof window === 'undefined') return mobileScale;
    const viewportAllowance = Math.max(240, window.innerWidth - 8);
    const fitScale = viewportAllowance / canvasSize;
    return Math.min(mobileScale, fitScale);
  });
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

  function resetScorePreview(): void {
    showScoreInAvatar = false;
    showOverlayButtonLabel = false;
    if (scorePreviewTimeout) {
      clearTimeout(scorePreviewTimeout);
      scorePreviewTimeout = null;
    }
  }

  function handleOverlayButtonClick(): void {
    if (canPreviewScoreInAvatar) {
      showScoreInAvatar = true;
      showOverlayButtonLabel = true;
      if (scorePreviewTimeout) clearTimeout(scorePreviewTimeout);
      scorePreviewTimeout = setTimeout(() => {
        showScoreInAvatar = false;
        showOverlayButtonLabel = false;
        scorePreviewTimeout = null;
      }, 2400);
      return;
    }

    onOverlayButtonClick?.();
  }

  $effect(() => {
    safeImageUrl;
    imgError = false;
  });

  $effect(() => {
    canPreviewScoreInAvatar;
    if (!canPreviewScoreInAvatar) {
      resetScorePreview();
    }
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
    const ringKey = `${address ?? 'none'}|${rings.length}`;
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

  $effect(() => {
    return () => {
      if (scorePreviewTimeout) clearTimeout(scorePreviewTimeout);
    };
  });
</script>

<div
  class={`profile-score-donut relative inline-flex items-center justify-center ${className}`.trim()}
  title={trustScoreTitle}
  style={`--mobile-donut-scale:${mobileFitScale}; --ring-stroke-uniform:${ringStrokeWidth}px;`}
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
        <g
          class={`profile-score-donut__segment-orbit ${ring.spinClass}`}
          style={`transform-origin: ${canvasCenter}px ${canvasCenter}px; animation-duration: ${ring.spinDurationMs}ms;`}
        >
          {#each ring.segments as segment, segmentIndex (`${ring.index}-${segmentIndex}`)}
            <g
              style={`transform-origin: ${canvasCenter}px ${canvasCenter}px; opacity: ${ringsAnimatedIn ? 1 : 0}; transform: rotate(${ringsAnimatedIn ? 0 : segment.revealDirection * segment.revealAngle}deg); transition-property: opacity, transform; transition-duration: ${620 + ring.index * 80}ms; transition-delay: ${ring.index * 55 + segment.revealOrder * 80}ms; transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);`}
            >
              <circle
                cx={canvasCenter}
                cy={canvasCenter}
                r={ring.radius}
                fill="none"
                stroke="currentColor"
                class={`${ring.toneClass} transition-all ease-out`}
                stroke-linecap="round"
                style="stroke-width: var(--ring-stroke-uniform);"
                stroke-dasharray={`${segment.length} ${ring.circumference}`}
                stroke-dashoffset={-segment.start}
              />
            </g>
          {/each}
        </g>
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

  <div class="absolute inset-0 z-[2] flex items-center justify-center">
    <div
      class="profile-score-donut__avatar-shell relative overflow-visible rounded-full bg-white shadow-sm"
      style={`width:${avatarSize}px;height:${Math.max(1, avatarSize - 1)}px;`}
    >
      <div
        class={`absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-[var(--brand-red,#df6552)] px-2 text-center text-white transition-all duration-300 ease-out ${showScoreInAvatar && canPreviewScoreInAvatar ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'}`}
      >
        <span class="text-[20px] font-extrabold tracking-tight sm:text-[22px]">
          {formattedScore}
        </span>
      </div>

      <div
        class={`h-full w-full overflow-hidden rounded-full transition-all duration-300 ease-out ${showScoreInAvatar && canPreviewScoreInAvatar ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        <img
          src={imgError ? '/logo.svg' : safeImageUrl}
          alt={name}
          class="h-full w-full object-cover rounded-full"
          onerror={onImgError}
        />
      </div>

      {#if showBookmarkBadge}
        <span
          class="absolute -top-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-content text-[11px] leading-none font-bold border border-base-100"
          aria-label="Bookmarked"
          title="Bookmarked"
        >
          ★
        </span>
      {/if}

      {#if hasOverlayButton}
        <button
          type="button"
          class={`absolute -bottom-[11px] -right-1 z-[5] inline-flex h-[33px] items-center justify-center rounded-full px-[5px] shadow-md transition-all duration-300 ease-out ${showOverlayButtonLabel ? 'w-auto min-w-[33px] gap-1.5 pl-2.5 pr-2.5' : 'w-[33px]'} ${overlayButtonTone === 'trust' ? 'bg-[var(--brand-red,#df6552)] text-white' : 'bg-base-100 text-base-content/75'}`}
          aria-label={overlayButtonLabel ||
            overlayButtonTitle ||
            'Open overlay action'}
          title={overlayButtonTitle ||
            overlayButtonLabel ||
            'Open overlay action'}
          onclick={handleOverlayButtonClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
            ></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <span
            class={`overflow-hidden whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 ease-out ${showOverlayButtonLabel ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}`}
          >
            Trust score
          </span>
        </button>
      {:else if pictureOverlayUrl}
        <img
          src={pictureOverlayUrl}
          alt={pictureOverlayAlt}
          class="absolute -bottom-0.5 -right-0.5 z-[4] h-[22px] w-[22px] rounded-full border border-base-100 bg-base-100 block p-[2px] shadow-md"
        />
      {:else if avatarTypeLabel !== 'None'}
        <img
          src={avatarTypeIcon}
          alt={avatarTypeLabel}
          title={avatarTypeLabel}
          class="absolute -bottom-0.5 -right-0.5 z-[4] h-[22px] w-[22px] rounded-full border border-base-100 bg-base-100 block p-[2px] shadow-md"
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

  .profile-score-donut__avatar-shell {
    border-radius: 9999px;
    background: white;
  }

  .profile-score-donut__segment-orbit {
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    animation-play-state: running;
    will-change: transform;
  }

  .profile-score-donut:hover .profile-score-donut__segment-orbit,
  .profile-score-donut:focus-within .profile-score-donut__segment-orbit {
    animation-play-state: paused;
  }

  .profile-score-donut__segment-orbit--cw {
    animation-name: profile-score-donut-spin-cw;
  }

  .profile-score-donut__segment-orbit--ccw {
    animation-name: profile-score-donut-spin-ccw;
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

  .profile-score-donut :global(.text-emerald) {
    color: #10b981;
  }

  .profile-score-donut :global(.text-amber) {
    color: #f59e0b;
  }

  .profile-score-donut :global(.text-sky) {
    color: #38bdf8;
  }

  .profile-score-donut :global(.text-violet) {
    color: #8b5cf6;
  }

  .profile-score-donut :global(.text-rose) {
    color: #f43f5e;
  }

  .profile-score-donut :global(.text-trust-accent) {
    color: var(--brand-red, #df6552);
  }

  @keyframes profile-score-donut-spin-cw {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes profile-score-donut-spin-ccw {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(-360deg);
    }
  }

  @media (min-width: 640px) {
    .profile-score-donut__rings {
      transform: scale(1);
    }
  }
</style>
