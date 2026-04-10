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

import { expect, test, vi, beforeEach, describe } from 'vitest';
import type { TelemetryLogger, ImageInfo } from '@podman-desktop/api';
import { containerEngine } from '@podman-desktop/api';
import { AlternativeService } from './alternative-service';
import type { HummingbirdService } from './hummingbird-service';
import type {
  ImageSummary,
  LocalImageAlternative,
  VulnerabilitiesSummary,
} from '@podman-desktop/extension-hummingbird-core-api';
import type { GrypeService } from './scanners/grype-service';
import type { grype } from '@podman-desktop/grype-extension-api';

const TELEMETRY_LOGGER_MOCK: TelemetryLogger = {
  logUsage: vi.fn(),
  onDidChangeEnableStates: vi.fn(),
  isUsageEnabled: true,
  isErrorsEnabled: true,
  logError: vi.fn(),
  dispose: vi.fn(),
};

const HUMMINGBIRD_SERVICE_MOCK = {
  getImages: vi.fn(),
  getVulnerabilitiesSummary: vi.fn(),
} as unknown as HummingbirdService;

const HUMMINGBIRD_IMAGES_MOCK: Array<ImageSummary> = [
  {
    name: 'nginx',
    description: 'Hardened nginx',
    architectures: [],
    latest_tag: '',
    pull_url: '',
    streams: [],
    tag_count: 0,
    variants: [],
    application_category: '',
    summary: '',
  },
  {
    name: 'python',
    description: 'Hardened python',
    architectures: [],
    latest_tag: '',
    pull_url: '',
    streams: [],
    tag_count: 0,
    variants: [],
    application_category: '',
    summary: '',
  },
];

const GRYPE_SERVICE_MOCK: GrypeService = {
  api: {
    vulnerability: {
      analyse: vi.fn(),
    },
  },
  toVulnerabilitySummary: vi.fn(),
} as unknown as GrypeService;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(HUMMINGBIRD_SERVICE_MOCK.getImages).mockResolvedValue(HUMMINGBIRD_IMAGES_MOCK);
});

function getAlternativeService(): AlternativeService {
  return new AlternativeService(TELEMETRY_LOGGER_MOCK, HUMMINGBIRD_SERVICE_MOCK, GRYPE_SERVICE_MOCK);
}

test('should return alternatives for matching local images', async () => {
  const localImages: Array<ImageInfo> = [
    {
      Id: 'sha256:abc123',
      engineId: 'podman',
      RepoTags: ['docker.io/library/nginx:latest'],
      Size: 1024000,
      Arch: 'amd64',
    } as unknown as ImageInfo,
  ];

  vi.mocked(containerEngine.listImages).mockResolvedValue(localImages);

  const service = getAlternativeService();
  const result = await service.getAlternatives();

  expect(result).toHaveLength(1);
  expect(result[0].localImage.name).toBe('docker.io/library/nginx');
  expect(result[0].localImage.tag).toBe('latest');
  expect(result[0].alternative.name).toBe('nginx');
});

test('should skip images without RepoTags', async () => {
  const localImages: Array<ImageInfo> = [
    {
      Id: 'sha256:abc123',
      engineId: 'podman',
      RepoTags: [],
      Size: 1024000,
      Arch: 'amd64',
    } as unknown as ImageInfo,
  ];

  vi.mocked(containerEngine.listImages).mockResolvedValue(localImages);

  const service = getAlternativeService();
  const result = await service.getAlternatives();

  expect(result).toHaveLength(0);
});

test('should skip images without Arch property', async () => {
  const localImages: Array<ImageInfo> = [
    {
      Id: 'sha256:abc123',
      engineId: 'podman',
      RepoTags: ['docker.io/library/nginx:latest'],
      Size: 1024000,
    } as ImageInfo,
  ];

  vi.mocked(containerEngine.listImages).mockResolvedValue(localImages);

  const service = getAlternativeService();
  const result = await service.getAlternatives();

  expect(result).toHaveLength(0);
});

test('should skip images without matching alternatives', async () => {
  const localImages: Array<ImageInfo> = [
    {
      Id: 'sha256:abc123',
      engineId: 'podman',
      RepoTags: ['docker.io/library/unknown:latest'],
      Size: 1024000,
      Arch: 'amd64',
    } as unknown as ImageInfo,
  ];

  vi.mocked(containerEngine.listImages).mockResolvedValue(localImages);

  const service = getAlternativeService();
  const result = await service.getAlternatives();

  expect(result).toHaveLength(0);
});

test('should handle multiple images with alternatives', async () => {
  const localImages: Array<ImageInfo> = [
    {
      Id: 'sha256:abc123',
      engineId: 'podman',
      RepoTags: ['docker.io/library/nginx:1.21'],
      Size: 1024000,
      Arch: 'amd64',
    } as unknown as ImageInfo,
    {
      Id: 'sha256:def456',
      engineId: 'podman',
      RepoTags: ['docker.io/library/python:3.9'],
      Size: 2048000,
      Arch: 'arm64',
    } as unknown as ImageInfo,
  ];

  vi.mocked(containerEngine.listImages).mockResolvedValue(localImages);

  const service = getAlternativeService();
  const result = await service.getAlternatives();

  expect(result).toHaveLength(2);
  expect(result[0].localImage.name).toBe('docker.io/library/nginx');
  expect(result[1].localImage.name).toBe('docker.io/library/python');
});

describe('AlternativeService#getAlternativeReport', () => {
  test('should return vulnerability report for alternative and local image', async () => {
    const mockAlternative: LocalImageAlternative = {
      localImage: {
        id: 'sha256:abc123',
        engineId: 'podman',
        name: 'docker.io/library/nginx',
        tag: 'latest',
        size: 1024000,
        architecture: 'amd64',
      },
      alternative: {
        name: 'nginx',
        latest_tag: '1.21',
      } as ImageSummary,
    };

    const mockAltVulnerabilities: VulnerabilitiesSummary = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      negligible: 0,
      unknown: 0,
      total: 6,
    };

    const mockLocalGrypeDocument: grype.Document = {
      matches: [
        {
          vulnerability: {
            severity: 'critical',
          },
        },
        {
          vulnerability: {
            severity: 'high',
          },
        },
      ],
    } as grype.Document;

    const mockLocalVulnerabilities: VulnerabilitiesSummary = {
      critical: 1,
      high: 1,
      medium: 0,
      low: 0,
      negligible: 0,
      unknown: 0,
      total: 2,
    };

    vi.mocked(HUMMINGBIRD_SERVICE_MOCK.getVulnerabilitiesSummary).mockResolvedValue(mockAltVulnerabilities);
    vi.mocked(GRYPE_SERVICE_MOCK.api.vulnerability.analyse).mockResolvedValue(mockLocalGrypeDocument);
    vi.mocked(GRYPE_SERVICE_MOCK.toVulnerabilitySummary).mockReturnValue(mockLocalVulnerabilities);

    const service = getAlternativeService();
    const result = await service.getAlternativeReport(mockAlternative);

    expect(result).toStrictEqual({
      localImage: {
        vulnerabilities: mockLocalVulnerabilities,
      },
      alternative: {
        vulnerabilities: mockAltVulnerabilities,
      },
    });

    expect(HUMMINGBIRD_SERVICE_MOCK.getVulnerabilitiesSummary).toHaveBeenCalledWith('nginx', '1.21');
    expect(GRYPE_SERVICE_MOCK.api.vulnerability.analyse).toHaveBeenCalledWith(
      {
        engineId: 'podman',
        Id: 'sha256:abc123',
      },
      expect.objectContaining({
        task: {
          title: 'Scanning docker.io/library/nginx:latest',
        },
      }),
    );
  });
});
