<script lang="ts">
import type { OptimisationReport } from '@podman-desktop/extension-hummingbird-core-api';
import RawReport from '/@/routes/images/[engineId]/[imageId]/report/(components)/report/RawReport.svelte';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons/faShieldHalved';

interface Props {
  object: OptimisationReport;
}

let { object }: Props = $props();
</script>

{#if object.alternative}
  <RawReport alternative={object.alternative} image={object.image} />
{:else}
  <EmptyScreen icon={faShieldHalved} title="No alternative image found" message="No alternative image found." />
{/if}
