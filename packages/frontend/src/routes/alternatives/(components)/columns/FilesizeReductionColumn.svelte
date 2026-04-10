<script lang="ts">
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';
import TableColumnSkeleton from '$lib/skeleton/TableColumnSkeleton.svelte';
import FilesizeLocalImageAlternativeReport from '../filesize/FilesizeLocalImageAlternativeReport.svelte';

interface Props {
  object: Promise<LocalImageAlternativeReport>;
}

let { object }: Props = $props();
</script>

{#await object}
  <TableColumnSkeleton object={{ name: 'CVEs' }} />
{:then report}
  <FilesizeLocalImageAlternativeReport object={report} />
{:catch error}
  <span class="text-xs text-red-400">Error scanning {error}</span>
{/await}
