<script lang="ts">
import { TableColumn, Table, TableSimpleColumn, TableRow } from '@podman-desktop/ui-svelte';
import type { LocalImageAlternative } from '@podman-desktop/extension-hummingbird-core-api';

interface AlternativeRow extends LocalImageAlternative {
  name: string;
  selected?: boolean;
}

interface Props {
  alternatives: LocalImageAlternative[];
}

let { alternatives }: Props = $props();

let data: AlternativeRow[] = $derived(
  alternatives.map(alt => ({
    ...alt,
    name: alt.localImage.name,
  })),
);

const columns = [
  new TableColumn<AlternativeRow, string>('Original Image', {
    width: '1.5fr',
    renderer: TableSimpleColumn,
    renderMapping: (row: AlternativeRow): string => row.localImage.name,
    overflow: true,
  }),
  new TableColumn<AlternativeRow, string>('Alternative', {
    width: '1.5fr',
    renderer: TableSimpleColumn,
    renderMapping: (row: AlternativeRow): string => row.localImage.name,
    overflow: true,
  }),
  new TableColumn<AlternativeRow, string>('CVEs', {
    width: '1fr',
    renderer: TableSimpleColumn,
    renderMapping: (_: AlternativeRow): string => 'N/A',
    overflow: true,
  }),
  new TableColumn<AlternativeRow, string>('Size Reduction', {
    width: '1fr',
    renderer: TableSimpleColumn,
    renderMapping: (_: AlternativeRow): string => 'N/A',
    overflow: true,
  }),
];

const row: TableRow<AlternativeRow> = new TableRow<AlternativeRow>({});
</script>

<Table kind="alternatives" data={data} columns={columns} row={row} />
