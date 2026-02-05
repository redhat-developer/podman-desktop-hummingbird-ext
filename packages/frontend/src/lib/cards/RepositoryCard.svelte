<script lang="ts">
import type { Repository } from '@podman-desktop/extension-hummingbird-core-api';
import { Button, TableDurationColumn } from '@podman-desktop/ui-svelte';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons/faExternalLink';
import { dialogAPI } from '/@/api/client';

interface Props {
  object: Repository;
}

let { object: repository }: Props = $props();

function pullImage(): void {
  console.log('not implemented');
}

function openExternal(): Promise<boolean> {
  return dialogAPI.openExternal(`https://quay.io/repository/hummingbird/${repository.name}`);
}
</script>

<div
  class="rounded-lg border border-[var(--pd-content-bg)] flex flex-col bg-[var(--pd-content-card-bg)] hover:border-[var(--pd-content-card-border-selected)] min-h-40 max-h-40"
  role="group"
  aria-label={repository.name}>
  <div class="p-3 h-full w-full flex flex-col gap-y-4 justify-between">
    <!-- card body -->
    <div class="flex flex-col w-full">
      <div class="flex flex-row items-center gap-x-2">
        <svg class="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fill="currentColor" opacity="0.2"></polygon>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
        </svg>
        <div class="flex flex-col">
          <div class="text-(--pd-content-header)">
            {repository.name}
          </div>
          <div class="text-(--pd-content-text) text-purple-400">
            quay.io/hummingbird/{repository.name}
          </div>
        </div>
      </div>
      <div class="pt-2 text-(--pd-content-text)">
        Hardened {repository.name} image
      </div>

      <div class="flex">
        <div class="flex flex row justify-between w-full text-(--pd-content-text)">
          <span>Last updated</span>
          <span class="flex gap-x-1">
            <TableDurationColumn object={new Date(repository.last_modified * 1000)} />
            ago
          </span>
        </div>
      </div>
    </div>

    <!-- card footer -->
    <div class="flex">
      <Button type="primary" class="grow" disabled={true} icon={faDownload} aria-label="Pull" onclick={pullImage}
        >Pull</Button>

      <Button type="link" icon={faExternalLink} aria-label="More details" onclick={openExternal}>More details</Button>
    </div>
  </div>
</div>
