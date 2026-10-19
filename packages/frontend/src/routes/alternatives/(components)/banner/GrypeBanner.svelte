<script lang="ts">
import { Button } from '@podman-desktop/ui-svelte';
import { routingAPI } from '#api/client.js';
import type { ClassValue } from 'svelte/elements';

interface Props {
  class?: ClassValue;
}

let { class: className }: Props = $props();

function navigateToCatalog(): Promise<void> {
  return routingAPI.navigateToCatalog('grype');
}
</script>

<div class={['mb-4 py-3 px-4 bg-(--pd-button-primary-bg)/8 border-l-3 border-l-(--pd-link) rounded-r', className]}>
  <p class="text-(--pd-content-text) text-base leading-normal m-0">
    To compare vulnerabilities between your local images and the Hummingbird alternatives you can install the Grype
    extension
  </p>
  <Button title="Check catalog" onclick={navigateToCatalog}>Check catalog</Button>
</div>
