<script lang="ts">
import { TableColumn, Table, TableRow } from '@podman-desktop/ui-svelte';
import type { SkeletonRow } from '$lib/skeleton/skeleton-row';
import TableRowSkeleton from '$lib/skeleton/TableColumnSkeleton.svelte';

interface Props {
  columns: Array<{
    width?: string;
    name: string;
  }>;
  count?: number;
}

let { columns, count = 5 }: Props = $props();

let data: Array<SkeletonRow> = $derived(Array.from({ length: count }, (_, index) => ({ name: String(index) })));

const mColumns = $derived(
  columns.map(column => new TableColumn<SkeletonRow>(column.name, { width: column.width, renderer: TableRowSkeleton })),
);

const row: TableRow<SkeletonRow> = new TableRow<SkeletonRow>({});
</script>

<Table kind="loading" data={data} columns={mColumns} row={row} />
