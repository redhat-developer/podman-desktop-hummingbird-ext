<script lang="ts">
import type { VulnerabilitiesSummary } from '@podman-desktop/extension-hummingbird-core-api';
import VulnerabilitySummary from './VulnerabilitySummary.svelte';
import type { Snippet } from 'svelte';
import RepositoryIcon from '$lib/icons/RepositoryIcon.svelte';

interface Props {
  title: string;
  subtitle: string;
  version: string;
  vulnerabilities?: VulnerabilitiesSummary;
  vulnerabilitiesReduction?: number;
  size: string;
  sizeReductionPercent?: number;
  isHummingbird?: boolean;
  date?: string | Date;
  dateLabel?: string;
  dateDisplay?: Snippet;
}

let {
  title,
  subtitle,
  version,
  vulnerabilities,
  vulnerabilitiesReduction,
  size,
  sizeReductionPercent,
  isHummingbird = false,
  date,
  dateLabel = 'Last Updated',
  dateDisplay,
}: Props = $props();
</script>

<div
  class="bg-[var(--pd-content-card-bg)] rounded-lg border {isHummingbird
    ? 'border-purple-500/30'
    : 'border-[var(--pd-content-card-border)]'} p-5">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-4">
    <RepositoryIcon
      class={[...(isHummingbird ? ['text-purple-400'] : ['text-[var(--pd-content-text)] grayscale'])]}
      size={24} />
    <div class="min-w-0 flex-1">
      <span class="text-base font-bold text-[var(--pd-content-header)] block truncate" title={title}>{title}</span>
      <span class="text-xs {isHummingbird ? 'text-purple-400' : 'text-[var(--pd-content-text)] opacity-50'} block"
        >{subtitle}</span>
    </div>
  </div>

  <!-- Metadata List -->
  <div class="space-y-3">
    <!-- Version Row -->
    <div class="flex justify-between items-center">
      <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Version</span>
      <span class="text-sm font-mono {isHummingbird ? 'text-purple-400' : 'text-[var(--pd-content-header)]'}"
        >{version}</span>
    </div>

    <!-- Vulnerabilities Row -->
    <div class="flex justify-between items-center">
      <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Vulnerabilities</span>
      <VulnerabilitySummary
        vulnerabilities={vulnerabilities}
        reduction={vulnerabilitiesReduction}
        showReduction={isHummingbird} />
    </div>

    <!-- Size Row -->
    <div class="flex justify-between items-center">
      <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Size</span>
      <span class="text-sm text-[var(--pd-content-header)]">
        {size}
        {#if isHummingbird && sizeReductionPercent !== undefined && sizeReductionPercent > 0}
          <span class="text-xs text-purple-400 font-medium">(-{sizeReductionPercent.toFixed(0)}%)</span>
        {/if}
      </span>
    </div>

    <!-- Date Row -->
    <div class="flex justify-between items-center">
      <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">{dateLabel}</span>
      <span class="text-sm text-[var(--pd-content-header)]">
        {#if dateDisplay}
          {@render dateDisplay()}
        {:else if date}
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        {:else}
          —
        {/if}
      </span>
    </div>
  </div>
</div>
