<script lang="ts">
import type { Row } from '/@/routes/alternatives/(components)/row';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle';
import { faClone } from '@fortawesome/free-solid-svg-icons/faClone';
import ListItemButtonIcon from '$lib/buttons/ListItemButtonIcon.svelte';
import { resolve } from '$app/paths';
import { goto } from '$app/navigation';

interface Props {
  object: Row;
}

let { object }: Props = $props();

function onOpenImageReport(engineId: string, imageId: string): Promise<void> {
  return goto(
    resolve('/images/[engineId]/[imageId]/report', {
      engineId: engineId,
      imageId: imageId,
    }),
  );
}

function onCloneContainer(engineId: string, containerId: string): Promise<void> {
  return goto(
    resolve('/containers/[engineId]/[id]/clone', {
      engineId: engineId,
      id: containerId,
    }),
  );
}
</script>

{#if 'report' in object}
  <ListItemButtonIcon
    icon={faInfoCircle}
    onClick={onOpenImageReport.bind(undefined, object.localImage.engineId, object.localImage.id)}
    title="Open Image Report Details" />
{:else}
  <ListItemButtonIcon
    icon={faClone}
    onClick={onCloneContainer.bind(undefined, object.engineId, object.id)}
    title="Clone Container" />
{/if}
