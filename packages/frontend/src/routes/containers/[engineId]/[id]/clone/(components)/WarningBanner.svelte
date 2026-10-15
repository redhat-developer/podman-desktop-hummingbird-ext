<script lang="ts">
import type { LocalContainer } from '@podman-desktop/extension-hummingbird-core-api';

interface Props {
  container: LocalContainer;
}

let { container }: Props = $props();
</script>

<div class="mb-4 py-3 px-4 bg-(--pd-button-primary-bg)/8 border-l-3 border-l-(--pd-link) rounded-r flex gap-3">
  <div class="text-yellow-400 mt-1">
    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clip-rule="evenodd"></path>
    </svg>
  </div>
  <div>
    <p class="text-(--pd-content-text) text-base leading-normal m-0 opacity-80 mb-2">
      This will clone the container <strong class="text-(--pd-badge-green)"
        >{container.name?.replace(/^\//, '') ?? container.id}</strong>
      and replace its base image with the Hummingbird hardened alternative
    </p>
    <p class="text-(--pd-content-text) text-base leading-normal m-0 opacity-80">
      The cloned container will have a new ID and name. Your original container will remain unchanged.
    </p>
  </div>
</div>
