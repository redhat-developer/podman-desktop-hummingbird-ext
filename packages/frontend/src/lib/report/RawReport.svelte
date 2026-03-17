<script lang="ts">
  import { TableDurationColumn } from '@podman-desktop/ui-svelte';
  import { filesize } from 'filesize';
  import type { Alternative, ImageReport, Tag } from '@podman-desktop/extension-hummingbird-core-api';
  
  import ReportBanner from './ReportBanner.svelte';
  import ReportImageCard from './ReportImageCard.svelte';
  import ReportComparison from './ReportComparison.svelte';

  interface Props {
    alternative: Alternative;
    image: ImageReport;
  }

  let { alternative, image }: Props = $props();

  let tag: Tag | undefined = $derived.by(() => {
    return alternative.tags.find(t => t.name === alternative.image.latest_tag);
  });

  let cveReduction: { count: number; percent: number } | undefined = $derived.by(() => {
    if (!image.vulnerabilities || !alternative.vulnerabilities?.summary) return undefined;
    
    const imageTotal = image.vulnerabilities.total;
    const altTotal = alternative.vulnerabilities.summary.total;
    
    if (imageTotal < altTotal) return undefined;

    return {
      count: imageTotal - altTotal,
      percent: imageTotal > 0 ? (100 - (altTotal / imageTotal) * 100) : 0
    };
  });

  let altSize: number = $derived(tag?.sizes?.[image.inspect.Architecture] ?? 0);
  let sizeReductionPercent: number = $derived.by(() => {
    if (!altSize || !image.inspect.Size) return 0;
    return 100 - (altSize / image.inspect.Size) * 100;
  });

  const altRepoTag = $derived(alternative.image.name);
  const imageRepoTag = $derived(image.inspect?.RepoTags?.[0] ?? 'Unknown');
  const imageVersion = $derived(imageRepoTag.split(':')[1] ?? '-');
</script>

<div class="flex flex-col gap-5 overflow-auto">
  <!-- Alternate Image Found Banner -->
  <ReportBanner 
    cveReductionCount={cveReduction?.count}
    cveReductionPercent={cveReduction?.percent}
    sizeReductionPercent={sizeReductionPercent}
  />

  <!-- Side by Side Cards -->
  <div class="grid grid-cols-2 gap-5">
    <!-- Hummingbird Card -->
    <ReportImageCard 
      isHummingbird={true}
      title={altRepoTag}
      subtitle="Hummingbird hardened image"
      version={alternative.image.latest_tag}
      vulnerabilities={alternative.vulnerabilities.summary}
      vulnerabilitiesReduction={cveReduction?.count}
      size={filesize(altSize)}
      sizeReductionPercent={sizeReductionPercent}
      date={alternative.image.oldest_created ?? undefined}
      signed={true}
    >
      {#snippet icon()}
        <svg class="w-8 h-8 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fill="currentColor" opacity="0.15"/>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
        </svg>
      {/snippet}
      
      {#snippet dateDisplay()}
        {#if alternative.image.oldest_created}
          <TableDurationColumn object={new Date(alternative.image.oldest_created)} />
        {:else}
          —
        {/if}
      {/snippet}
    </ReportImageCard>

    <!-- Current Image Card -->
    <ReportImageCard 
      title={imageRepoTag}
      subtitle="Current image"
      version={imageVersion}
      vulnerabilities={image.vulnerabilities}
      size={filesize(image.inspect.Size)}
      date={image.inspect.Created}
      dateLabel="Created"
      signed={false}
    />
  </div>

  <!-- Try the Alternate Base Image - Combined Section -->
  <ReportComparison 
    cveReductionPercent={cveReduction?.percent}
    sizeReductionPercent={sizeReductionPercent}
    altCveCount={alternative.vulnerabilities.summary.total}
    imageCveCount={image.vulnerabilities?.total}
    altSize={altSize}
    imageSize={image.inspect.Size}
  />
</div>