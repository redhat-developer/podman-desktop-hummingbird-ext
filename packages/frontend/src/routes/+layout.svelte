<script lang="ts">
// app.css includes tailwind css dependencies that we use
import '../app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { onMount } from 'svelte';
import { routingAPI, rpcBrowser } from '#api/client.js';
import { afterNavigate, goto } from '$app/navigation';
import { page } from '$app/state';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import Navigation from '#lib/navigations/Navigation.svelte';

let { children } = $props();

// register every route in Podman Desktop's back/forward history
afterNavigate(({ from, to }) => {
  if (!to?.route.id) return;
  // ignore query-only changes (e.g. catalog provider selection)
  if (from?.url.pathname === to.url.pathname) return;
  routingAPI.pushHistory(`${to.url.pathname}${to.url.search}`, page.data.label ?? 'Hummingbird').catch(console.error);
});

onMount(() => {
  const unsubscribe = rpcBrowser.subscribe(Messages.ROUTE_UPDATE, () => {
    // consume the pending route, so it is not replayed on the next webview mount
    routingAPI
      .readRoute()
      .then(location => {
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        if (location) return goto(location);
      })
      .catch(console.error);
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
