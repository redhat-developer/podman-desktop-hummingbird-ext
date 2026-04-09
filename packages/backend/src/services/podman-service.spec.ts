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
  ProviderContainerConnection,
  ContainerInspectInfo,
  Extension,
  ContainerEngineInfo,
} from '@podman-desktop/api';
import { extensions as extensionsAPI, containerEngine as containerEngineAPI } from '@podman-desktop/api';
import type { PodmanExtensionApi } from '@podman-desktop/podman-extension-api';

import { beforeEach, vi, test, expect, describe } from 'vitest';
import { PodmanService } from './podman-service';
import type { ProviderService } from './provider-service';

const PROVIDER_SERVICE_MOCK: ProviderService = {
  getContainerConnections: vi.fn(),
} as unknown as ProviderService;

const PODMAN_EXTENSION_API_MOCK: PodmanExtensionApi = {
  exec: vi.fn(),
} as unknown as PodmanExtensionApi;

const PODMAN_EXTENSION_MOCK: Extension<PodmanExtensionApi> = {
  exports: PODMAN_EXTENSION_API_MOCK,
} as unknown as Extension<PodmanExtensionApi>;

const STARTED_PROVIDER_CONNECTION_MOCK: ProviderContainerConnection = {
  connection: {
    status: () => 'started',
  },
} as unknown as ProviderContainerConnection;

const CONTAINER_INSPECT_MOCK: ContainerInspectInfo = {
  engineId: 'test-engine-id',
  Id: 'container-123',
  Name: 'my-container',
} as ContainerInspectInfo;

const ENGINE_INFO_MOCK: ContainerEngineInfo = {
  engineId: 'test-engine-id',
} as ContainerEngineInfo;

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(extensionsAPI.getExtension).mockReturnValue(PODMAN_EXTENSION_MOCK);
  vi.mocked(PROVIDER_SERVICE_MOCK.getContainerConnections).mockReturnValue([STARTED_PROVIDER_CONNECTION_MOCK]);
  vi.mocked(containerEngineAPI.listInfos).mockResolvedValue([ENGINE_INFO_MOCK]);
});

function getPodmanService(): PodmanService {
  return new PodmanService(PROVIDER_SERVICE_MOCK);
}

describe('getPodmanExtension', () => {
  test('should return podman extension exports when extension exists', () => {
    const service = getPodmanService();
    const result = service['getPodmanExtension']();

    expect(result).toStrictEqual(PODMAN_EXTENSION_API_MOCK);
    expect(extensionsAPI.getExtension).toHaveBeenCalledWith('podman-desktop.podman');
  });

  test('should throw error when podman extension not found', () => {
    vi.mocked(extensionsAPI.getExtension).mockReturnValue(undefined);

    const service = getPodmanService();

    expect(() => service['getPodmanExtension']()).toThrowError('podman extension not found');
  });
});

describe('podman getter', () => {
  test('should cache podman extension and not call getPodmanExtension multiple times', () => {
    const service = getPodmanService();

    // Access podman getter multiple times
    const first = service['podman'];
    const second = service['podman'];

    expect(first).toStrictEqual(PODMAN_EXTENSION_API_MOCK);
    expect(second).toStrictEqual(PODMAN_EXTENSION_API_MOCK);
    // Should only call getExtension once due to caching
    expect(extensionsAPI.getExtension).toHaveBeenCalledOnce();
  });
});

describe('getRunningProviderContainerConnectionByEngineId', () => {
  test('should return provider connection for matching engineId', async () => {
    const service = getPodmanService();
    const result = await service.getRunningProviderContainerConnectionByEngineId('test-engine-id');

    expect(result).toStrictEqual(STARTED_PROVIDER_CONNECTION_MOCK);
    expect(PROVIDER_SERVICE_MOCK.getContainerConnections).toHaveBeenCalled();
    expect(containerEngineAPI.listInfos).toHaveBeenCalledWith({
      provider: STARTED_PROVIDER_CONNECTION_MOCK.connection,
    });
  });

  test('should throw error when no connections available', async () => {
    vi.mocked(PROVIDER_SERVICE_MOCK.getContainerConnections).mockReturnValue([]);

    const service = getPodmanService();

    await expect(service.getRunningProviderContainerConnectionByEngineId('test-engine-id')).rejects.toThrowError(
      'connection not found for engineId test-engine-id',
    );
  });
});

describe('clone', () => {
  test('should clone container with alternative image', async () => {
    vi.mocked(PODMAN_EXTENSION_API_MOCK.exec).mockResolvedValue({
      stdout: 'new-container-456\n',
      stderr: '',
      command: 'podman',
    });

    const service = getPodmanService();
    const result = await service.clone(CONTAINER_INSPECT_MOCK, 'registry.io/alternative:latest');

    expect(result).toStrictEqual({
      engineId: 'test-engine-id',
      Id: 'new-container-456',
    });

    expect(PODMAN_EXTENSION_API_MOCK.exec).toHaveBeenCalledWith(
      ['container', 'clone', 'container-123', 'my-container-clone', 'registry.io/alternative:latest', '--run'],
      {
        connection: STARTED_PROVIDER_CONNECTION_MOCK,
      },
    );
  });
});
