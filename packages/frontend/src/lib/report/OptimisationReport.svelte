<script lang="ts">
    import type {OptimisationReport} from '@podman-desktop/extension-hummingbird-core-api';
    import {SvelteSet} from 'svelte/reactivity';
    import RawReport from '$lib/report/RawReport.svelte';

    interface Props {
        object: OptimisationReport
    }

    let { object }: Props = $props();

    const imagePkgs = new SvelteSet(object.image.sbom?.packages);
    const altPkgs = new SvelteSet(object.alternative?.sbom?.packages?.map(p => p.name));

    const allPkgs = $derived(
        Array.from(new Set([...imagePkgs, ...altPkgs])).sort((a, b) => a.localeCompare(b))
    );
</script>

{#if object.alternative}
    <RawReport alternative={object.alternative} image={object.image}/>
{/if}