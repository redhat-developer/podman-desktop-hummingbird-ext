<script lang="ts">
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { routingAPI } from '#api/client.js';

let featuredExtension = {
  displayName: 'Grype',
  description: 'Grype and Syft integration in Podman Desktop',
  icon: 'https://registry.podman-desktop.io/api/extensions/podman-desktop/grype/0.1.0/icon.png',
};

function navigateToCatalog(): Promise<void> {
  return routingAPI.navigateToCatalog('grype');
}
</script>

<div
  title={featuredExtension.description}
  class="bg-(--pd-invert-content-card-bg) border-(--pd-invert-content-card-bg) rounded-md flex flex-row justify-center p-4 border hover:border-(--pd-content-card-border-selected)"
  aria-label={featuredExtension.displayName}>
  <div class="flex flex-col flex-1">
    <div class="flex flex-row place-items-center flex-1">
      <div>
        <img class="w-12 h-12 object-contain" alt="{featuredExtension.displayName} logo" src={featuredExtension.icon} />
      </div>
      <div class="flex flex-1 mx-2 cursor-default font-bold justify-start text-(--pd-details-body-text)">
        {featuredExtension.displayName}
      </div>
      <div class="h-full w-18 flex flex-col items-end place-content-center">
        <button
          aria-label="Open catalog"
          onclick={navigateToCatalog}
          title="Open catalog"
          class="border-2 relative rounded-sm border-(--pd-button-secondary-border) text-(--pd-button-secondary-text) hover:bg-(--pd-button-secondary-hover-bg) w-10 p-2 text-center cursor-pointer flex flex-row justify-center">
          <Icon class="ml-1.5 mr-2" size="1.1x" icon={faMagnifyingGlass} />
        </button>
      </div>
    </div>
  </div>
</div>
