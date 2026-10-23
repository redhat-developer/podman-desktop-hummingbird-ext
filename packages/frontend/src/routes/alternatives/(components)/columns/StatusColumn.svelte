<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';

import ImageIcon from '#lib/icons/ImageIcon.svelte';
import type { LocalContainer, LocalImage } from '@podman-desktop/extension-hummingbird-core-api';
import ContainerStatus from '#lib/columns/ContainerStatus.svelte';

interface Props {
  object: LocalContainer | LocalImage;
}

let { object }: Props = $props();
</script>

{#if 'state' in object}
  <ContainerStatus object={object} />
{:else}
  <StatusIcon icon={ImageIcon} />
{/if}
