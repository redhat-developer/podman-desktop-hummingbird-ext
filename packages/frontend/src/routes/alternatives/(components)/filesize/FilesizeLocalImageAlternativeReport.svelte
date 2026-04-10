<script lang="ts">
import { filesize } from 'filesize';
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';

interface Props {
  object: LocalImageAlternativeReport;
}

let { object }: Props = $props();

let valid = $derived(!isNaN(object.alternative.size) && !isNaN(object.localImage.size));

let reduction = $derived.by(() => {
  if (!valid) return NaN;
  return object.localImage.size - object.alternative.size;
});

let reductionPercent = $derived.by(() => {
  if (!valid) return NaN;
  return Math.round(((object.localImage.size - object.alternative.size) / object.localImage.size) * 100);
});

let saved = $derived.by(() => {
  if (!reduction || reduction <= 0) return undefined;
  return filesize(reduction);
});
</script>

{#if valid}
  <div class="flex flex-col items-center">
    <div class="flex items-center gap-2">
      <span class="text-base font-medium">{filesize(object.localImage.size)}</span>
      <span class="text-[var(--pd-content-text)] opacity-30">→</span>
      <span class="text-base font-medium text-green-400">{filesize(object.alternative.size)}</span>
    </div>
    {#if reduction !== undefined && reduction > 0}
      <div class="flex items-center gap-1">
        <span class="text-sm text-green-400">-{reductionPercent}% smaller</span>
        <span class="text-xs text-[var(--pd-content-text)] opacity-50">({saved} saved)</span>
      </div>
    {:else if reduction !== undefined && reduction < 0}
      <span class="text-xs text-[var(--pd-content-text)] opacity-50">Larger</span>
    {:else}
      <span class="text-xs text-[var(--pd-content-text)] opacity-50">Same size</span>
    {/if}
  </div>
{:else}
  <span class="text-xs text-[var(--pd-content-text)] opacity-50">-</span>
{/if}
