<script lang="ts">
import type { Row } from '/@/routes/alternatives/(components)/row';
import LocalContainerNameColumn from '$lib/columns/LocalContainerNameColumn.svelte';
import { resolve } from '$app/paths';
import { IMAGE_QUERY_KEY } from '/@/routes/images/[engineId]/[imageId]/report/constants';

interface Props {
  object: Row;
}

let { object }: Props = $props();
</script>

{#if 'report' in object}
  <a
    href={resolve(`/images/[engineId]/[imageId]/report?${IMAGE_QUERY_KEY}=${object.localImage.name}`, {
      engineId: object.localImage.engineId,
      imageId: object.localImage.id,
    })}
    aria-label="Open report"
    class:pointer-events-none={!object.report}
    class="flex items-center gap-2 w-full overflow-hidden">
    <span class="text-base">
      {object.localImage.name}:{object.localImage.tag}
    </span>
    <span class="text-[var(--pd-content-text)] opacity-30">→</span>
    <span class="text-base text-purple-400 overflow-hidden text-ellipsis">
      quay.io/hummingbird/{object.alternative.name}
    </span>
  </a>
{:else}
  <LocalContainerNameColumn object={object} />
{/if}
