/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/
import type { Disposable, ProviderContainerConnection, TelemetryLogger } from '@podman-desktop/api';
import {
  ProgressLocation,
  window as windowAPI,
  containerEngine as containerEngineAPI,
  navigation as navigationAPI,
} from '@podman-desktop/api';
import type {
  ProviderContainerConnectionIdentifierInfo,
  SimpleImageInfo,
} from '@podman-desktop/extension-hummingbird-core-api';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import { Publisher } from '/@/utils/publisher';
import type { AsyncInit } from '/@/utils/async-init';
import { z } from 'zod';
import { TelemetryEvents } from '/@/utils/telemetry-events';
import { inject, injectable, postConstruct, preDestroy } from 'inversify';
import { TelemetryLoggerSymbol } from '/@/inject/symbol';
import { WebviewService } from '/@/services/webview-service';
import { ProviderService } from '/@/services/provider-service';

const HummingBirdImageEvent = z.object({
  Type: z.literal('image'),
  Action: z.literal(['pull', 'delete']),
  Actor: z.object({
    Attributes: z.object({
      name: z.string().startsWith('quay.io/hummingbird/'),
    }),
  }),
});

@injectable()
export class ImageService extends Publisher<void> implements AsyncInit, Disposable {
  #disposables: Disposable[] = [];

  constructor(
    @inject(TelemetryLoggerSymbol)
    protected readonly telemetryLogger: TelemetryLogger,
    @inject(WebviewService)
    webviewService: WebviewService,
    @inject(ProviderService)
    protected readonly providers: ProviderService,
  ) {
    super(webviewService, Messages.UPDATE_IMAGES, () => {});
  }

  public async pull(options: { image: string; connection: ProviderContainerConnection }): Promise<SimpleImageInfo> {
    const telemetry: Record<string, unknown> = {
      image: options.image,
    };

    return await windowAPI
      .withProgress(
        {
          location: ProgressLocation.TASK_WIDGET,
          title: `Pulling ${options.image}`,
          cancellable: true,
        },
        async (_, token) => {
          token.onCancellationRequested(() => (telemetry['cancelled'] = true));

          await containerEngineAPI.pullImage(
            options.connection.connection,
            options.image,
            console.log,
            undefined,
            token,
          );
          const images = await containerEngineAPI.listImages({
            provider: options.connection.connection,
          });
          const image = images.find(image => image.RepoTags?.find(tag => tag === options.image));
          if (!image) throw new Error(`Cannot find image ${options.image}`);
          return {
            name: options.image,
            connection: this.providers.toProviderContainerConnectionDetailedInfo(options.connection),
            id: image.Id,
          };
        },
      )
      .finally(() => {
        this.telemetryLogger.logUsage(TelemetryEvents.PULL_IMAGE, telemetry);
      });
  }

  public async all(options: {
    registry: string;
    connection: ProviderContainerConnection;
    organisation: string;
  }): Promise<Array<SimpleImageInfo>> {
    const images = await containerEngineAPI.listImages({
      provider: options.connection.connection,
    });

    const connection: ProviderContainerConnectionIdentifierInfo = {
      providerId: options.connection.providerId,
      name: options.connection.connection.name,
    };

    return images.reduce((accumulator, current) => {
      const tag = current.RepoTags?.find(tag => tag.startsWith(`${options.registry}/${options.organisation}`));
      if (tag) {
        accumulator.push({
          id: current.Id,
          name: tag,
          connection,
        });
      }
      return accumulator;
    }, [] as Array<SimpleImageInfo>);
  }

  public async navigateToImageDetails(image: SimpleImageInfo): Promise<void> {
    const connection = this.providers.getProviderContainerConnection(image.connection);

    const info = await containerEngineAPI.listInfos({
      provider: connection.connection,
    });
    if (info.length !== 1) throw new Error('Unexpected number of connections');
    const engineId = info[0].engineId;

    return navigationAPI.navigateToImage(image.id, engineId, image.name);
  }

  @preDestroy()
  override dispose(): void {
    super.dispose();
    this.#disposables.forEach((disposable: Disposable) => disposable.dispose());
  }

  @postConstruct()
  async init(): Promise<void> {
    this.#disposables.push(
      containerEngineAPI.onEvent(event => {
        const result = HummingBirdImageEvent.safeParse(event);
        if (!result.success) return;

        this.notify();
      }),
    );
  }
}
