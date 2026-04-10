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
import type { Extension } from '@podman-desktop/api';
import { extensions as extensionsAPI } from '@podman-desktop/api';
import type { GrypeExtensionApi, grype } from '@podman-desktop/grype-extension-api';

import { beforeEach, vi, test, expect, describe } from 'vitest';
import { GrypeService } from '/@/services/scanners/grype-service';

const GRYPE_EXTENSION_API_MOCK: GrypeExtensionApi = {} as GrypeExtensionApi;

beforeEach(() => {
  vi.resetAllMocks();
});

function getGrypeService(): GrypeService {
  return new GrypeService();
}

test('should return grype extension exports when extension exists', () => {
  const extensionMock: Extension<GrypeExtensionApi> = {
    exports: GRYPE_EXTENSION_API_MOCK,
  } as unknown as Extension<GrypeExtensionApi>;

  vi.mocked(extensionsAPI.getExtension).mockReturnValue(extensionMock);

  const service = getGrypeService();
  const result = service['getGrypeAPI']();

  expect(result).toStrictEqual(GRYPE_EXTENSION_API_MOCK);
  expect(extensionsAPI.getExtension).toHaveBeenCalledWith('podman-desktop.grype');
});

test('should throw error when extension is undefined', () => {
  vi.mocked(extensionsAPI.getExtension).mockReturnValue(undefined);

  const service = getGrypeService();

  expect(() => service['getGrypeAPI']()).toThrowError('cannot find the grype extension');
});

describe('GrypeService#toVulnerabilitySummary', () => {
  test('should count vulnerabilities by severity', () => {
    const mockDocument: grype.Document = {
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
        {
          vulnerability: {
            severity: 'high',
          },
        },
        {
          vulnerability: {
            severity: 'medium',
          },
        },
        {
          vulnerability: {
            severity: 'low',
          },
        },
        {
          vulnerability: {
            severity: 'unknown',
          },
        },
      ],
    } as grype.Document;

    const service = getGrypeService();
    const result = service.toVulnerabilitySummary(mockDocument);

    expect(result).toStrictEqual({
      critical: 1,
      high: 2,
      medium: 1,
      low: 1,
      negligible: 0,
      unknown: 1,
      total: 6,
    });
  });
});
