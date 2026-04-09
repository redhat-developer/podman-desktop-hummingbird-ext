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

import { expect, test, vi, beforeEach } from 'vitest';
import { MainService } from './main-service';
import {
  RpcExtension,
  RoutingApi,
  DialogApi,
  ImageApi,
  HummingbirdApi,
  ProviderApi,
} from '@podman-desktop/extension-hummingbird-core-api';
import { InversifyBinding } from '../inject/inversify-binding';
import type { Container } from 'inversify';

// mock inversify binding
vi.mock(import('../inject/inversify-binding'));

const EXTENSION_CONTEXT_MOCK: ExtensionContext = {} as unknown as ExtensionContext;
const INVERSIFY_CONTAINER_MOCK: Container = {
  getAsync: vi.fn(),
  get: vi.fn(),
} as unknown as Container;
const RPC_EXTENSION_MOCK: RpcExtension = {
  registerInstance: vi.fn(),
} as unknown as RpcExtension;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(InversifyBinding.prototype.init).mockResolvedValue(INVERSIFY_CONTAINER_MOCK);
  vi.mocked(INVERSIFY_CONTAINER_MOCK.getAsync).mockImplementation(async identifier => {
    switch (identifier) {
      case RpcExtension:
        return RPC_EXTENSION_MOCK;
      default:
        return {};
    }
  });
});

function getMainService(): MainService {
  return new MainService();
}

test('ensure init register all APIs', async () => {
  const main = getMainService();
  await main.init(EXTENSION_CONTEXT_MOCK);

  const APIS: Array<{ CHANNEL: string }> = [RoutingApi, DialogApi, ImageApi, HummingbirdApi, ProviderApi];

  for (const key of APIS) {
    expect(RPC_EXTENSION_MOCK.registerInstance).toHaveBeenCalledWith(key, expect.anything());
  }
});
