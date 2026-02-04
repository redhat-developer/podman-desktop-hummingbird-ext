<script lang="ts">
import { NavPage } from '@podman-desktop/ui-svelte';
import type { PageProps } from './$types';
import RepositoryCard from '$lib/cards/RepositoryCard.svelte';
import type { Repository } from '@hummingbird/core-api';
import HummingbirdBanner from '$lib/banners/HummingbirdBanner.svelte';

let { data }: PageProps = $props();

let searchTerm: string = $state('');
let filtered: Array<Repository> = $derived(
  searchTerm.length > 0
    ? data.repositories.filter(({ name }) => name.toLowerCase().includes(searchTerm.toLowerCase()))
    : data.repositories,
);
</script>

<NavPage title="Hummingbird Catalog" searchEnabled={true} bind:searchTerm={searchTerm}>
  {#snippet content()}
    <div class="flex flex-col grow px-5 py-3">
      <HummingbirdBanner />

      <div class="flex flex-col w-full">
        <div
          class="grid min-[920px]:grid-cols-2 min-[1180px]:grid-cols-3 gap-3"
          role="region"
          aria-label="Hummingbird extensions">
          {#each filtered as repository (repository.name)}
            <RepositoryCard object={repository} />
          {/each}
        </div>
      </div>
    </div>
  {/snippet}
</NavPage>
