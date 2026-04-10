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
import type { ProviderContainerConnection, Webview, WebviewPanel } from '@podman-desktop/api';
import { provider as providerAPI } from '@podman-desktop/api';

import { expect, test, vi, beforeEach, describe } from 'vitest';
import { ProviderService } from '/@/services/provider-service';
import type { WebviewService } from '/@/services/webview-service';

const WEBVIEW_SERVICE_MOCK: WebviewService = {
  getPanel: vi.fn(),
} as unknown as WebviewService;

const WEBVIEW_MOCK: Webview = {
  postMessage: vi.fn(),
} as unknown as Webview;

const WSL_PROVIDER_CONNECTION_MOCK: ProviderContainerConnection = {
  connection: {
    type: 'podman',
    name: 'podman-machine',
    vmType: 'WSL',
    status: () => 'started',
  },
  providerId: 'podman',
} as ProviderContainerConnection;

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(WEBVIEW_SERVICE_MOCK.getPanel).mockReturnValue({
    webview: WEBVIEW_MOCK,
  } as unknown as WebviewPanel);
  vi.mocked(WEBVIEW_MOCK.postMessage).mockResolvedValue(true);
});

function getProviderService(): ProviderService {
  return new ProviderService(WEBVIEW_SERVICE_MOCK);
}

test('ProviderService#all should use provider api', async () => {
  vi.mocked(providerAPI.getContainerConnections).mockReturnValue([WSL_PROVIDER_CONNECTION_MOCK]);

  const providers = getProviderService();
  const connections = providers.all();
  expect(connections).toHaveLength(1);
  expect(connections[0]).toStrictEqual({
    name: 'podman-machine',
    providerId: 'podman',
    status: 'started',
    vmType: 'WSL',
  });
});

describe('init', () => {
  beforeEach(() => {
    vi.mocked(providerAPI.getContainerConnections).mockReturnValue([]);
  });

  test('should register container connections listener', async () => {
    const providers = getProviderService();
    await providers.init();

    // listen to new container connection
    expect(providerAPI.onDidRegisterContainerConnection).toHaveBeenCalledExactlyOnceWith(expect.any(Function));

    // listen to remove of container connection
    expect(providerAPI.onDidUnregisterContainerConnection).toHaveBeenCalledExactlyOnceWith(expect.any(Function));

    // listen to update of container connection
    expect(providerAPI.onDidUpdateContainerConnection).toHaveBeenCalledExactlyOnceWith(expect.any(Function));
  });

  test('container connection update should notify for events', async () => {
    const listener = vi.fn();

    const providers = getProviderService();
    await providers.init();

    // register a listener to the ProviderService
    providers.event(listener);

    const registerListener = vi.mocked(providerAPI.onDidRegisterContainerConnection).mock.calls[0][0];
    registerListener(WSL_PROVIDER_CONNECTION_MOCK);

    expect(listener).toHaveBeenCalledOnce();
  });
});
