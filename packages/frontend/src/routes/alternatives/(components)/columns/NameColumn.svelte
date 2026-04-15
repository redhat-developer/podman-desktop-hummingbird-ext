<script lang="ts">
import type { Row } from '/@/routes/alternatives/(components)/row';
import LocalContainerNameColumn from '$lib/columns/LocalContainerNameColumn.svelte';

interface Props {
  object: Row;
}

let { object }: Props = $props();
</script>

{#if 'report' in object}
  <div class="flex items-center gap-2 w-full overflow-hidden">
    <span class="text-base">
      {object.localImage.name}:{object.localImage.tag}
    </span>
    <span class="text-[var(--pd-content-text)] opacity-30">→</span>
    <span class="text-base text-purple-400 overflow-hidden text-ellipsis">
      quay.io/hummingbird/{object.alternative.name}
    </span>
  </div>
{:else}
  <LocalContainerNameColumn object={object} />
{/if}
