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

import type { Disposable, ProviderContainerConnection } from '@podman-desktop/api';
import { provider as providerAPI } from '@podman-desktop/api';
import type { AsyncInit } from '/@/utils/async-init';
import { Publisher } from '/@/utils/publisher';
import type {
  ProviderContainerConnectionDetailedInfo,
  ProviderContainerConnectionIdentifierInfo,
} from '@podman-desktop/extension-hummingbird-core-api';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import { inject, injectable, postConstruct, preDestroy } from 'inversify';
import { WebviewService } from '/@/services/webview-service';

@injectable()
export class ProviderService
  extends Publisher<ProviderContainerConnectionDetailedInfo[]>
  implements Disposable, AsyncInit
{
  #disposables: Disposable[] = [];

  constructor(
    @inject(WebviewService)
    webviewService: WebviewService,
  ) {
    super(webviewService, Messages.UPDATE_PROVIDERS, () => this.all());
  }

  @preDestroy()
  override dispose(): void {
    super.dispose();
    this.#disposables.forEach((disposable: Disposable) => disposable.dispose());
  }

  getContainerConnections(): ProviderContainerConnection[] {
    return providerAPI.getContainerConnections();
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

  @postConstruct()
  async init(): Promise<void> {
    // register
    this.#disposables.push(providerAPI.onDidRegisterContainerConnection(this.notify.bind(this)));
    // unregister
    this.#disposables.push(providerAPI.onDidUnregisterContainerConnection(this.notify.bind(this)));
    // update container connection (start / stop )
    this.#disposables.push(providerAPI.onDidUpdateContainerConnection(this.notify.bind(this)));
  }
}
