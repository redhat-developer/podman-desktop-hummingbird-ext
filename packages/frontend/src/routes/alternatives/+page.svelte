<script lang="ts">
import { NavPage, EmptyScreen } from '@podman-desktop/ui-svelte';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import type { PageProps } from './$types';
import AlternativeTable from '/@/routes/alternatives/(components)/AlternativeTable.svelte';
import TableSkeleton from '$lib/skeleton/TableSkeleton.svelte';
import { onMount } from 'svelte';
import { rpcBrowser } from '/@/api/client';
import { invalidate } from '$app/navigation';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import GrypeBanner from '/@/routes/alternatives/(components)/banner/GrypeBanner.svelte';

let { data }: PageProps = $props();

onMount(() => {
  const subscriber = rpcBrowser.subscribe(Messages.UPDATE_ALTERNATIVES, () => {
    invalidate('alternatives:update').catch(console.error);
  });
  return subscriber.unsubscribe;
});

let columns = $derived([
  {
    name: 'Original Image',
    width: '1.5fr',
  },
  ...(data.isGrypeInstalled
    ? [
        {
          name: 'CVEs',
          width: '1fr',
        },
        {
          name: 'Size Reduction',
          width: '1fr',
        },
      ]
    : []),
]);
</script>

<NavPage title="Hardened Image Alternatives" searchEnabled={false}>
  {#snippet content()}
    {#await data.alternatives}
      <TableSkeleton count={20} columns={columns} />
    {:then alternatives}
      {#if alternatives.length === 0}
        <EmptyScreen
          icon={faWarning}
          title="No alternatives found"
          aria-label="No alternatives found"
          message="No local images with Hummingbird alternatives were found. Pull some common images like nginx, postgres, or python to see alternatives.">
        </EmptyScreen>
      {:else}
        <div class="flex flex-col w-full h-full">
          {#if !data.isGrypeInstalled}
            <GrypeBanner class="mx-5" />
          {/if}

          <div class="w-full flex">
            <AlternativeTable alternatives={alternatives} isGrypeInstalled={data.isGrypeInstalled} />
          </div>
        </div>
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
