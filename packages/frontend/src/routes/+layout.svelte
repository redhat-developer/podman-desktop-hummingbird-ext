<script lang="ts">
// app.css includes tailwind css dependencies that we use
import '/@/app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { onMount } from 'svelte';
import { getRouterState, rpcBrowser } from '/@/api/client';
import { goto } from '$app/navigation';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import Navigation from '$lib/navigations/Navigation.svelte';

let { children } = $props();

onMount(() => {
  // Load router state on application startup
  getRouterState()
    .then(state => {
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      goto(state.url).catch(console.error);
    })
    .catch(console.error);

  const unsubscribe = rpcBrowser.subscribe(Messages.ROUTE_UPDATE, location => {
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(location).catch(console.error);
  }).unsubscribe;

  return (): void => {
    unsubscribe();
  };
});
</script>

<div class="flex flex-row w-full h-full">
  <Navigation />
  {@render children()}
</div>
