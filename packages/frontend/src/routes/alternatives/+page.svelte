<script lang="ts">
import { NavPage, EmptyScreen } from '@podman-desktop/ui-svelte';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import type { PageProps } from './$types';
import AlternativeTable from '/@/routes/alternatives/(components)/AlternativeTable.svelte';
import TableSkeleton from '$lib/skeleton/TableSkeleton.svelte';

let { data }: PageProps = $props();
</script>

<NavPage title="Hardened Image Alternatives" searchEnabled={false}>
  {#snippet content()}
    {#await data.alternatives}
      <TableSkeleton
        count={20}
        columns={[
          {
            name: 'Original Image',
            width: '1.5fr',
          },
          {
            name: 'Alternative',
            width: '1.5fr',
          },
          {
            name: 'CVEs',
            width: '1fr',
          },
          {
            name: 'Size Reduction',
            width: '1fr',
          },
        ]} />
    {:then alternatives}
      {#if alternatives.length === 0}
        <EmptyScreen
          icon={faWarning}
          title="No alternatives found"
          aria-label="No alternatives found"
          message="No local images with Hummingbird alternatives were found. Pull some common images like nginx, postgres, or python to see alternatives.">
        </EmptyScreen>
      {:else}
        <AlternativeTable alternatives={alternatives} />
      {/if}
    {:catch error}
      <EmptyScreen
        icon={faWarning}
        title="Error loading alternatives"
        aria-label="Error loading alternatives"
        message={error.message}>
      </EmptyScreen>
    {/await}
  {/snippet}
</NavPage>
