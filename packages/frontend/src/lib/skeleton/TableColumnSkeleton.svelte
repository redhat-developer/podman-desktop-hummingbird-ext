<script lang="ts">
import type { SkeletonRow } from '$lib/skeleton/skeleton-row';

interface Props {
  object: SkeletonRow;
}

let { object }: Props = $props();
</script>

<div
  class="h-full w-full flex flex-col gap-y-4 justify-between animate-pulse"
  aria-busy="true"
  aria-label={object.name}>
  <div class="h-2 size-40 rounded bg-gray-900"></div>
</div>
