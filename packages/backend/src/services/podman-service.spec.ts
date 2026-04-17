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
  Extension,
  ContainerEngineInfo,
  TelemetryLogger,
  CancellationToken,
  ImageInspectInfo,
} from '@podman-desktop/api';
import {
  extensions as extensionsAPI,
  containerEngine as containerEngineAPI,
  window as windowAPI,
  ProgressLocation,
} from '@podman-desktop/api';
import type { PodmanExtensionApi } from '@podman-desktop/podman-extension-api';

import { beforeEach, vi, test, expect, describe } from 'vitest';
import { PodmanService } from '/@/services/podman-service';
import type { ProviderService } from '/@/services/provider-service';
import { TelemetryEvents } from '/@/utils/telemetry-events';

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

const ENGINE_INFO_MOCK: ContainerEngineInfo = {
  engineId: 'test-engine-id',
} as ContainerEngineInfo;

const TELEMETRY_LOGGER_MOCK: TelemetryLogger = {
  logUsage: vi.fn(),
  onDidChangeEnableStates: vi.fn(),
  isUsageEnabled: true,
  isErrorsEnabled: true,
  logError: vi.fn(),
  dispose: vi.fn(),
};

const CANCELLATION_TOKEN_MOCK: CancellationToken = {
  onCancellationRequested: vi.fn(),
  isCancellationRequested: false,
} as CancellationToken;

const IMAGE_INSPECT_MOCK = {
  Config: {
    Entrypoint: ['entrypoint'],
    Cmd: ['command'],
  },
} as unknown as ImageInspectInfo;

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(extensionsAPI.getExtension).mockReturnValue(PODMAN_EXTENSION_MOCK);
  vi.mocked(PROVIDER_SERVICE_MOCK.getContainerConnections).mockReturnValue([STARTED_PROVIDER_CONNECTION_MOCK]);
  vi.mocked(containerEngineAPI.listInfos).mockResolvedValue([ENGINE_INFO_MOCK]);
  vi.mocked(containerEngineAPI.getImageInspect).mockResolvedValue(IMAGE_INSPECT_MOCK);
  vi.mocked(windowAPI.withProgress).mockImplementation(async (_, task) => {
    return task({ report: vi.fn() }, CANCELLATION_TOKEN_MOCK);
  });
});

function getPodmanService(): PodmanService {
  return new PodmanService(PROVIDER_SERVICE_MOCK, TELEMETRY_LOGGER_MOCK);
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

    expect(() => service['getPodmanExtension']()).toThrow('podman extension not found');
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

    await expect(service.getRunningProviderContainerConnectionByEngineId('test-engine-id')).rejects.toThrow(
      'connection not found for engineId test-engine-id',
    );
  });
});

describe('clone', () => {
  test('should pull image and replicate container', async () => {
    vi.mocked(containerEngineAPI.replicatePodmanContainer).mockResolvedValue({
      Id: 'new-container-id',
      Warnings: [],
    });

    const service = getPodmanService();
    const result = await service.clone('test-engine-id', 'old-container-id', 'alt-image', {
      name: 'new-name',
      task: {
        title: 'Cloning container',
      },
      pod: 'pod-id',
    });

    expect(windowAPI.withProgress).toHaveBeenCalledExactlyOnceWith(
      {
        location: ProgressLocation.TASK_WIDGET,
        title: 'Cloning container',
      },
      expect.any(Function),
    );

    expect(result).toStrictEqual({
      engineId: 'test-engine-id',
      Id: 'new-container-id',
    });

    expect(containerEngineAPI.pullImage).toHaveBeenCalledWith(
      STARTED_PROVIDER_CONNECTION_MOCK.connection,
      'alt-image',
      expect.any(Function),
      undefined,
      CANCELLATION_TOKEN_MOCK,
    );

    expect(containerEngineAPI.replicatePodmanContainer).toHaveBeenCalledWith(
      {
        engineId: 'test-engine-id',
        id: 'old-container-id',
      },
      {
        engineId: 'test-engine-id',
      },
      {
        image: 'alt-image',
        name: 'new-name',
        pod: 'pod-id',
        entrypoint: IMAGE_INSPECT_MOCK.Config.Entrypoint,
        command: IMAGE_INSPECT_MOCK.Config.Cmd,
      },
    );

    expect(TELEMETRY_LOGGER_MOCK.logUsage).toHaveBeenCalledWith(
      TelemetryEvents.CLONE_CONTAINER,
      expect.objectContaining({
        alternative: 'alt-image',
        warnings: 0,
      }),
    );
  });

  test('should log error telemetry if clone fails', async () => {
    const error = new Error('clone failed');
    vi.mocked(containerEngineAPI.replicatePodmanContainer).mockRejectedValue(error);

    const service = getPodmanService();
    await expect(
      service.clone('test-engine-id', 'old-container-id', 'alt-image', {
        name: 'new-name',
        task: {
          title: 'Cloning container',
        },
      }),
    ).rejects.toThrow(error);

    expect(TELEMETRY_LOGGER_MOCK.logUsage).toHaveBeenCalledWith(
      TelemetryEvents.CLONE_CONTAINER,
      expect.objectContaining({
        alternative: 'alt-image',
        error: error,
      }),
    );
  });
});
