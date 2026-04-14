<style>
.page-description {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(168, 85, 247, 0.08);
  border-left: 3px solid var(--pd-link);
  border-radius: 0 4px 4px 0;
}
.page-description p {
  color: var(--pd-content-text);
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}
.page-description strong {
  color: var(--pd-badge-green);
}
</style>

<script lang="ts">
import { Button } from '@podman-desktop/ui-svelte';
import { routingAPI } from '/@/api/client';
import type { ClassValue } from 'svelte/elements';

interface Props {
  class?: ClassValue;
}

let { class: className }: Props = $props();

function navigateToCatalog(): Promise<void> {
  return routingAPI.navigateToCatalog('grype');
}
</script>

<div class={['page-description', className]}>
  <p>
    To compare vulnerabilities between your local images and the Hummingbird alternatives you can install the Grype
    extension
  </p>
  <Button title="Check catalog" onclick={navigateToCatalog}>Check catalog</Button>
</div>
