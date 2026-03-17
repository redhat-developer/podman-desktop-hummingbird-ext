<script lang="ts">
  import RepositoryIcon from '$lib/icons/RepositoryIcon.svelte';
  import type { Alternative, ImageReport, Tag } from '@podman-desktop/extension-hummingbird-core-api';
  import { TableDurationColumn } from '@podman-desktop/ui-svelte';

  interface Props {
    alternative: Alternative
    image: ImageReport
  }

  let { alternative, image }: Props = $props();

  let tag: Tag | undefined = $derived.by(() => {
    return alternative.tags.find(t => t.name === alternative.image.latest_tag);
  });

  let cveReduction: [number, number] | undefined = $derived.by(() => {
    // if we do not have access to both SBOM we skip
    if(!image.sbom || !alternative.sbom) return undefined;

    // in the unfortunate case where the hummingbird image has more or equal packages we skip
    if(image.sbom.count < alternative.sbom.runtime_count) return undefined;

    return [
      image.sbom.count - alternative.sbom.runtime_count,
      100 - (alternative.sbom.runtime_count / image.sbom.count) * 100,
    ];
  });

  let altSize: number = $derived(tag?.sizes?.[image.inspect.Architecture] ?? -1);
  let sizeReduction: number = $derived.by(() => {
    return 100 - (altSize / image.inspect.Size) * 100;
  });
</script>

<div class="flex flex-col gap-5 overflow-auto">
  <!-- Alternate Image Found Banner -->
  <div class="bg-purple-500/20 border border-purple-500/40 rounded-lg px-4 py-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-purple-500/30 rounded-full flex items-center justify-center border-2 border-purple-400/50">
          <RepositoryIcon size={24} />
        </div>
        <div class="flex flex-col">
          <span class="text-lg font-bold text-purple-300">Hardened Alternative Found!</span>
          <span class="text-sm text-[var(--pd-content-text)] opacity-70">A Hummingbird image is available with significant security improvements</span>
        </div>
      </div>
      <div class="flex items-center gap-8 bg-[var(--pd-content-card-bg)]/50 rounded-lg px-6 py-3">

        {#if cveReduction}
          <!-- CVEs -->
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-300">-{cveReduction[0]}</div>
            <div class="text-xs text-[var(--pd-content-text)] opacity-60">CVEs</div>
          </div>

          <!-- CVE Reduction % -->
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-300">{cveReduction[1].toFixed(0)}%</div>
            <div class="text-xs text-[var(--pd-content-text)] opacity-60">Fewer CVEs</div>
          </div>
        {/if}

        {#if sizeReduction}
          <!-- Size Reduction -->
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-300">-{sizeReduction.toFixed(0)}%</div>
            <div class="text-xs text-[var(--pd-content-text)] opacity-60">Smaller Size</div>
          </div>
        {/if}
      </div>
    </div>
  </div>
  <!-- Side by Side Cards -->
  <div class="grid grid-cols-2 gap-5">
    <!-- Hummingbird Card -->
    <div class="bg-[var(--pd-content-card-bg)] rounded-lg border border-purple-500/30 p-5">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <svg class="w-8 h-8 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fill="currentColor" opacity="0.15"/>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
        </svg>
        <div class="min-w-0 flex-1">
          <span class="text-base font-bold text-[var(--pd-content-header)] block">latest</span>
          <span class="text-xs text-purple-400 block">Hummingbird hardened image</span>
        </div>
      </div>

      <!-- Metadata List -->
      <div class="space-y-3">
        <!-- Version/Tag Row -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Version</span>
          <span class="text-sm font-mono text-purple-400">latest</span>
        </div>
        <!-- Vulnerabilities Row -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Vulnerabilities</span>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {alternative?.vulnerabilities?.summary?.critical ? 'bg-red-600 text-white' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="Critical">{alternative?.vulnerabilities?.summary?.critical ?? 0}</span>
              <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {alternative?.vulnerabilities?.summary?.high ? 'bg-orange-500 text-white' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="High">{alternative?.vulnerabilities?.summary?.high ?? 0}</span>
              <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {alternative?.vulnerabilities?.summary?.medium ? 'bg-amber-400 text-gray-900' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="Medium">{alternative?.vulnerabilities?.summary?.medium ?? 0}</span>
              <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {alternative?.vulnerabilities?.summary?.low ? 'bg-yellow-300 text-gray-900' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="Low">{alternative?.vulnerabilities?.summary?.low ?? 0}</span>
            </div>
            <span class="text-xs text-purple-400 font-medium">(-{cveReduction?.[0]})</span>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Size</span>
          <span class="text-sm text-[var(--pd-content-header)]">{altSize ?? '—'} <span class="text-xs text-purple-400 font-medium">(-{sizeReduction}%)</span></span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Last Updated</span>
          <span class="text-sm text-[var(--pd-content-header)]">
            {#if alternative.image.oldest_created}
              <TableDurationColumn object={new Date(alternative.image.oldest_created)} />
            {:else}
              —
            {/if}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Signed</span>
          {#if true}
            <span class="flex items-center gap-1 text-sm text-green-500">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Yes
            </span>
          {:else}
            <span class="text-sm text-[var(--pd-content-text)] opacity-40">No</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Current Image Card -->
    <div class="bg-[var(--pd-content-card-bg)] rounded-lg border border-[var(--pd-content-card-border)] p-5">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <svg class="w-8 h-8 text-[var(--pd-content-text)] opacity-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fill="currentColor" opacity="0.1"/>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
        </svg>
        <div class="min-w-0 flex-1">
          <span class="text-base font-bold text-[var(--pd-content-header)] block">{image.inspect?.RepoTags?.[0] ?? 'Unknown'}</span>
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 block">Current image</span>
        </div>
      </div>

      <!-- Metadata List -->
      <div class="space-y-3">
        <!-- Version/Tag Row -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Version</span>
          <span class="text-sm font-mono text-[var(--pd-content-header)]">{image.inspect?.RepoTags?.[0]?.split(':')[1] ?? '-'}</span>
        </div>
        <!-- Vulnerabilities Row -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Vulnerabilities</span>
          <div class="flex items-center gap-1">
            <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {image.vulnerabilities?.critical ? 'bg-red-600 text-white' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="Critical">{image.vulnerabilities?.critical ?? 0}</span>
            <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {image.vulnerabilities?.high ? 'bg-orange-500 text-white' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="High">{image.vulnerabilities?.high ?? 0}</span>
            <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {image.vulnerabilities?.medium ? 'bg-amber-400 text-gray-900' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="Medium">{image.vulnerabilities?.medium ?? 0}</span>
            <span class="w-7 h-6 flex items-center justify-center text-xs font-semibold rounded {image.vulnerabilities?.low ? 'bg-yellow-300 text-gray-900' : 'bg-[var(--pd-content-card-border)] text-[var(--pd-content-text)] opacity-50'}" title="Low">{image.vulnerabilities?.low ?? 0}</span>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Size</span>
          <span class="text-sm text-[var(--pd-content-header)]">{image.inspect.Size}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Created</span>
          <span class="text-sm text-[var(--pd-content-header)]">
                {#if image.inspect.Created}
                  {new Date(image.inspect.Created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {:else}
                  —
                {/if}
              </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Signed</span>
          {#if false}
                <span class="flex items-center gap-1 text-sm text-green-500">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  Yes
                </span>
          {:else}
            <span class="text-sm text-[var(--pd-content-text)] opacity-40">No</span>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Try the Alternate Base Image - Combined Section -->
  <div class="bg-[var(--pd-content-card-bg)] rounded-lg border border-[var(--pd-content-card-border)] p-5">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-3">
      <div class="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fill="currentColor" opacity="0.3"/>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
        </svg>
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
        <div class="flex items-start gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <span class="text-xs font-semibold text-[var(--pd-content-header)]">{cveReduction}% Fewer Vulnerabilities</span>
            <p class="text-[10px] text-[var(--pd-content-text)] opacity-60">Only {alternative.vulnerabilities.summary.total} CVE vs {image.vulnerabilities?.total}</p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <span class="text-xs font-semibold text-[var(--pd-content-header)]">{sizeReduction}% Smaller Image Size</span>
            <p class="text-[10px] text-[var(--pd-content-text)] opacity-60">{altSize} vs {image.inspect.Size}</p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <span class="text-xs font-semibold text-[var(--pd-content-header)]">Enterprise-Grade Security</span>
            <p class="text-[10px] text-[var(--pd-content-text)] opacity-60">FIPS-compliant with continuous scanning</p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <span class="text-xs font-semibold text-[var(--pd-content-header)]">Minimal Attack Surface</span>
            <p class="text-[10px] text-[var(--pd-content-text)] opacity-60">Distroless with essential components only</p>
          </div>
        </div>
      </div>

      <!-- Right: Evaluation Criteria -->
      <div class="space-y-3">
        <!-- Image Size Comparison -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-[var(--pd-content-text)]">Image Size</span>
            <span class="text-xs font-semibold text-purple-400">-{sizeReduction}%</span>
          </div>
          <div class="space-y-1">
            <div class="h-5 rounded bg-purple-500/40 flex items-center px-2" style="width: {100 - ( altSize / image.inspect.Size * 100 )}%">
              <span class="text-[10px] font-medium text-purple-200">{altSize}</span>
            </div>
            <div class="h-5 rounded bg-purple-500/20 flex items-center px-2" style="width: 100%">
              <span class="text-[10px] font-medium text-purple-200/60">{image.inspect.Size}</span>
            </div>
          </div>
        </div>

        <!-- CVE Count Comparison -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-[var(--pd-content-text)]">CVE Count</span>
            <span class="text-xs font-semibold text-purple-400">-{cveReduction}%</span>
          </div>
          <div class="space-y-1">
            <div class="h-5 rounded bg-purple-500/40 flex items-center px-2" style="width: 100%">
              <span class="text-[10px] font-medium text-purple-200">{alternative.vulnerabilities.summary.total}</span>
            </div>
            <div class="h-5 rounded bg-purple-500/20 flex items-center px-2" style="width: 100%">
              <span class="text-[10px] font-medium text-purple-200/60">{image.vulnerabilities?.total}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
</div>
</div>