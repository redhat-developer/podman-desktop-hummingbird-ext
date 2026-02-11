<script lang="ts">
import { NavPage, EmptyScreen, Button } from '@podman-desktop/ui-svelte';
import type { PageProps } from './$types';
import RepositoryCard from '$lib/cards/RepositoryCard.svelte';
import HummingbirdBanner from '$lib/banners/HummingbirdBanner.svelte';
import RepositoryCardSkeleton from '$lib/skeleton/RepositoryCardSkeleton.svelte';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import { goto, invalidateAll, invalidate } from '$app/navigation';
import { providerConnectionsInfo } from '/@/stores/connections';
import ContainerProviderConnectionSelect from '$lib/selects/ContainerProviderConnectionSelect.svelte';
import { Messages, type ProviderContainerConnectionDetailedInfo } from '@podman-desktop/extension-hummingbird-core-api';
import { page } from '$app/state';
import { onMount } from 'svelte';
import { rpcBrowser } from '/@/api/client';

let { data }: PageProps = $props();

let searchTerm: string = $state('');
// using the query parameters
let selectedContainerProviderConnection: ProviderContainerConnectionDetailedInfo | undefined = $derived(
  $providerConnectionsInfo.find(
    provider => provider.providerId === data.providerId && provider.name === data.connection,
  ),
);

$effect(() => {
  // ensure we always have a selected provider connection
  if (!selectedContainerProviderConnection && $providerConnectionsInfo.length > 0) {
    onContainerProviderConnectionChange(
      $providerConnectionsInfo.find(({ status }) => status === 'started') ?? $providerConnectionsInfo[0],
    );
  }
});

onMount(() => {
  const subscriber = rpcBrowser.subscribe(Messages.UPDATE_IMAGES, () => {
    invalidate('images:pulled').catch(console.error);
  });
  return subscriber.unsubscribe;
});

function onContainerProviderConnectionChange(value: ProviderContainerConnectionDetailedInfo | undefined): void {
  const nURL = new URL(page.url);

  if (value) {
    nURL.searchParams.set('providerId', value.providerId);
    nURL.searchParams.set('connection', value.name);
  } else {
    nURL.searchParams.entries().forEach(([name]) => {
      nURL.searchParams.delete(name);
    });
  }

  // eslint-disable-next-line svelte/no-navigation-without-resolve
  goto(nURL).catch(console.error);
}

function refresh(): Promise<void> {
  return invalidateAll();
}
</script>

<NavPage title="Hummingbird Catalog" searchEnabled={true} bind:searchTerm={searchTerm}>
  {#snippet bottomAdditionalActions()}
    {#if $providerConnectionsInfo.length > 1}
      <div class="w-full flex justify-end">
        <div class="w-[250px]">
          <ContainerProviderConnectionSelect
            clearable={false}
            onChange={onContainerProviderConnectionChange}
            value={selectedContainerProviderConnection}
            containerProviderConnections={$providerConnectionsInfo} />
        </div>
      </div>
    {/if}
  {/snippet}
  {#snippet content()}
    <div class="flex flex-col grow px-5 py-3">
      <HummingbirdBanner />

      <div class="flex flex-col w-full h-full">
        <!-- while we fetch the repositories we display skeleton cards -->
        {#await data.repositories}
          <div class="grid min-[920px]:grid-cols-2 min-[1180px]:grid-cols-3 gap-3">
            {#each Array.from({ length: 10 }) as _, index (index)}
              <RepositoryCardSkeleton />
            {/each}
          </div>
        {:then repositories}
          {@const filtered =
            searchTerm.length > 0
              ? repositories.filter(({ name }) => name.toLowerCase().includes(searchTerm.toLowerCase()))
              : repositories}
          <div class="grid min-[920px]:grid-cols-2 min-[1180px]:grid-cols-3 gap-3">
            {#each filtered as repository (repository.name)}
              {@const pulled = data.pulled?.then(images =>
                images.find(image => image.name.startsWith(`quay.io/hummingbird/${repository.name}`)),
              )}
              <RepositoryCard object={repository} pulled={pulled} connection={selectedContainerProviderConnection} />
            {/each}
          </div>
        {:catch err}
          <EmptyScreen
            icon={faWarning}
            title="Something went wrong while fetching the Hummingbird catalog"
            aria-label="Error while fetching the Hummingbird catalog"
            message={err?.message ?? String(err)}>
            <div class="flex gap-2 justify-center">
              <Button title="Retry" type="link" onclick={refresh}>Retry</Button>
            </div>
          </EmptyScreen>
        {/await}
      </div>
    </div>
  {/snippet}
</NavPage>
