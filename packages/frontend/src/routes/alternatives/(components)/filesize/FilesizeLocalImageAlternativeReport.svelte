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
  return filesize(reduction, {
    round: 0,
  });
});

let result: 'smaller' | 'larger' | 'equal' | undefined = $derived.by(() => {
  if (!valid) return undefined;
  if (reduction === undefined) return undefined;
  if (reduction > 0) return 'smaller';
  if (reduction < 0) return 'larger';
  return 'equal';
});
</script>

{#if valid}
  <div class="flex flex-col items-center">
    <div class="flex items-center gap-2">
      <span class="text-base font-medium"
        >{filesize(object.localImage.size, {
          round: 0,
        })}</span>
      <span class="text-[var(--pd-content-text)] opacity-30">→</span>
      <span class:text-green-400={result === 'smaller'} class="text-base font-medium"
        >{filesize(object.alternative.size, {
          round: 0,
      })}</span>
    </div>
    {#if result === 'smaller'}
      <div class="flex items-center gap-1 max-lg:hidden">
        <span class="text-sm text-green-400">-{reductionPercent}% smaller</span>
        <span class="text-xs text-[var(--pd-content-text)] opacity-50">({saved} saved)</span>
      </div>
    {:else if result === 'larger'}
      <span class="text-xs text-[var(--pd-content-text)] opacity-50">Larger</span>
    {:else if result === 'equal'}
      <span class="text-xs text-[var(--pd-content-text)] opacity-50">Same size</span>
    {/if}
  </div>
{:else}
  <span class="text-xs text-[var(--pd-content-text)] opacity-50">-</span>
{/if}
