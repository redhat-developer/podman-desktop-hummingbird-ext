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
  env,
  ExtensionContext,
  extensions,
  process as processApi,
  commands as commandsApi,
  provider,
  window,
  configuration as configurationAPI,
  cli as cliApi,
  containerEngine,
  TelemetryLogger,
} from '@podman-desktop/api';
import { WebviewService } from './webview-service';
import { RpcExtension, RoutingApi, HummingbirdApi, DialogApi } from '@podman-desktop/extension-hummingbird-core-api';

import type { AsyncInit } from '../utils/async-init';

import { RoutingService } from './routing-service';
import { RoutingApiImpl } from '../apis/routing-api-impl';
import { QuayIOService } from './quay-io-service';
import { HummingbirdService } from './hummingbird-service';
import { HummingbirdApiImpl } from '../apis/hummingbird-api-impl';
import { DialogApiImpl } from '../apis/dialog-api-impl';
import { DialogService } from './dialog-service';

interface Dependencies {
  extensionContext: ExtensionContext;
  window: typeof window;
  env: typeof env;
  extensions: typeof extensions;
  processApi: typeof processApi;
  providers: typeof provider;
  cliApi: typeof cliApi;
  commandsApi: typeof commandsApi;
  containers: typeof containerEngine;
  configuration: typeof configurationAPI;
}

export class MainService implements Disposable, AsyncInit {
  readonly #disposables: Disposable[] = [];
  readonly #telemetry: TelemetryLogger;

  constructor(private dependencies: Dependencies) {
    this.#telemetry = dependencies.env.createTelemetryLogger();
  }

  dispose(): void {
    this.#disposables.forEach(disposable => disposable.dispose());
    this.#telemetry.dispose();
  }

  async init(): Promise<void> {
    /**
     * Creating and init Services
     */
    // init webview
    const webview = new WebviewService({
      extensionUri: this.dependencies.extensionContext.extensionUri,
      window: this.dependencies.window,
    });
    await webview.init();
    this.#disposables.push(webview);

    // init IPC system
    const rpcExtension = new RpcExtension(webview.getPanel().webview);
    rpcExtension.init();
    this.#disposables.push(rpcExtension);

    // routing service
    const routing = new RoutingService({
      panel: webview.getPanel(),
    });
    await routing.init();
    this.#disposables.push(routing);

    // dialog service
    const dialog = new DialogService({
      windowApi: this.dependencies.window,
      envApi: this.dependencies.env,
    });

    // quay service
    const quay = new QuayIOService();
    this.#disposables.push(quay);

    const hummingbird = new HummingbirdService({
      quay,
    });
    this.#disposables.push(hummingbird);

    /**
     * Creating the api for the frontend IPCs
     */

    // routing api
    const routingApiImpl = new RoutingApiImpl({
      routing: routing,
    });
    rpcExtension.registerInstance<RoutingApi>(RoutingApi, routingApiImpl);

    // hummingbird api
    const hummingbirdApiImpl = new HummingbirdApiImpl({
      hummingbird,
    });
    rpcExtension.registerInstance<HummingbirdApi>(HummingbirdApi, hummingbirdApiImpl);

    // dialog api
    const dialogApiImpl = new DialogApiImpl({
      dialog: dialog,
    });
    rpcExtension.registerInstance<DialogApi>(DialogApi, dialogApiImpl);
  }
}
