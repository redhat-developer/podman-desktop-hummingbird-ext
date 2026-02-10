<script lang="ts">
import { NavPage, EmptyScreen, Button } from '@podman-desktop/ui-svelte';
import type { PageProps } from './$types';
import RepositoryCard from '$lib/cards/RepositoryCard.svelte';
import HummingbirdBanner from '$lib/banners/HummingbirdBanner.svelte';
import RepositoryCardSkeleton from '$lib/skeleton/RepositoryCardSkeleton.svelte';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import { invalidateAll } from '$app/navigation';

let { data }: PageProps = $props();

let searchTerm: string = $state('');

function refresh(): Promise<void> {
  return invalidateAll();
}
</script>

<NavPage title="Hummingbird Catalog" searchEnabled={true} bind:searchTerm={searchTerm}>
  {#snippet content()}
    <div class="flex flex-col grow px-5 py-3">
      <HummingbirdBanner />

      <div class="flex flex-col w-full h-full">
        <!-- while we fetch the repositories we display skeleton cards -->
        {#await data.repositories}
          <div
            class="grid min-[920px]:grid-cols-2 min-[1180px]:grid-cols-3 gap-3">
            {#each Array.from({ length: 10 }) as _, index (index)}
              <RepositoryCardSkeleton/>
            {/each}
          </div>
        {:then repositories}
          {@const filtered = searchTerm.length > 0 ? repositories.filter(({ name }) => name.toLowerCase().includes(searchTerm.toLowerCase())) : repositories}
          <div
            class="grid min-[920px]:grid-cols-2 min-[1180px]:grid-cols-3 gap-3">
            {#each filtered as repository (repository.name)}
              <RepositoryCard object={repository} />
            {/each}
          </div>
        {:catch err}
          <EmptyScreen
              icon={faWarning}
              title="Something went wrong while fetching the Hummingbird catalog"
              aria-label="Error while fetching the Hummingbird catalog"
              message={err?.message ?? String(err)}
          >
            <div class="flex gap-2 justify-center">
              <Button title="Retry" type="link" onclick={refresh}>Retry</Button>
            </div>
          </EmptyScreen>
        {/await}
      </div>
    </div>
  {/snippet}
</NavPage>
