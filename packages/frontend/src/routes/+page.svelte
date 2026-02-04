<script lang="ts">
import { NavPage } from '@podman-desktop/ui-svelte';
import type { PageProps } from './$types';

let { data }: PageProps = $props();
</script>

<NavPage title="Hummingbird" searchEnabled={false}>
  {#snippet content()}
    <ul>
      {#each data.repositories as repository (repository.name)}
        <li>{repository.name}</li>
      {/each}
    </ul>
  {/snippet}
</NavPage>
