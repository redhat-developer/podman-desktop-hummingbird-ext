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

import type { Disposable, provider as Provider, ProviderContainerConnection, Webview } from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import { Publisher } from '../utils/publisher';
import type {
  ProviderContainerConnectionDetailedInfo,
  ProviderContainerConnectionIdentifierInfo,
} from '@podman-desktop/extension-hummingbird-core-api';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';

interface Dependencies {
  providers: typeof Provider;
  webview: Webview;
}

export class ProviderService
  extends Publisher<ProviderContainerConnectionDetailedInfo[]>
  implements Disposable, AsyncInit
{
  #disposables: Disposable[] = [];

  constructor(protected dependencies: Dependencies) {
    super(dependencies.webview, Messages.UPDATE_PROVIDERS, () => this.all());
  }

  override dispose(): void {
    super.dispose();
    this.#disposables.forEach((disposable: Disposable) => disposable.dispose());
  }

  getContainerConnections(): ProviderContainerConnection[] {
    return this.dependencies.providers.getContainerConnections();
  }

  public all(): ProviderContainerConnectionDetailedInfo[] {
    return this.getContainerConnections().map(this.toProviderContainerConnectionDetailedInfo);
  }

  public toProviderContainerConnectionDetailedInfo(
    connectionInfo: ProviderContainerConnection,
  ): ProviderContainerConnectionDetailedInfo {
    return {
      providerId: connectionInfo.providerId,
      name: connectionInfo.connection.name,
      status: connectionInfo.connection.status(),
      vmType: connectionInfo.connection.vmType,
    };
  }

  public getProviderContainerConnection({
    providerId,
    name,
  }: ProviderContainerConnectionIdentifierInfo): ProviderContainerConnection {
    const provider = this.getContainerConnections().find(
      connection => connection.providerId === providerId && connection.connection.name === name,
    );
    if (!provider)
      throw new Error(
        `cannot find provider container connection with providerId ${providerId} and connection name ${name}`,
      );
    return provider;
  }

  async init(): Promise<void> {
    // register
    this.#disposables.push(this.dependencies.providers.onDidRegisterContainerConnection(this.notify.bind(this)));
    // unregister
    this.#disposables.push(this.dependencies.providers.onDidUnregisterContainerConnection(this.notify.bind(this)));
    // update container connection (start / stop )
    this.#disposables.push(this.dependencies.providers.onDidUpdateContainerConnection(this.notify.bind(this)));
  }
}
