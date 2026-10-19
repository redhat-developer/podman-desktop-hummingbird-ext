<script lang="ts">
import { NavPage, EmptyScreen, Button } from '@podman-desktop/ui-svelte';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import type { PageProps } from './$types';
import AlternativeTable from '#routes/alternatives/(components)/AlternativeTable.svelte';
import TableSkeleton from '#lib/skeleton/TableSkeleton.svelte';
import { onMount } from 'svelte';
import { rpcBrowser, alternativesAPI } from '#api/client.js';
import { invalidate } from '$app/navigation';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import GrypeBanner from '#routes/alternatives/(components)/banner/GrypeBanner.svelte';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api/src';
import { SvelteMap } from 'svelte/reactivity';

let { data }: PageProps = $props();

let reports: Map<string, Promise<LocalImageAlternativeReport>> = new SvelteMap();
let reporting: boolean = $state(false);

onMount(() => {
  const subscriber = rpcBrowser.subscribe(Messages.UPDATE_ALTERNATIVES, () => {
    invalidate('alternatives:update').catch(console.error);
  });
  return subscriber.unsubscribe;
});

let columns = $derived([
  {
    name: 'Status',
    width: '70px',
  },
  {
    name: '',
    width: '2fr',
  },
  {
    name: 'Actions',
    width: '50px',
  },
]);

async function analyze(): Promise<void> {
  reporting = true;
  reports.clear();

  const promises: Array<Promise<LocalImageAlternativeReport>> = [];

  const alternatives = await data.alternatives;

  alternatives.forEach(alternative => {
    const promise = alternativesAPI.getAlternativeReport(alternative);
    promises.push(promise);

    reports.set(alternative.localImage.id, promise);
  });

  await Promise.allSettled(promises);
  reporting = false;
}
</script>

<NavPage title="Hardened Image Alternatives" searchEnabled={false}>
  {#snippet additionalActions()}
    <Button
      disabled={!data.isGrypeInstalled || reporting || reports.size > 0}
      inProgress={reporting}
      onclick={analyze}
      icon={faMagnifyingGlass}
      title="Analyze images">Analyze</Button>
  {/snippet}
  {#snippet content()}
    {#await data.alternatives}
      <TableSkeleton count={10} columns={columns} />
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
            <AlternativeTable alternatives={alternatives} reports={reports} />
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
