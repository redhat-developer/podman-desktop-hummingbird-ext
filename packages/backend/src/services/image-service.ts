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
import type {
  Disposable,
  containerEngine,
  window,
  ProviderContainerConnection,
  navigation,
  Webview,
} from '@podman-desktop/api';
import { ProgressLocation } from '@podman-desktop/api';
import type {
  ProviderContainerConnectionIdentifierInfo,
  SimpleImageInfo,
} from '@podman-desktop/extension-hummingbird-core-api';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import type { ProviderService } from './provider-service';
import { Publisher } from '../utils/publisher';
import type { AsyncInit } from '../utils/async-init';
import { z } from 'zod';

interface Dependencies {
  containers: typeof containerEngine;
  windowApi: typeof window;
  providers: ProviderService;
  navigation: typeof navigation;
  webview: Webview;
}

const HummingBirdImageEvent = z.object({
  Type: z.literal('image'),
  Action: z.literal(['pull', 'delete']),
  Actor: z.object({
    Attributes: z.object({
      name: z.string().startsWith('quay.io/hummingbird/'),
    }),
  }),
});

export class ImageService extends Publisher<void> implements AsyncInit, Disposable {
  #disposables: Disposable[] = [];

  constructor(protected readonly dependencies: Dependencies) {
    super(dependencies.webview, Messages.UPDATE_IMAGES, () => {});
  }

  public async pull(options: { image: string; connection: ProviderContainerConnection }): Promise<SimpleImageInfo> {
    return await this.dependencies.windowApi.withProgress(
      {
        location: ProgressLocation.TASK_WIDGET,
        title: `Pulling ${options.image}`,
        cancellable: true,
      },
      async (_, token) => {
        await this.dependencies.containers.pullImage(
          options.connection.connection,
          options.image,
          console.log,
          undefined,
          token,
        );
        const images = await this.dependencies.containers.listImages({
          provider: options.connection.connection,
        });
        const image = images.find(image => image.RepoTags?.find(tag => tag === options.image));
        if (!image) throw new Error(`Cannot find image ${options.image}`);
        return {
          name: options.image,
          connection: this.dependencies.providers.toProviderContainerConnectionDetailedInfo(options.connection),
          id: image.Id,
        };
      },
    );
  }

  public async all(options: {
    registry: string;
    connection: ProviderContainerConnection;
    organisation: string;
  }): Promise<Array<SimpleImageInfo>> {
    const images = await this.dependencies.containers.listImages({
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
    const connection = this.dependencies.providers.getProviderContainerConnection(image.connection);

    const info = await this.dependencies.containers.listInfos({
      provider: connection.connection,
    });
    if (info.length !== 1) throw new Error('Unexpected number of connections');
    const engineId = info[0].engineId;

    return this.dependencies.navigation.navigateToImage(image.id, engineId, image.name);
  }

  override dispose(): void {
    super.dispose();
    this.#disposables.forEach((disposable: Disposable) => disposable.dispose());
  }

  async init(): Promise<void> {
    this.#disposables.push(
      this.dependencies.containers.onEvent(event => {
        const result = HummingBirdImageEvent.safeParse(event);
        if (!result.success) return;

        this.notify();
      }),
    );
  }
}
