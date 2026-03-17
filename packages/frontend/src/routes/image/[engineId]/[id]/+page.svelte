<script lang="ts">
import type { PageProps } from './$types';
import OptimisationReport from '$lib/report/OptimisationReport.svelte';

let { data }: PageProps = $props();
</script>

{#await data.report}
    <span>Loading...</span>
{:then report}
    <div class="mx-5 mt-5">
        <OptimisationReport object={report} />
    </div>
{/await}
