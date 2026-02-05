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

import { test, vi, beforeEach, expect, describe } from 'vitest';
import { QuayIOService } from './quay-io-service';
import type { RepositoriesResponse } from '@podman-desktop/extension-hummingbird-core-api';
import { ZodError } from 'zod';

const FETCH_MOCK: typeof fetch = vi.fn();
const RESPONSE_MOCK: Response = {
  json: vi.fn(),
  text: vi.fn(),
  clone: vi.fn(),
  ok: true,
  headers: new Headers(),
  url: '/foo',
  status: 200,
  // eslint-disable-next-line no-null/no-null
  body: null,
  blob: vi.fn(),
  redirected: false,
  statusText: 'ok',
  type: 'default',
  bodyUsed: false,
  formData: vi.fn(),
  bytes: vi.fn(),
  arrayBuffer: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(FETCH_MOCK).mockResolvedValue(RESPONSE_MOCK);
});

describe('listRepos', () => {
  test('expect custom fetch to be used', async () => {
    vi.mocked(RESPONSE_MOCK.json).mockResolvedValue({
      repositories: [],
    } as RepositoriesResponse);

    const quay = new QuayIOService({
      fetch: FETCH_MOCK,
    });
    const response = await quay.listRepos({ organisation: 'hummingbird' });
    expect(response.repositories).toHaveLength(0);

    expect(FETCH_MOCK).toHaveBeenCalledExactlyOnceWith(
      'https://quay.io/api/v1/repository?public=true&namespace=hummingbird&last_modified=true',
      expect.anything(),
    );
  });

  test('expect malformed response to throw a ZodError', async () => {
    vi.mocked(RESPONSE_MOCK.json).mockResolvedValue({
      foo: 'bar',
    });

    const quay = new QuayIOService({
      fetch: FETCH_MOCK,
    });

    await expect(() => {
      return quay.listRepos({ organisation: 'hummingbird' });
    }).rejects.toThrowError(ZodError);
  });
});
