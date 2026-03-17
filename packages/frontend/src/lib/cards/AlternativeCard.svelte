<script lang="ts">
  import type { Alternative, ImageReport } from '@podman-desktop/extension-hummingbird-core-api';
  import RepositoryIcon from '$lib/icons/RepositoryIcon.svelte';
  import { TableDurationColumn } from '@podman-desktop/ui-svelte';

  interface Props {
    alternative: Alternative
    image: ImageReport
  }

  let { alternative, image }: Props = $props();
</script>

<div
  class="rounded-lg border flex flex-col bg-[var(--pd-content-card-bg)] border-purple-500/40 min-h-48 max-h-48"
  role="group"
  aria-label={alternative.image.name}>
  <div class="p-3 h-full w-full flex flex-col gap-y-4 justify-between">
    <!-- card body -->
    <div class="flex flex-col w-full">
      <div class="flex flex-row items-center gap-x-2">
        <RepositoryIcon />
        <div class="flex flex-col">
          <div class="text-(--pd-content-header)">
            {alternative.image.name}
          </div>
          <div class="text-(--pd-content-text) text-purple-400">
            {alternative.image.pull_url}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-y-2 divide-y divide-[var(--pd-content-divider)]">
        {#if alternative.image.oldest_created}
          <div class="flex">
            <div class="flex flex row justify-between w-full text-(--pd-content-text)">
              <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Last Updated</span>
              <span class="flex gap-x-1">
                <TableDurationColumn object={new Date(alternative.image.oldest_created)} />
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>