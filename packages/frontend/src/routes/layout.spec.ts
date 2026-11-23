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
import type { LoadEvent } from '@sveltejs/kit';
import { load } from './+layout';
import { getRouterState } from '#api/client.js';

vi.mock(import('#api/client.js'));

beforeEach(() => {
  vi.resetAllMocks();
});

async function callLoad(url: string): Promise<unknown> {
  return load({
    url: new URL(url),
    untrack: <T>(fn: () => T): T => fn(),
  } as unknown as Parameters<typeof load>[0] & LoadEvent);
}

test('no pending route should not redirect', async () => {
  vi.mocked(getRouterState).mockResolvedValue({ url: '/' });

  await expect(callLoad('http://localhost/alternatives')).resolves.toBeUndefined();
});

test('pending route different from the current one should redirect', async () => {
  vi.mocked(getRouterState).mockResolvedValue({ url: '/images/podman/sha256:abc/report?image=nginx' });

  await expect(callLoad('http://localhost/')).rejects.toMatchObject({
    status: 307,
    location: '/images/podman/sha256:abc/report?image=nginx',
  });
});

test('pending route matching the current one should not redirect', async () => {
  vi.mocked(getRouterState).mockResolvedValue({ url: '/alternatives' });

  await expect(callLoad('http://localhost/alternatives')).resolves.toBeUndefined();
});

test('url should only be read inside untrack, so the root load does not re-run on every navigation', async () => {
  vi.mocked(getRouterState).mockResolvedValue({ url: '/alternatives' });

  // mimic SvelteKit's tracked url: reading these properties outside untrack registers a dependency
  let untracking = false;
  let tracked = false;
  const url = new Proxy(new URL('http://localhost/'), {
    get(target, key): unknown {
      if (['href', 'pathname', 'search', 'toString', 'toJSON'].includes(String(key)) && !untracking) tracked = true;
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const untrack = <T>(fn: () => T): T => {
    untracking = true;
    try {
      return fn();
    } finally {
      untracking = false;
    }
  };

  await expect(load({ url, untrack } as unknown as Parameters<typeof load>[0] & LoadEvent)).rejects.toMatchObject({
    status: 307,
    location: '/alternatives',
  });
  expect(tracked).toBe(false);
});
