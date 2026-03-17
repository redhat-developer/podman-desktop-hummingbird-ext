<script lang="ts">
    import type {OptimisationReport} from '@podman-desktop/extension-hummingbird-core-api';
    import {SvelteSet} from 'svelte/reactivity';
    import RawReport from '$lib/report/RawReport.svelte';
    import { EmptyScreen } from '@podman-desktop/ui-svelte'
    import { faShieldHalved } from '@fortawesome/free-solid-svg-icons/faShieldHalved';

    interface Props {
        object: OptimisationReport
    }

    let { object }: Props = $props();

    const imagePkgs = $derived(new SvelteSet(object.image.sbom?.packages ?? []));
    const altPkgs = $derived(new SvelteSet(object.alternative?.sbom?.packages?.map(p => p.name) ?? []));

    const allPkgs = $derived(
        Array.from(new Set([...imagePkgs, ...altPkgs])).sort((a, b) => a.localeCompare(b))
    );
</script>

{#if object.alternative}
    <RawReport alternative={object.alternative} image={object.image}/>
{:else}
    <EmptyScreen
      icon={faShieldHalved}
      title="No alternative image found"
      message="No alternative image found."
    />
{/if}