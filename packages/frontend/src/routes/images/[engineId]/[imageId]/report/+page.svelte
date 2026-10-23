<script lang="ts">
import type { PageProps } from './$types';
import OptimisationReport from '#routes/images/[engineId]/[imageId]/report/(components)/report/OptimisationReport.svelte';
import { DetailsPage, EmptyScreen } from '@podman-desktop/ui-svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import ExtensionBanner from './(components)/grype/ExtensionBanner.svelte';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons/faLightbulb';

let { data }: PageProps = $props();

function close(): Promise<void> {
  return goto(resolve('alternatives'));
}
</script>

<DetailsPage
  title={data.image}
  breadcrumbLeftPart="Alternatives"
  breadcrumbRightPart={data.image}
  onbreadcrumbClick={close}
  onclose={close}>
  {#snippet contentSnippet()}
    {#if data.isGrypeInstalled}
      {#await data.report}
        <span>Loading...</span>
      {:then report}
        <div class="pt-5 w-full">
          <OptimisationReport object={report} />
        </div>
      {:catch error}
        <EmptyScreen
          icon={faWarning}
          title="Error loading optimisation report"
          aria-label="Error loading optimisation report"
          message={error}>
        </EmptyScreen>
      {/await}
    {:else}
      <EmptyScreen
        icon={faLightbulb}
        title="You need to install Grype to use this feature"
        aria-label="You need to install Grype to use this feature">
        <ExtensionBanner />
      </EmptyScreen>
    {/if}
  {/snippet}
</DetailsPage>
