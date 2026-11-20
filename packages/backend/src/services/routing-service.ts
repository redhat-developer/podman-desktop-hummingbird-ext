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
import type { AsyncInit } from '/@/utils/async-init';
import { navigation, type Disposable } from '@podman-desktop/api';
import { Publisher } from '/@/utils/publisher';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import { inject, injectable, postConstruct } from 'inversify';
import { WebviewService } from '/@/services/webview-service';

@injectable()
export class RoutingService extends Publisher<string | undefined> implements Disposable, AsyncInit {
  #route: string | undefined = undefined;
  #historyListener: Disposable | undefined = undefined;

  constructor(
    @inject(WebviewService)
    webviewService: WebviewService,
  ) {
    super(webviewService, Messages.ROUTE_UPDATE, () => this.#route);
  }

  @postConstruct()
  async init(): Promise<void> {
    // the user navigated back/forward to one of our history entries: restore the matching route
    this.#historyListener = navigation.onDidNavigateToHistoryEntry(({ id }) => this.write(id));
  }

  /**
   * This function return the route, and reset it.
   * Meaning after read the route is undefined
   */
  public read(): string | undefined {
    const result: string | undefined = this.#route;
    this.#route = undefined;
    return result;
  }

  /**
   * Register a frontend route in Podman Desktop's global back/forward history.
   * The route is used as the entry id, and given back by {@link navigation.onDidNavigateToHistoryEntry}.
   */
  public pushHistory(route: string, label: string): void {
    navigation.pushHistoryEntry({ id: route, label });
  }

  protected write(route: string): void {
    // update the route
    this.#route = route;
    // notify
    this.notify();
    // reveal
    this.webviewService.getPanel()?.reveal();
  }

  override dispose(): void {
    super.dispose();
    this.#historyListener?.dispose();
    this.#route = undefined;
  }
}
