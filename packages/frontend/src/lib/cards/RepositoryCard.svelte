<script lang="ts">
import type {
  ProviderContainerConnectionDetailedInfo,
  Repository,
  SimpleImageInfo,
} from '@podman-desktop/extension-hummingbird-core-api';
import { Button, TableDurationColumn } from '@podman-desktop/ui-svelte';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons/faExternalLink';
import { dialogAPI, imageAPI } from '/@/api/client';
import { getFirstParagraphAfterFirstHeading } from '/@/utils/markdown';
import DOMPurify from 'dompurify';

interface Props {
  object: Repository;
  pulled?: Promise<SimpleImageInfo | undefined>;
  connection?: ProviderContainerConnectionDetailedInfo;
}

let { object: repository, pulled, connection }: Props = $props();

let loading: boolean = $state(false);

async function pullImage(): Promise<void> {
  if (!connection) throw new Error('connection is not defined');

  loading = true;
  try {
    const image = await imageAPI.pull({
      image: `quay.io/hummingbird/${repository.name}:latest`,
      connection: connection,
    });
    pulled = Promise.resolve(image);
  } finally {
    loading = false;
  }
}

function navigateToImage(image: SimpleImageInfo): Promise<void> {
  return imageAPI.navigateToImageDetails(image);
}

function openExternal(): Promise<boolean> {
  return dialogAPI.openExternal(`https://quay.io/repository/hummingbird/${repository.name}`);
}
</script>

<div
  class="rounded-lg border border-[var(--pd-content-bg)] flex flex-col bg-[var(--pd-content-card-bg)] hover:border-[var(--pd-content-card-border-selected)] min-h-48 max-h-48"
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

      <div class="flex flex-col gap-y-2 divide-y divide-[var(--pd-content-divider)]">
        {#if repository.description}
          <div class="py-2 text-(--pd-content-text)">
            <article class="line-clamp-2 overflow-hidden">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html DOMPurify.sanitize(getFirstParagraphAfterFirstHeading(repository.description) ?? '')}
            </article>
          </div>
        {/if}
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
    </div>

    <!-- card footer -->
    <div class="flex">
      {#await pulled}
        <div class="animate-pulse grow rounded-[4px] bg-gray-900"></div>
      {:then result}
        {#if result}
          <Button type="secondary" class="grow" aria-label="Open" onclick={navigateToImage.bind(undefined, result)}
            >Open</Button>
        {:else}
          <Button
            inProgress={loading}
            type="primary"
            disabled={!connection}
            class="grow"
            icon={faDownload}
            aria-label="Pull"
            onclick={pullImage}>Pull</Button>
        {/if}
      {/await}

      <Button type="link" icon={faExternalLink} aria-label="More details" onclick={openExternal}>More details</Button>
    </div>
  </div>
</div>
