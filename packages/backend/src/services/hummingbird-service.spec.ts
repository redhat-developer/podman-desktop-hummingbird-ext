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

import { expect, test, vi, beforeEach } from 'vitest';
import { HummingbirdService } from './hummingbird-service';
import { Api } from '@podman-desktop/extension-hummingbird-core-api';
import type {
  DirectoryResponse,
  ErrorResponse,
  HttpResponse,
  ImageSummary,
} from '@podman-desktop/extension-hummingbird-core-api';

vi.mock(import('@podman-desktop/extension-hummingbird-core-api'));

const IMAGES_SUMMARY_MOCK: Array<ImageSummary> = [
  {
    name: 'image1',
    description: 'bar',
    architectures: [],
    latest_tag: '',
    pull_url: '',
    streams: [],
    tag_count: 0,
    variants: [],
  },
];

beforeEach(() => {
  vi.resetAllMocks();

  // vitest is not able to auto mock nested properties
  vi.mocked(Api.prototype).v1 = {
    getImages: vi.fn(),
    getImage: vi.fn(),
    getDetails: vi.fn(),
    getHistory: vi.fn(),
    getReleaseDetails: vi.fn(),
    getReleaseSbom: vi.fn(),
    getReleaseVulnerabilities: vi.fn(),
    getSbom: vi.fn(),
    getTags: vi.fn(),
    getVulnerabilities: vi.fn(),
  };

  vi.mocked(Api.prototype.v1.getImages).mockResolvedValue({
    data: {
      images: IMAGES_SUMMARY_MOCK,
    },
  } as HttpResponse<DirectoryResponse, ErrorResponse>);
});

test('HummingbirdService#getRepositories should call api and return images', async () => {
  const service = new HummingbirdService();
  const repositories = await service.getImages();

  expect(Api.prototype.v1.getImages).toHaveBeenCalledOnce();
  expect(repositories).toEqual(IMAGES_SUMMARY_MOCK);
});

test('HummingbirdService#getRepositories should use cache on second call', async () => {
  const service = new HummingbirdService();

  // First call
  await service.getImages();
  expect(Api.prototype.v1.getImages).toHaveBeenCalledOnce();

  // Second call
  await service.getImages();
  expect(Api.prototype.v1.getImages).toHaveBeenCalledOnce();
});
