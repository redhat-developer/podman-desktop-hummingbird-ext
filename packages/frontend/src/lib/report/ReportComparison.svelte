<script lang="ts">
  import { filesize } from 'filesize';
  import RepositoryIcon from '$lib/icons/RepositoryIcon.svelte';

  interface Props {
    cveReductionPercent?: number;
    sizeReductionPercent?: number;
    altCveCount?: number;
    imageCveCount?: number;
    altSize?: number;
    imageSize?: number;
  }

  let { 
    cveReductionPercent, 
    sizeReductionPercent, 
    altCveCount, 
    imageCveCount, 
    altSize, 
    imageSize 
  }: Props = $props();

  const benefits = [
    {
      title: `${cveReductionPercent?.toFixed(0) ?? 0}% Fewer Vulnerabilities`,
      description: `Only ${altCveCount ?? 0} CVE vs ${imageCveCount ?? 0}`,
      show: cveReductionPercent !== undefined
    },
    {
      title: `${sizeReductionPercent?.toFixed(0) ?? 0}% Smaller Image Size`,
      description: `${filesize(altSize ?? 0)} vs ${filesize(imageSize ?? 0)}`,
      show: sizeReductionPercent !== undefined
    },
    {
      title: 'Enterprise-Grade Security',
      description: 'FIPS-compliant with continuous scanning',
      show: true
    },
    {
      title: 'Minimal Attack Surface',
      description: 'Distroless with essential components only',
      show: true
    }
  ];
</script>

<div class="bg-[var(--pd-content-card-bg)] rounded-lg border border-[var(--pd-content-card-border)] p-5">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-3">
    <div class="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
      <RepositoryIcon size={24} />
    </div>
    <div>
      <span class="text-base font-bold text-[var(--pd-content-header)]">Try the Alternate Base Image</span>
      <p class="text-xs text-[var(--pd-content-text)] opacity-70">Switch to Hummingbird for enhanced security and performance</p>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="grid grid-cols-2 gap-6 mt-4">
    <!-- Left: Benefits List -->
    <div class="space-y-3">
    {#each benefits.filter(b => b.show) as benefit (benefit.title)}
        <div class="flex items-start gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <span class="text-xs font-semibold text-[var(--pd-content-header)]">{benefit.title}</span>
            <p class="text-[10px] text-[var(--pd-content-text)] opacity-60">{benefit.description}</p>
          </div>
        </div>
      {/each}
    </div>

    <!-- Right: Evaluation Criteria -->
    <div class="space-y-3">
      <!-- Image Size Comparison -->
      {#if sizeReductionPercent !== undefined && altSize !== undefined && imageSize !== undefined}
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-[var(--pd-content-text)]">Image Size</span>
            <span class="text-xs font-semibold text-purple-400">-{sizeReductionPercent.toFixed(0)}%</span>
          </div>
          <div class="space-y-1">
            <div class="h-5 rounded bg-purple-500/40 flex items-center px-2" style="width: {Math.max(10, 100 - sizeReductionPercent)}%">
              <span class="text-[10px]  line-clamp-1 font-medium text-purple-200">{filesize(altSize)}</span>
            </div>
            <div class="h-5 rounded bg-purple-500/20 flex items-center px-2" style="width: 100%">
              <span class="text-[10px] font-medium text-purple-200/60">{filesize(imageSize)}</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- CVE Count Comparison -->
      {#if cveReductionPercent !== undefined && altCveCount !== undefined && imageCveCount !== undefined}
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-[var(--pd-content-text)]">CVE Count</span>
            <span class="text-xs font-semibold text-purple-400">-{cveReductionPercent.toFixed(0)}%</span>
          </div>
          <div class="space-y-1">
            <div class="h-5 rounded bg-purple-500/40 flex items-center px-2" style="width: {Math.max(10, 100 - cveReductionPercent)}%">
              <span class="text-[10px] font-medium text-purple-200">{altCveCount}</span>
            </div>
            <div class="h-5 rounded bg-purple-500/20 flex items-center px-2" style="width: 100%">
              <span class="text-[10px] font-medium text-purple-200/60">{imageCveCount}</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
