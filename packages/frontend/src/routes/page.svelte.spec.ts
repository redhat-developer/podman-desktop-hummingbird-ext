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

import '@testing-library/jest-dom/vitest';

import { render, within } from '@testing-library/svelte';

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Repository } from '@podman-desktop/extension-hummingbird-core-api';
import Page from './+page.svelte';
import { invalidateAll } from '$app/navigation';

vi.mock(import('$app/navigation'));

const REPOSITORIES: Array<Repository> = [{
  name: 'curl',
  namespace: 'hummingbird',
  is_public: true,
  last_modified: new Date().getTime() / 1000,
  description: 'Dummy desc',
}];

beforeEach(() => {
  vi.resetAllMocks();
});

describe('error', () => {
  const ERROR_MOCK = new Error('Something went wrong with network');
  const REJECTED_PROMISE = Promise.reject<Array<Repository>>(ERROR_MOCK);

  test('promise date reject should display empty screen with error', async () => {
    const { getByLabelText } = render(Page, {
      data: {
        repositories: REJECTED_PROMISE,
      },
      params: {},
    });

    const emptyScreen = await vi.waitFor(() => {
      return getByLabelText('Error while fetching the Hummingbird catalog');
    });
    const element = within(emptyScreen).getByText(ERROR_MOCK.message);
    expect(element).toBeInTheDocument();
  });

  test('retry button should call invalidateAll', async () => {
    const { getByLabelText } = render(Page, {
      data: {
        repositories: REJECTED_PROMISE,
      },
      params: {},
    });

    const emptyScreen = await vi.waitFor(() => {
      return getByLabelText('Error while fetching the Hummingbird catalog');
    });
    const retryBtn = within(emptyScreen).getByRole('button', { name: 'Retry' });
    retryBtn.click();

    await vi.waitFor(() => {
      expect(invalidateAll).toHaveBeenCalledOnce();
    });
  });
});
