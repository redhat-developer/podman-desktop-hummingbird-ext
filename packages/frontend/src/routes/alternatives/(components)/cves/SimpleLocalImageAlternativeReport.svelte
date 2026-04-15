<script lang="ts">
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';

interface Props {
  object: LocalImageAlternativeReport;
}

let { object }: Props = $props();

let reduction = $derived.by(() => {
  return object.localImage.vulnerabilities.total - object.alternative.vulnerabilities.total;
});

let reductionPercent = $derived.by(() => {
  if (object.localImage.vulnerabilities.total === 0) return undefined;
  return Math.round(
    ((object.localImage.vulnerabilities.total - object.alternative.vulnerabilities.total) /
      object.localImage.vulnerabilities.total) *
      100,
  );
});
</script>

<div class="flex flex-col items-center">
  <div class="flex items-center gap-2">
    <span class="text-base font-semibold" class:text-red-400={object.localImage.vulnerabilities.total > 0}>
      {object.localImage.vulnerabilities.total}
    </span>
    <span class="text-[var(--pd-content-text)] opacity-30">→</span>
    <span class="text-base font-semibold text-green-400">{object.alternative.vulnerabilities.total}</span>
  </div>
  {#if reduction !== undefined && reduction > 0}
    <div class="flex items-center gap-1 max-lg:hidden">
      <span class="text-base text-[var(--pd-content-text)]">{reduction} CVEs eliminated</span>
      {#if reductionPercent !== undefined}
        <span class="text-base text-[var(--pd-content-text)]">({reductionPercent}%)</span>
      {/if}
    </div>
  {:else if reduction === 0}
    <span class="text-base text-[var(--pd-content-text)] opacity-50">No change</span>
  {/if}
</div>
