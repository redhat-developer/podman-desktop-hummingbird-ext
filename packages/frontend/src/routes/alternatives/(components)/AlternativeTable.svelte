<script lang="ts">
import { TableColumn, Table, TableRow } from '@podman-desktop/ui-svelte';
import type {
  LocalContainer,
  LocalImage,
  LocalImageAlternative,
  LocalImageAlternativeReport,
} from '@podman-desktop/extension-hummingbird-core-api';
import CVEReductionCell from './columns/CVEReductionColumn.svelte';
import FilesizeReductionColumn from './columns/FilesizeReductionColumn.svelte';
import StatusColumn from './columns/StatusColumn.svelte';
import type { Row } from '#routes/alternatives/(components)/row.js';
import NameColumn from '#routes/alternatives/(components)/columns/NameColumn.svelte';
import ActionColumn from '#routes/alternatives/(components)/columns/ActionColumn.svelte';

interface Props {
  alternatives: LocalImageAlternative[];
  reports: Map<string, Promise<LocalImageAlternativeReport>>;
}

let { alternatives, reports }: Props = $props();

let data: Row[] = $derived(
  alternatives.map((alt, index) => ({
    ...alt,
    name: alt.localImage.name,
    report: reports.get(alt.localImage.id),
  })),
);

let columns = $derived([
  new TableColumn<Row, LocalContainer | LocalImage>('Status', {
    align: 'center',
    width: '70px',
    renderer: StatusColumn,
    renderMapping: (row: Row): LocalContainer | LocalImage => ('report' in row ? row.localImage : row),
    overflow: true,
  }),
  new TableColumn<Row>('', {
    width: '2fr',
    renderer: NameColumn,
    overflow: false,
  }),
  ...(reports.size > 0
    ? [
        new TableColumn<Row, Promise<LocalImageAlternativeReport> | undefined>('CVEs', {
          width: '1fr',
          renderer: CVEReductionCell,
          align: 'center',
          renderMapping: (row: Row): Promise<LocalImageAlternativeReport> | undefined =>
            'report' in row ? row.report : undefined,
        }),
        new TableColumn<Row, Promise<LocalImageAlternativeReport> | undefined>('Size Reduction', {
          width: '1fr',
          renderer: FilesizeReductionColumn,
          align: 'center',
          renderMapping: (row: Row): Promise<LocalImageAlternativeReport> | undefined =>
            'report' in row ? row.report : undefined,
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

function key(row: Row): string {
  if ('report' in row) {
    return `${row.localImage.engineId}:${row.localImage.id}`;
  } else {
    return `${row.engineId}:${row.id}`;
  }
}
</script>

{#key reports.size}
  <Table key={key} kind="alternatives" data={data} columns={columns} row={row} />
{/key}
