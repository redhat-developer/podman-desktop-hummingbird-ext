<script lang="ts">
  import { NavPage } from '@podman-desktop/ui-svelte';
</script>

<NavPage title="Hummingbird" searchEnabled={false}>
  {#snippet content()}
    <span>Hello world</span>
  {/snippet}
</NavPage>
