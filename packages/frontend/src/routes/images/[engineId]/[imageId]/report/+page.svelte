<script lang="ts">
import type { PageProps } from './$types';
import OptimisationReport from '/@/routes/images/[engineId]/[imageId]/report/(components)/report/OptimisationReport.svelte';
import { DetailsPage } from '@podman-desktop/ui-svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

let { data }: PageProps = $props();

function close(): Promise<void> {
  return goto(resolve('/alternatives'));
}
</script>

<DetailsPage
  title={data.image}
  breadcrumbLeftPart="Alternatives"
  breadcrumbRightPart={data.image}
  onbreadcrumbClick={close}
  onclose={close}>
  {#snippet contentSnippet()}
    {#await data.report}
      <span>Loading...</span>
    {:then report}
      <div class="pt-5 w-full">
        <OptimisationReport object={report} />
      </div>
    {/await}
  {/snippet}
</DetailsPage>
