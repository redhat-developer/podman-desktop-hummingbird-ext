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
import { AlternativesApiImpl } from './alternatives-api-impl';
import type { AlternativeService } from '../services/alternative-service';
import type {
  ImageSummary,
  LocalImageAlternative,
  LocalImageAlternativeReport,
  VulnerabilitiesSummary,
} from '@podman-desktop/extension-hummingbird-core-api';
import type { GrypeService } from '/@/services/scanners/grype-service';

const ALTERNATIVE_SERVICE_MOCK: AlternativeService = {
  getAlternatives: vi.fn(),
  getAlternativeReport: vi.fn(),
} as unknown as AlternativeService;

const LOCAL_IMAGE_ALT_MOCK: LocalImageAlternative = {
  localImage: {
    engineId: 'engine1',
    id: 'image1',
    name: 'image1',
    tag: 'tag1',
    size: 55,
    architecture: 'amd64',
    containers: [],
  },
  alternative: {
    name: 'foo',
  } as ImageSummary,
};

const GRYPE_SERVICE_MOCK: GrypeService = {
  isInstalled: vi.fn(),
} as unknown as GrypeService;

const LOCAL_IMAGE_ALT_REPORT_MOCK: LocalImageAlternativeReport = {
  localImage: {
    size: 0,
    vulnerabilities: {} as VulnerabilitiesSummary,
  },
  alternative: {
    size: 0,
    vulnerabilities: {} as VulnerabilitiesSummary,
  },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('AlternativesApiImpl#getAlternatives', () => {
  test('expect getAlternatives result to be properly propagated from AlternativeService', async () => {
    vi.mocked(ALTERNATIVE_SERVICE_MOCK.getAlternatives).mockResolvedValue([LOCAL_IMAGE_ALT_MOCK]);
    const api = new AlternativesApiImpl(ALTERNATIVE_SERVICE_MOCK, GRYPE_SERVICE_MOCK);
    const result = await api.getAlternatives();
    expect(result).toStrictEqual([LOCAL_IMAGE_ALT_MOCK]);
  });

  test('expect getAlternatives error to be propagated', async () => {
    vi.mocked(ALTERNATIVE_SERVICE_MOCK.getAlternatives).mockRejectedValue(new Error('Failed to get alternatives'));
    const api = new AlternativesApiImpl(ALTERNATIVE_SERVICE_MOCK, GRYPE_SERVICE_MOCK);

    await expect(() => {
      return api.getAlternatives();
    }).rejects.toThrow('Failed to get alternatives');
  });
});

describe('AlternativesApiImpl#getAlternativeReport', () => {
  test('expect getAlternativeReport result to be properly propagated from AlternativeService', async () => {
    vi.mocked(ALTERNATIVE_SERVICE_MOCK.getAlternativeReport).mockResolvedValue(LOCAL_IMAGE_ALT_REPORT_MOCK);
    const api = new AlternativesApiImpl(ALTERNATIVE_SERVICE_MOCK, GRYPE_SERVICE_MOCK);
    const result = await api.getAlternativeReport(LOCAL_IMAGE_ALT_MOCK);
    expect(result).toStrictEqual(LOCAL_IMAGE_ALT_REPORT_MOCK);
  });

  test('expect getAlternativeReport error to be propagated', async () => {
    vi.mocked(ALTERNATIVE_SERVICE_MOCK.getAlternativeReport).mockRejectedValue(new Error('Failed to get report'));
    const api = new AlternativesApiImpl(ALTERNATIVE_SERVICE_MOCK, GRYPE_SERVICE_MOCK);

    await expect(() => {
      return api.getAlternativeReport(LOCAL_IMAGE_ALT_MOCK);
    }).rejects.toThrow('Failed to get report');
  });
});
