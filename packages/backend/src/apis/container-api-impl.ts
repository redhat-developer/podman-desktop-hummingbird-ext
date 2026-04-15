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
import { ContainerApi, type CloneOptions, type CloneResult } from '@podman-desktop/extension-hummingbird-core-api';
import { PodmanService } from '../services/podman-service';
import type { LocalContainer } from '@podman-desktop/extension-hummingbird-core-api/src/models/local-container';
import { inject, injectable } from 'inversify';
import { containerEngine as containerEngineAPI } from '@podman-desktop/api';

@injectable()
export class ContainerApiImpl extends ContainerApi {
  constructor(
    @inject(PodmanService)
    protected readonly podmanService: PodmanService,
  ) {
    super();
  }

  override async getContainer(engineId: string, containerId: string): Promise<LocalContainer> {
    const container = await containerEngineAPI.inspectContainer(engineId, containerId);

    return {
      engineId: container.engineId,
      id: container.Id,
      name: container.Name,
      imageID: container.Image,
    };
  }

  override async clone(
    engineId: string,
    containerId: string,
    alternativeImage: string,
    options: CloneOptions,
  ): Promise<CloneResult> {
    // Verify this is a podman connection
    const connection = await this.podmanService.getRunningProviderContainerConnectionByEngineId(engineId);
    if (connection.connection.type !== 'podman') {
      throw new Error('Container cloning with alternative images is only supported for Podman connections');
    }

    const container = await containerEngineAPI.inspectContainer(engineId, containerId);

    // Stop the container if requested
    if (options.stopBeforeClone && container.State.Running) {
      await containerEngineAPI.stopContainer(engineId, containerId);
    }

    const pods = await containerEngineAPI.listPods();
    const pod = pods.find(
      pod => pod.engineId === container.engineId && pod.Containers.some(container => container.Id === containerId),
    );

    // Clone the container with the alternative image
    return await this.podmanService.clone(engineId, containerId, alternativeImage, {
      ...options,
      task: {
        title: `Cloning container ${container.Name} (${container.Id.substring(0, 8)})`,
      },
      pod: pod?.Id,
    });
  }
}
