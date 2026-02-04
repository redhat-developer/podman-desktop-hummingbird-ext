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
import { DialogApi, HummingbirdApi, RoutingApi, RpcBrowser } from '@hummingbird/core-api';

/**
 * This file is the client side of the API. It is used to communicate with the backend, which allows
 * cross-communication between the frontend and backend through an RPC-like communication.
 *
 */
export interface RouterState {
  url: string;
}
const podmanDesktopApi = acquirePodmanDesktopApi();

export const rpcBrowser: RpcBrowser = new RpcBrowser(window, podmanDesktopApi);
// apis
export const routingAPI: RoutingApi = rpcBrowser.getProxy(RoutingApi);
export const hummingbirdAPI: HummingbirdApi = rpcBrowser.getProxy(HummingbirdApi);
export const dialogAPI: DialogApi = rpcBrowser.getProxy(DialogApi);

// The below code is used to save the state of the router in the podmanDesktopApi, so
// that we can determine the correct route to display when the extension is reloaded.
export const saveRouterState = (state: RouterState): void => {
  podmanDesktopApi.setState(state);
};

const isRouterState = (value: unknown): value is RouterState => {
  return typeof value === 'object' && !!value && 'url' in value;
};

export async function getRouterState(): Promise<RouterState> {
  const route: string | undefined = await routingAPI.readRoute();
  if (route) {
    return {
      url: route,
    };
  }

  const state = podmanDesktopApi.getState();
  if (isRouterState(state)) return state;
  return { url: '/' };
}

/**
 * Making clients available as global properties
 */
Object.defineProperty(window, 'routingAPI', {
  value: routingAPI,
});

Object.defineProperty(window, 'hummingbirdAPI', {
  value: hummingbirdAPI,
});

Object.defineProperty(window, 'dialogAPI', {
  value: dialogAPI,
});
