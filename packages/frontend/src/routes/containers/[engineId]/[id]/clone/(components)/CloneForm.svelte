<script lang="ts">
    import type {LocalContainer} from '@podman-desktop/extension-hummingbird-core-api';
    import { Input, Checkbox, Button } from '@podman-desktop/ui-svelte';
    import WarningBanner from '/@/routes/containers/[engineId]/[id]/clone/(components)/WarningBanner.svelte';

    interface Props {
        container: LocalContainer,
        close: () => void,
    }

    let { container, close } : Props = $props();

    let name = $state(`${container.name}-clone`);

    let stopExisting = $state(true);

    async function clone(): Promise<void> {

    }
</script>

<div class="m-5">
    <WarningBanner container={container}/>

    <!-- form -->
    <div class="bg-[var(--pd-content-card-bg)] space-y-6 px-8 sm:pb-6 xl:pb-8 rounded-lg h-fit">
        <div class="w-full">
            <label
                    for="name"
                    class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]"
            >name</label>
            <Input name="name" bind:value={name}/>

            <label class="flex items-center gap-2 cursor-pointer mt-2">
                <Checkbox bind:checked={stopExisting}/>
                <span class="text-[var(--pd-content-text)]">
              Stop existing container before proceeding (recommended)
            </span>
            </label>

            <div class="w-full flex flex-row gap-x-2 justify-end pt-4">
                <Button type="secondary" onclick={close} title="Close">Close</Button>
                <Button onclick={clone} title="Clone">Clone</Button>
            </div>
        </div>
    </div>
</div>

