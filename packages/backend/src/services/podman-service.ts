import {
  containerEngine as containerEngineAPI,
  Disposable,
  ProgressLocation,
  ProviderContainerConnection,
  TelemetryLogger,
  window as windowAPI,
} from '@podman-desktop/api';
import { ProviderService } from '/@/services/provider-service';
import { inject, injectable } from 'inversify';
import { TelemetryLoggerSymbol } from '/@/inject/symbol';
import { TelemetryEvents } from '/@/utils/telemetry-events';
import { performance } from 'node:perf_hooks';

@injectable()
export class PodmanService implements Disposable {
  constructor(
    @inject(ProviderService)
    protected providerService: ProviderService,
    @inject(TelemetryLoggerSymbol)
    protected readonly telemetryLogger: TelemetryLogger,
  ) {}

  dispose(): void {}

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
      task: {
        title: string;
      };
      pod?: string;
    },
  ): Promise<{
    engineId: string;
    Id: string;
  }> {
    const telemetry: Record<string, unknown> = {
      alternative: alternative,
    };

    // measure time for start operation
    const start = performance.now();

    try {
      return await windowAPI.withProgress(
        {
          location: ProgressLocation.TASK_WIDGET,
          title: options.task.title,
        },
        async (_, token) => {
          const connection = await this.getRunningProviderContainerConnectionByEngineId(engineId);

          // Pull the image
          await containerEngineAPI.pullImage(connection.connection, alternative, console.debug, undefined, token);
          const alternativeInspect = await containerEngineAPI.getImageInspect(engineId, alternative);

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
              pod: options.pod,
              entrypoint: alternativeInspect.Config.Entrypoint,
              command: alternativeInspect.Config.Cmd,
            },
          );

          // libpod returns `Warnings: null` when there are none, despite the API typing
          const warnings = result.Warnings ?? [];
          if (warnings.length) {
            console.warn('warnings', warnings.join('\n'));
          }

          telemetry['warnings'] = warnings.length;

          return {
            engineId,
            Id: result.Id,
          };
        },
      );
    } catch (err: unknown) {
      telemetry['error'] = err;
      throw err;
    } finally {
      telemetry['duration'] = performance.now() - start;
      this.telemetryLogger.logUsage(TelemetryEvents.CLONE_CONTAINER, telemetry);
    }
  }
}
