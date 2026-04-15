<script lang="ts">
import { ContainerIcon } from '@podman-desktop/ui-svelte/icons';
import { StatusIcon } from '@podman-desktop/ui-svelte';
import type { LocalContainer } from '@podman-desktop/extension-hummingbird-core-api/src';

interface Props {
  object: LocalContainer;
}

let { object: _ }: Props = $props();
</script>

<StatusIcon icon={ContainerIcon} />
