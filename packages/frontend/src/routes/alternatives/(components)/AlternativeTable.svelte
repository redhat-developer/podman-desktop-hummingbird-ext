<script lang="ts">
import { TableColumn, Table, TableRow } from '@podman-desktop/ui-svelte';
import type {
  LocalImageAlternative,
  LocalImageAlternativeReport,
} from '@podman-desktop/extension-hummingbird-core-api';
import CVEReductionCell from './columns/CVEReductionColumn.svelte';
import { alternativesAPI } from '/@/api/client';
import FilesizeReductionColumn from './columns/FilesizeReductionColumn.svelte';
import StatusColumn from './columns/StatusColumn.svelte';
import type { Row } from '/@/routes/alternatives/(components)/row';
import NameColumn from '/@/routes/alternatives/(components)/columns/NameColumn.svelte';
import ActionColumn from '/@/routes/alternatives/(components)/columns/ActionColumn.svelte';

interface Props {
  alternatives: LocalImageAlternative[];
  isGrypeInstalled: boolean;
}

let { alternatives, isGrypeInstalled }: Props = $props();

let data: Row[] = $derived(
  alternatives.map((alt, index) => ({
    ...alt,
    name: alt.localImage.name,
    report: isGrypeInstalled ? alternativesAPI.getAlternativeReport(alt) : Promise.reject(new Error('grype not installed')),
  })),
);

let columns = $derived([
  new TableColumn<Row, 'container' | 'image'>('Status', {
    align: 'center',
    width: '70px',
    renderer: StatusColumn,
    renderMapping: (row: Row): 'container' | 'image' => ('report' in row ? 'image' : 'container'),
    overflow: true,
  }),
  new TableColumn<Row>('', {
    width: '2fr',
    renderer: NameColumn,
    overflow: true,
  }),
  ...(isGrypeInstalled
    ? [
        new TableColumn<Row, Promise<LocalImageAlternativeReport> | undefined>('CVEs', {
          width: '1fr',
          renderer: CVEReductionCell,
          align: 'center',
          renderMapping: (row: Row): Promise<LocalImageAlternativeReport> | undefined =>
            'report' in row ? row.report : undefined,
          overflow: true,
        }),
        new TableColumn<Row, Promise<LocalImageAlternativeReport> | undefined>('Size Reduction', {
          width: '1fr',
          renderer: FilesizeReductionColumn,
          align: 'center',
          renderMapping: (row: Row): Promise<LocalImageAlternativeReport> | undefined =>
            'report' in row ? row.report : undefined,
          overflow: true,
        }),
      ]
    : []),
  new TableColumn<Row>('Actions', {
    align: 'right',
    width: '50px',
    renderer: ActionColumn,
    overflow: true,
  }),
]);

const row: TableRow<Row> = new TableRow<Row>({
  children: (row): Array<Row> => {
    if ('report' in row) {
      return row.localImage.containers;
    }
    return [];
  },
});
</script>

<Table kind="alternatives" data={data} columns={columns} row={row} />
