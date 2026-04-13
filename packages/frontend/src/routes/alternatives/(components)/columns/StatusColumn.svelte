<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';
import { ContainerIcon } from '@podman-desktop/ui-svelte/icons';

import ImageIcon from '$lib/icons/ImageIcon.svelte';

interface Props {
  object: 'container' | 'image';
}

let { object }: Props = $props();
</script>

{#if object === 'container'}
  <StatusIcon icon={ContainerIcon} />
{:else}
  <StatusIcon icon={ImageIcon} />
{/if}
