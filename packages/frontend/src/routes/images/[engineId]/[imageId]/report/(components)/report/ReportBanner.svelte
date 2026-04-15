<script lang="ts">
import RepositoryIcon from '$lib/icons/RepositoryIcon.svelte';

interface Props {
  cveReductionCount?: number;
  cveReductionPercent?: number;
  sizeReductionPercent?: number;
}

let { cveReductionCount, cveReductionPercent, sizeReductionPercent }: Props = $props();
</script>

<div class="bg-purple-500/20 border border-purple-500/40 rounded-lg px-4 py-2">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div
        class="w-14 h-14 bg-purple-500/30 rounded-full flex items-center justify-center border-2 border-purple-400/50">
        <RepositoryIcon size={24} />
      </div>
      <div class="flex flex-col">
        <span class="text-lg font-bold text-purple-300">Hardened Alternative Found!</span>
        <span
          class:hidden={!!cveReductionPercent && cveReductionPercent <= 0}
          class="text-sm text-[var(--pd-content-text)] opacity-70"
          >A Hummingbird image is available with significant security improvements</span>
      </div>
    </div>

    <div
      role="region"
      aria-label="Optimization metrics"
      class:hidden={!!cveReductionPercent &&
        cveReductionPercent <= 0 &&
        !!sizeReductionPercent &&
        sizeReductionPercent <= 0}
      class="flex items-center gap-8 bg-[var(--pd-content-card-bg)]/50 rounded-lg px-6 py-3">
      {#if cveReductionCount !== undefined && cveReductionPercent !== undefined}
        <!-- CVEs -->
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-300">-{cveReductionCount}</div>
          <div class="text-xs text-[var(--pd-content-text)] opacity-60">CVEs</div>
        </div>

        <!-- CVE Reduction % -->
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-300">{cveReductionPercent.toFixed(0)}%</div>
          <div class="text-xs text-[var(--pd-content-text)] opacity-60">Fewer CVEs</div>
        </div>
      {/if}

      {#if sizeReductionPercent !== undefined && sizeReductionPercent > 0}
        <!-- Size Reduction -->
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-300">-{sizeReductionPercent.toFixed(0)}%</div>
          <div class="text-xs text-[var(--pd-content-text)] opacity-60">Smaller Size</div>
        </div>
      {/if}
    </div>
  </div>
</div>
