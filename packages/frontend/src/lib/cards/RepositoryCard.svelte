<script lang="ts">
import type {
  ProviderContainerConnectionDetailedInfo,
  ImageSummary,
  SimpleImageInfo,
} from '@podman-desktop/extension-hummingbird-core-api';
import { Button, TableDurationColumn } from '@podman-desktop/ui-svelte';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons/faExternalLink';
import { dialogAPI, imageAPI } from '/@/api/client';
import RepositoryIcon from '$lib/icons/RepositoryIcon.svelte';

interface Props {
  object: ImageSummary;
  pulled?: Promise<SimpleImageInfo | undefined>;
  connection?: ProviderContainerConnectionDetailedInfo;
}

let { object: image, pulled, connection }: Props = $props();

let loading: boolean = $state(false);

async function pullImage(): Promise<void> {
  if (!connection) throw new Error('connection is not defined');

  loading = true;
  try {
    const imageInfo = await imageAPI.pull({
      image: `quay.io/hummingbird/${image.name}:latest`,
      connection: connection,
    });
    pulled = Promise.resolve(imageInfo);
  } finally {
    loading = false;
  }
}

function navigateToImage(image: SimpleImageInfo): Promise<void> {
  return imageAPI.navigateToImageDetails(image);
}

function openExternal(): Promise<boolean> {
  return dialogAPI.openExternal(`https://quay.io/repository/hummingbird/${image.name}`);
}
</script>

<div
  class="rounded-lg border border-[var(--pd-content-bg)] flex flex-col bg-[var(--pd-content-card-bg)] hover:border-[var(--pd-content-card-border-selected)] min-h-48 max-h-48"
  role="group"
  aria-label={image.name}>
  <div class="p-3 h-full w-full flex flex-col gap-y-4 justify-between">
    <!-- card body -->
    <div class="flex flex-col w-full">
      <div class="flex flex-row items-center gap-x-2">
        <RepositoryIcon />
        <div class="flex flex-col">
          <div class="text-(--pd-content-header)">
            {image.name}
          </div>
          <div class="text-(--pd-content-text) text-purple-400">
            quay.io/hummingbird/{image.name}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-y-2 divide-y divide-[var(--pd-content-divider)]">
        {#if image.description}
          <div class="py-2 text-(--pd-content-text)">
            <article class="line-clamp-2 overflow-hidden">
              <span>{image.description}</span>
            </article>
          </div>
        {/if}
        {#if image.oldest_created}
          <div class="flex">
            <div class="flex flex row justify-between w-full text-(--pd-content-text)">
              <span>Last updated</span>
              <span class="flex gap-x-1">
                <TableDurationColumn object={new Date(image.oldest_created)} />
                ago
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- card footer -->
    <div class="flex justify-end">
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
