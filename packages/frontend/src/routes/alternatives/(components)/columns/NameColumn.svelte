<script lang="ts">
import type { Row } from '/@/routes/alternatives/(components)/row';

interface Props {
  object: Row;
}

let { object }: Props = $props();
</script>

{#if 'report' in object}
  <div class="flex items-center gap-2">
    <span class="text-base">
      {object.localImage.name}:{object.localImage.tag}
    </span>
    <span class="text-[var(--pd-content-text)] opacity-30">→</span>
    <span class="text-base text-purple-400">
      quay.io/hummingbird/{object.alternative.name}
    </span>
  </div>
{:else}
  <div class="text-[var(--pd-table-body-text-highlight)] max-w-full overflow-hidden text-ellipsis">
    {object.name.startsWith('/') ? object.name.substring(1) : object.name}
  </div>
  <div class="flex flex-row text-sm gap-1">
    <div class="text-[var(--pd-table-body-text)]">
      {object.id.substring(0, 8)}
    </div>
  </div>
{/if}
