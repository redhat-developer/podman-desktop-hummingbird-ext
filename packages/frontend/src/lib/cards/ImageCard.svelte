<script lang="ts">
  import type { ImageReport } from '@podman-desktop/extension-hummingbird-core-api';
  import RepositoryIcon from '$lib/icons/RepositoryIcon.svelte';
  import { TableDurationColumn } from '@podman-desktop/ui-svelte';

  interface Props {
    image: ImageReport
  }

  let { image }: Props = $props();

  let imageName = $derived(image.inspect.RepoTags[0] ?? image.inspect.Id);
</script>

<div
  class="rounded-lg flex flex-col bg-[var(--pd-content-card-bg)] min-h-48 max-h-48"
  role="group"
  aria-label={imageName}>
  <div class="p-3 h-full w-full flex flex-col gap-y-4 justify-between">
    <!-- card body -->
    <div class="flex flex-col w-full">
      <div class="flex flex-row items-center gap-x-2">
        <RepositoryIcon class="grayscale" />
        <div class="flex flex-col">
          <div class="text-(--pd-content-header)">
            {imageName}
          </div>
          <div class="text-(--pd-content-text) text-[var(--pd-content-text)]">
            Current image
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-y-2 divide-y divide-[var(--pd-content-divider)]">
        {#if image.inspect.Created}
          <div class="flex">
            <div class="flex flex row justify-between w-full text-(--pd-content-text)">
              <span class="text-xs text-[var(--pd-content-text)] opacity-50 uppercase tracking-wide">Created</span>
              <span class="flex gap-x-1">
                <TableDurationColumn object={new Date(image.inspect.Created)} />
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>