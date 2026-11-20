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
import { beforeEach, expect, test, vi } from 'vitest';
import { load } from './+page';
import { alternativesAPI } from '#api/client.js';
import type { AlternativesApi } from '@podman-desktop/extension-hummingbird-core-api';

vi.mock(import('#api/client.js'), () => ({
  alternativesAPI: {
    isGrypeInstalled: vi.fn(),
    getOptimisationReport: vi.fn(),
  } as unknown as AlternativesApi,
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(alternativesAPI.isGrypeInstalled).mockResolvedValue(true);
  vi.mocked(alternativesAPI.getOptimisationReport).mockReturnValue(new Promise(() => {}));
});

async function callLoad(url: string): Promise<App.PageData> {
  return (await load({
    params: { engineId: 'podman', imageId: 'sha256:abc' },
    url: new URL(url),
  } as unknown as Parameters<typeof load>[0])) as App.PageData;
}

test('label should be the image name', async () => {
  const data = await callLoad('http://localhost/images/podman/sha256:abc/report?image=docker.io%2Flibrary%2Fnginx');
  expect(data.label).toBe('docker.io/library/nginx');
});

test('label should fallback when the image name is missing', async () => {
  const data = await callLoad('http://localhost/images/podman/sha256:abc/report');
  expect(data.label).toBe('Optimisation report');
});
