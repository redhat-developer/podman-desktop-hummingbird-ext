<script lang="ts">
import Select from './Select.svelte';
import type { ProviderContainerConnectionDetailedInfo } from '@podman-desktop/extension-hummingbird-core-api';

interface Props {
  value: ProviderContainerConnectionDetailedInfo | undefined;
  onChange?: (value: ProviderContainerConnectionDetailedInfo | undefined) => void;
  containerProviderConnections: ProviderContainerConnectionDetailedInfo[];
  disabled?: boolean;
  clearable?: boolean;
}

let { value = $bindable(), clearable = true, containerProviderConnections, onChange, disabled }: Props = $props();

/**
 * Handy mechanism to provide the mandatory property `label` and `value` to the Select component
 */
let selected: (ProviderContainerConnectionDetailedInfo & { label: string; value: string }) | undefined = $derived.by(
  () => {
    if (value) {
      return { ...value, label: value.name, value: key(value) };
    }
  },
);

function key(connection: ProviderContainerConnectionDetailedInfo): string {
  return `${connection.providerId}:${connection.name}`;
}

function handleOnChange(nValue: ProviderContainerConnectionDetailedInfo | undefined): void {
  value = nValue;
  onChange?.(value);
}
</script>

<Select
  label="Select Container Engine"
  name="select-container-engine"
  disabled={disabled}
  value={selected}
  onchange={handleOnChange}
  clearable={clearable}
  placeholder="Select container provider to use"
  items={containerProviderConnections.map(containerProviderConnection => ({
    ...containerProviderConnection,
    value: key(containerProviderConnection),
    label: containerProviderConnection.name,
  }))}>
  <div slot="item" let:item>
    <div class="flex items-center">
      <div class="flex w-2 h-2 me-2 rounded-full"></div>
      <span>{item.name}</span>
      {#if item.vmType}
        ({item.vmType})
      {/if}
    </div>
  </div>
</Select>
