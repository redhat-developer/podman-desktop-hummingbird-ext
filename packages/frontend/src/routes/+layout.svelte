<script lang="ts">
// app.css includes tailwind css dependencies that we use
import '/@/app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { onMount } from 'svelte';
import { getRouterState, rpcBrowser } from '/@/api/client';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';

let { children } = $props();

const state = await getRouterState();
console.log(`[layout] effect pre from ${page.url.pathname} to ${state.url}`);
if(state.url !== page.url.pathname) {
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  goto(state.url).catch(console.error);
}

onMount(() => {
  const unsubscribe = rpcBrowser.subscribe(Messages.ROUTE_UPDATE, location => {
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(location).catch(console.error);
  }).unsubscribe;

  return (): void => {
    unsubscribe();
  };
});
</script>

{@render children()}
