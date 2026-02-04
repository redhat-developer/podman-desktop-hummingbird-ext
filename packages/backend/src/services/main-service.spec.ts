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
  env,
  ExtensionContext,
  extensions,
  process as processApi,
  commands as commandsApi,
  configuration as configurationApi,
  provider,
  window,
  cli as cliApi,
  containerEngine,
  Webview,
  WebviewPanel,
} from '@podman-desktop/api';

import { expect, test, vi, beforeEach } from 'vitest';
import { MainService } from './main-service';
import { WebviewService } from './webview-service';
import { RpcExtension, RoutingApi } from '@hummingbird/core-api';
import { RoutingApiImpl } from '../apis/routing-api-impl';

// mock message-proxy
vi.mock(import('@hummingbird/core-api'));
// mock services
vi.mock(import('./webview-service'));
vi.mock(import('./routing-service'));

const EXTENSION_CONTEXT_MOCK: ExtensionContext = {} as unknown as ExtensionContext;
const WINDOW_API_MOCK: typeof window = {} as unknown as typeof window;
const ENV_API_MOCK: typeof env = {
  createTelemetryLogger: vi.fn(),
} as unknown as typeof env;
const EXTENSION_API_MOCK: typeof extensions = {} as unknown as typeof extensions;
const PROCESS_API_MOCK: typeof processApi = {} as unknown as typeof processApi;
const PROVIDERS_API_MOCK: typeof provider = {} as unknown as typeof provider;
const CLI_API_MOCK: typeof cliApi = {} as unknown as typeof cliApi;
const COMMANDS_API_MOCK: typeof commandsApi = {} as unknown as typeof commandsApi;
const CONTAINER_API_MOCK: typeof containerEngine = {} as unknown as typeof containerEngine;
const CONFIGURATION_API_MOCK: typeof configurationApi = {} as unknown as typeof configurationApi;

const WEBVIEW_PANEL: WebviewPanel = {
  webview: {
    onDidReceiveMessage: vi.fn(),
  } as unknown as Webview,
} as unknown as WebviewPanel;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(WebviewService.prototype.getPanel).mockReturnValue(WEBVIEW_PANEL);
});

function getMainService(): MainService {
  return new MainService({
    extensionContext: EXTENSION_CONTEXT_MOCK,
    window: WINDOW_API_MOCK,
    env: ENV_API_MOCK,
    extensions: EXTENSION_API_MOCK,
    processApi: PROCESS_API_MOCK,
    providers: PROVIDERS_API_MOCK,
    cliApi: CLI_API_MOCK,
    commandsApi: COMMANDS_API_MOCK,
    containers: CONTAINER_API_MOCK,
    configuration: CONFIGURATION_API_MOCK,
  });
}

test('ensure init register all APIs', async () => {
  const main = getMainService();
  await main.init();

  const APIS = new Map<{ CHANNEL: string }, unknown>([[RoutingApi, RoutingApiImpl]]);

  for (const [key, value] of APIS.entries()) {
    expect(RpcExtension.prototype.registerInstance).toHaveBeenCalledWith(key, expect.any(value));
  }
});
