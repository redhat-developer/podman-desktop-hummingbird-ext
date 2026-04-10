<script lang="ts">
    import type { PageProps } from './$types';
    import { FormPage } from '@podman-desktop/ui-svelte';
    import {ContainerIcon} from '@podman-desktop/ui-svelte/icons';
    import ProgressBar from '$lib/progress/ProgressBar.svelte';
    import Fa from 'svelte-fa';
    import {goto} from '$app/navigation';
    import {resolve} from '$app/paths';
    import CloneForm from '/@/routes/containers/[engineId]/[id]/clone/(components)/CloneForm.svelte';

    let { data }: PageProps = $props();

    function close(): Promise<void> {
        return goto(resolve('/alternatives'));
    }
</script>

<FormPage
        title="Clone container"
        onclose={close}
        breadcrumbLeftPart="Alternatives"
        breadcrumbRightPart="clone"
        onbreadcrumbClick={close}>
    {#snippet icon()}
        <div class="rounded-full w-8 h-8 flex items-center justify-center">
            <ContainerIcon/>
        </div>
    {/snippet}
    {#snippet content()}
        <div class="flex flex-col w-full">
            {#await data.container}
                <!-- loading indicator -->
                <div class="h-0.5">
                    <ProgressBar class="w-full h-0.5" width="w-full" height="h-0.5" />
                </div>
            {:then container}
                <CloneForm {container} {close}/>
            {:catch error}
                <span>Something went wrong ${error}</span>
            {/await}
        </div>
    {/snippet}
</FormPage>
