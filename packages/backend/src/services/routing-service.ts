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
import type { AsyncInit } from '../utils/async-init';
import type { Disposable, WebviewPanel } from '@podman-desktop/api';
import { Publisher } from '../utils/publisher';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';

interface Dependencies {
  panel: WebviewPanel;
}

export class RoutingService extends Publisher<string | undefined> implements Disposable, AsyncInit {
  #route: string | undefined = undefined;

  constructor(protected dependencies: Dependencies) {
    super(dependencies.panel.webview, Messages.ROUTE_UPDATE, () => this.#route);
  }

  async init(): Promise<void> {}

  /**
   * This function return the route, and reset it.
   * Meaning after read the route is undefined
   */
  public read(): string | undefined {
    const result: string | undefined = this.#route;
    this.#route = undefined;
    return result;
  }

  protected async write(route: string): Promise<void> {
    // update the route
    this.#route = route;
    // notify
    this.notify();
    // reveal
    this.dependencies.panel.reveal();
  }

  override dispose(): void {
    super.dispose();
    this.#route = undefined;
  }
}
