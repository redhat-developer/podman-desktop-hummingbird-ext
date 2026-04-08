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
import type { ExtensionContext } from '@podman-desktop/api';
import {
  RpcExtension,
  RoutingApi,
  HummingbirdApi,
  DialogApi,
  ImageApi,
  ProviderApi,
} from '@podman-desktop/extension-hummingbird-core-api';

import type { AsyncInit } from '../utils/async-init';

import { RoutingApiImpl } from '../apis/routing-api-impl';
import { HummingbirdApiImpl } from '../apis/hummingbird-api-impl';
import { DialogApiImpl } from '../apis/dialog-api-impl';
import { ImageApiImpl } from '../apis/image-api-impl';
import { ProviderApiImpl } from '../apis/provider-api-impl';
import { InversifyBinding } from '../inject/inversify-binding';
import type { IAsyncDisposable } from '../utils/async-disposable';

export class MainService implements IAsyncDisposable, AsyncInit<ExtensionContext> {
  #inversify: InversifyBinding | undefined;

  constructor() {}

  async asyncDispose(): Promise<void> {
    try {
      await this.#inversify?.asyncDispose();
    } finally {
      this.#inversify = undefined;
    }
  }

  async init(context: ExtensionContext): Promise<void> {
    this.#inversify = new InversifyBinding(context);
    const container = await this.#inversify.init();

    const rpcExtension = await container.getAsync(RpcExtension);

    // routing api
    rpcExtension.registerInstance<RoutingApi>(RoutingApi, await container.getAsync(RoutingApiImpl));
    rpcExtension.registerInstance<ProviderApi>(ProviderApi, await container.getAsync(ProviderApiImpl));
    rpcExtension.registerInstance<HummingbirdApi>(HummingbirdApi, await container.getAsync(HummingbirdApiImpl));
    rpcExtension.registerInstance<DialogApi>(DialogApi, await container.getAsync(DialogApiImpl));
    rpcExtension.registerInstance<ImageApi>(ImageApi, await container.getAsync(ImageApiImpl));
  }
}
