<script lang="ts">
    import type {OptimisationReport} from '@podman-desktop/extension-hummingbird-core-api';
    import {SvelteSet} from 'svelte/reactivity';

    interface Props {
        object: OptimisationReport
    }

    let { object }: Props = $props();

    const imagePkgs = new SvelteSet(object.sbom?.packages);
    const altPkgs = new SvelteSet(object.alternative?.sbom?.packages?.map(p => p.name));

    const allPkgs = $derived(
        Array.from(new Set([...imagePkgs, ...altPkgs])).sort((a, b) => a.localeCompare(b))
    );
</script>

<table class="w-full text-left">
    <thead>
    <tr class="border-b border-gray-700">
        <th class="py-2 px-4 font-semibold text-gray-400">Image ({imagePkgs.size})</th>
        <th class="py-2 px-4 font-semibold text-gray-400">Alt ({altPkgs.size})</th>
    </tr>
    </thead>
    <tbody>
    {#each allPkgs as pkg (pkg)}
        <tr class="border-b border-gray-800 last:border-0">
            <td class="py-2 px-4 {altPkgs.has(pkg) ? 'text-gray-400' : 'text-red-600'}">
                {imagePkgs.has(pkg) ? pkg : ''}
            </td>
            <td class="py-2 px-4 text-gray-400">
                {altPkgs.has(pkg) ? pkg : ''}
            </td>
        </tr>
    {/each}
    </tbody>
</table>


