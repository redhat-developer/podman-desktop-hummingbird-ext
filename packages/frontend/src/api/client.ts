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
import {
  DialogApi,
  HummingbirdApi,
  RoutingApi,
  ImageApi,
  ProviderApi,
  AlternativesApi,
  ContainerApi,
  RpcBrowser,
} from '@podman-desktop/extension-hummingbird-core-api';

import { browser } from '$app/environment';
import type { PodmanDesktopApi } from '../../../../types/podman-desktop-api';

/**
 * This file is the client side of the API. It is used to communicate with the backend, which allows
 * cross-communication between the frontend and backend through an RPC-like communication.
 *
 */
export interface RouterState {
  url: string;
}

let api: PodmanDesktopApi;
let rpcBrowser: RpcBrowser;
let routingAPI: RoutingApi;
let hummingbirdAPI: HummingbirdApi;
let providerAPI: ProviderApi;
let imageAPI: ImageApi;
let dialogAPI: DialogApi;
let alternativesAPI: AlternativesApi;
let containerAPI: ContainerApi;

if (browser) {
  api = acquirePodmanDesktopApi();
  rpcBrowser = new RpcBrowser(window, api);

  // apis
  routingAPI = rpcBrowser.getProxy(RoutingApi);
  hummingbirdAPI = rpcBrowser.getProxy(HummingbirdApi);
  providerAPI = rpcBrowser.getProxy(ProviderApi);
  imageAPI = rpcBrowser.getProxy(ImageApi);
  dialogAPI = rpcBrowser.getProxy(DialogApi);
  alternativesAPI = rpcBrowser.getProxy(AlternativesApi);
  containerAPI = rpcBrowser.getProxy(ContainerApi);

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

  Object.defineProperty(window, 'imageAPI', {
    value: imageAPI,
  });

  Object.defineProperty(window, 'providerAPI', {
    value: providerAPI,
  });

  Object.defineProperty(window, 'alternativesAPI', {
    value: alternativesAPI,
  });

  Object.defineProperty(window, 'containerAPI', {
    value: containerAPI,
  });
}

export { rpcBrowser, routingAPI, hummingbirdAPI, providerAPI, imageAPI, dialogAPI, alternativesAPI, containerAPI };

// The below code is used to save the state of the router in the podmanDesktopApi, so
// that we can determine the correct route to display when the extension is reloaded.
export const saveRouterState = (state: RouterState): void => {
  api.setState(state);
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

  const state = api.getState();
  if (isRouterState(state)) return state;
  return { url: '/' };
}
