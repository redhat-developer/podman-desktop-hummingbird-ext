<script lang="ts">
import type { LocalContainer } from '@podman-desktop/extension-hummingbird-core-api';
import { Button } from '@podman-desktop/ui-svelte';
import { faHammer } from '@fortawesome/free-solid-svg-icons/faHammer';
import { resolve } from '$app/paths';
import { goto } from '$app/navigation';

interface Props {
  object: LocalContainer;
}

let { object }: Props = $props();

function navigateToClone(): Promise<void> {
  return goto(
    resolve(`/containers/[engineId]/[id]/clone`, {
      engineId: object.engineId,
      id: object.id,
    }),
  );
}
</script>

<Button onclick={navigateToClone} icon={faHammer}>Harden with Hummingbird</Button>
