<script lang="ts">
import type {
  LocalContainer,
  ImageSummary,
  LocalImage,
  CloneResult,
} from '@podman-desktop/extension-hummingbird-core-api';
import { Input, Checkbox, Button, ErrorMessage } from '@podman-desktop/ui-svelte';
import WarningBanner from '/@/routes/containers/[engineId]/[id]/clone/(components)/WarningBanner.svelte';
import { containerAPI } from '/@/api/client';

interface Props {
  container: LocalContainer;
  alternative: ImageSummary;
  localImage: Omit<LocalImage, 'containers'>;
  close: () => void;
}

let { container, alternative, localImage, close }: Props = $props();

let name = $state(`${container.name}-clone`);
let stopExisting = $state(true);

let result: CloneResult | undefined = $state();
let loading: boolean = $state(false);
let error: string | undefined = $state();

async function clone(): Promise<void> {
  loading = true;
  error = undefined;
  try {
    result = await containerAPI.clone(
      container.engineId,
      container.id,
      `quay.io/hummingbird/${alternative.name}:${alternative.latest_tag}`,
      {
        stopBeforeClone: $state.snapshot(stopExisting),
        name: $state.snapshot(name),
      },
    );
  } catch (err: unknown) {
    error = String(err);
  } finally {
    loading = false;
  }
}
</script>

<div class="m-5">
  <WarningBanner container={container} />

  <!-- form -->
  <div class="bg-[var(--pd-content-card-bg)] space-y-6 px-8 sm:pb-6 xl:pb-8 rounded-lg h-fit">
    <div class="w-full">
      <label for="new-base-image" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]"
        >New base image</label>
      <div class="flex items-center gap-2">
        <span class="text-base">
          {localImage.name}:{localImage.tag}
        </span>
        <span class="text-[var(--pd-content-text)] opacity-30">→</span>
        <span class="text-base text-purple-400">
          quay.io/hummingbird/{alternative.name}:{alternative.latest_tag}
        </span>
      </div>

      <label for="new-container-name" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]"
        >New container name</label>
      <Input name="new-container-name" bind:value={name} readonly={loading} />

      <label class="flex items-center gap-2 cursor-pointer mt-4">
        <Checkbox bind:checked={stopExisting} disabled={loading} />
        <span class="text-[var(--pd-content-text)]"> Stop existing container before proceeding (recommended) </span>
      </label>

      <div class="w-full flex flex-row gap-x-2 justify-end pt-4">
        <Button type="secondary" onclick={close} title="Close">Close</Button>
        <Button onclick={clone} inProgress={loading} disabled={loading || !!result} title="Clone">Clone</Button>
      </div>

      {#if result}
        <span>Container {result.Id.substring(0, 8)} created</span>
      {/if}

      {#if error}
        <ErrorMessage error={error} />
      {/if}
    </div>
  </div>
</div>
