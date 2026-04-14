import type { ProviderContainerConnection, Disposable } from '@podman-desktop/api';
import { extensions as extensionsAPI, containerEngine as containerEngineAPI } from '@podman-desktop/api';
import type { PodmanExtensionApi } from '@podman-desktop/podman-extension-api';
import { PODMAN_EXTENSION_ID } from '/@/utils/constants';
import { ProviderService } from '/@/services/provider-service';
import { inject, injectable } from 'inversify';

@injectable()
export class PodmanService implements Disposable {
  constructor(
    @inject(ProviderService)
    protected providerService: ProviderService,
  ) {}

  // smart podman extension api getter with some cache
  #podman: PodmanExtensionApi | undefined;
  protected get podman(): PodmanExtensionApi {
    if (!this.#podman) {
      this.#podman = this.getPodmanExtension();
    }
    return this.#podman;
  }

  dispose(): void {
    this.#podman = undefined;
  }

  protected getPodmanExtension(): PodmanExtensionApi {
    const podman = extensionsAPI.getExtension(PODMAN_EXTENSION_ID);
    if (!podman) throw new Error('podman extension not found');
    if (!podman.exports)
      throw new Error(`podman extension is not exporting any API. Got version ${podman.packageJSON['version']}`);

    if (!('exec' in podman.exports) || typeof podman.exports.exec !== 'function') {
      throw new Error('invalid podman extension exports');
    }

    return podman.exports;
  }

  /**
   * This method return the ContainerProviderConnection corresponding to an engineId
   * @remarks only works with running container connection
   * @param engineId
   */
  async getRunningProviderContainerConnectionByEngineId(engineId: string): Promise<ProviderContainerConnection> {
    for (const provider of this.providerService.getContainerConnections()) {
      if (provider.connection.status() !== 'started') continue;

      const infos = await containerEngineAPI.listInfos({ provider: provider.connection });
      if (infos.length === 0) continue;

      if (infos[0].engineId === engineId) return provider;
    }
    throw new Error(`connection not found for engineId ${engineId}`);
  }

  public async clone(
    engineId: string,
    containerId: string,
    alternative: string,
    options: {
      name: string;
    },
  ): Promise<{
    engineId: string;
    Id: string;
  }> {
    const connection = await this.getRunningProviderContainerConnectionByEngineId(engineId);

    // Pull the image
    await containerEngineAPI.pullImage(connection.connection, alternative, console.debug);

    // Replicate the podman container
    const result = await containerEngineAPI.replicatePodmanContainer(
      {
        engineId,
        id: containerId,
      },
      {
        engineId,
      },
      {
        image: alternative,
        name: options.name,
      },
    );

    if (result.Warnings) {
      console.warn('warnings', result.Warnings.join('\n'));
    }

    return {
      engineId,
      Id: result.Id,
    };
  }
}
