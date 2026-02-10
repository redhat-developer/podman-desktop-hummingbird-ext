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
  provider,
  ProviderContainerConnection} from '@podman-desktop/api';
import {
  ProgressLocation,
} from '@podman-desktop/api';

interface Dependencies {
  containers: typeof containerEngine;
  windowApi: typeof window;
  providers: typeof provider;
}

export class ImageService implements Disposable {

  constructor(protected readonly dependencies: Dependencies) {}

  public async pull(options: {
    image: string;
  }): Promise<void> {
    // this.dependencies.windowApi.
    const connections = this.dependencies.providers.getContainerConnections();
    const running = connections.filter((connection) => connection.connection.status() === 'started');

    let selected: ProviderContainerConnection;
    if (running.length === 0) {
      throw new Error('No running connections');
    } else if (running.length > 1) {
      const result = await this.dependencies.windowApi.showQuickPick(
        running.map(connection => `${connection.providerId}:${connection.connection.name}`),
        {
          title: 'Select a connection to pull image from',
          canPickMany: false,
        },
      );

      if (!result) throw new Error('user did not pick any value');
      const find = running.find(connection => `${connection.providerId}:${connection.connection.name}` === result);
      if(!find) throw new Error(`Could not find connection ${result}`);
      selected = find;
    } else {
      selected = running[0];
    }

    return await this.dependencies.windowApi.withProgress(
      {
        location: ProgressLocation.TASK_WIDGET,
        title: `Pulling ${options.image}`,
        cancellable: true,
      },
      (_, token) => {
        return this.dependencies.containers.pullImage(selected.connection, options.image, console.log, undefined, token);
      },
    );
  }

  dispose(): void {}
}
