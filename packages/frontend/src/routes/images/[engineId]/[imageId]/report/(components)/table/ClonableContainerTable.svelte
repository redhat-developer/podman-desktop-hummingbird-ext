<script lang="ts">
import type { LocalContainer } from '@podman-desktop/extension-hummingbird-core-api/src';
import { Table, TableColumn, TableRow } from '@podman-desktop/ui-svelte';
import LocalContainerNameColumn from '$lib/columns/LocalContainerNameColumn.svelte';
import HardenAction from '/@/routes/images/[engineId]/[imageId]/report/(components)/table/columns/HardenAction.svelte';
import ContainerStatus from '/@/routes/images/[engineId]/[imageId]/report/(components)/table/columns/ContainerStatus.svelte';

interface Props {
  containers: Array<LocalContainer>;
}

const { containers }: Props = $props();

const row: TableRow<LocalContainer> = new TableRow<LocalContainer>({});

let columns = $derived([
  new TableColumn<LocalContainer>('Status', {
    align: 'center',
    width: '70px',
    renderer: ContainerStatus,
    overflow: true,
  }),
  new TableColumn<LocalContainer>('Name', {
    width: '2fr',
    renderer: LocalContainerNameColumn,
    overflow: false,
  }),
  new TableColumn<LocalContainer>('Actions', {
    align: 'right',
    width: '250px',
    renderer: HardenAction,
    overflow: true,
  }),
]);
</script>

<Table kind="containers" data={containers} columns={columns} row={row} />
