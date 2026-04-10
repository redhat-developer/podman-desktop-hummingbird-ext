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
import type { LocalImageAlternative } from '@podman-desktop/extension-hummingbird-core-api';
import Page from './+page.svelte';

const ALTERNATIVES: Array<LocalImageAlternative> = [
  {
    localImage: {
      id: 'image1',
      engineId: 'podman',
      name: 'nginx',
      tag: 'latest',
      size: 1024000,
      architecture: 'amd64',
      containers: [],
    },
    alternative: {
      name: 'nginx-hardened',
      architectures: [],
      description: '',
      latest_tag: '',
      pull_url: '',
      streams: [],
      tag_count: 0,
      variants: [],
      application_category: '',
      summary: '',
    },
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe('error', () => {
  const ERROR_MOCK = new Error('Failed to fetch alternatives');

  test('promise reject should display error screen', async () => {
    const { getByLabelText } = render(Page, {
      data: {
        alternatives: Promise.reject<Array<LocalImageAlternative>>(ERROR_MOCK),
      },
      params: {},
    });

    const emptyScreen = await vi.waitFor(() => {
      return getByLabelText('Error loading alternatives');
    });
    const element = within(emptyScreen).getByText(ERROR_MOCK.message);
    expect(element).toBeDefined();
  });
});

describe('loading', () => {
  test('should display skeleton when alternatives promise is pending', async () => {
    const { getByRole } = render(Page, {
      data: {
        alternatives: new Promise<Array<LocalImageAlternative>>(vi.fn()),
      },
      params: {},
    });

    const skeletons = getByRole('table', { name: 'loading' });
    expect(skeletons).toBeInTheDocument();
  });
});

describe('data', () => {
  test('should display alternatives when promise resolves', async () => {
    const { getByLabelText } = render(Page, {
      data: {
        alternatives: Promise.resolve(ALTERNATIVES),
      },
      params: {},
    });

    await vi.waitFor(() => {
      expect(getByLabelText('nginx')).toBeInTheDocument();
    });
  });

  test('should display empty state when no alternatives found', async () => {
    const { getByLabelText } = render(Page, {
      data: {
        alternatives: Promise.resolve([]),
      },
      params: {},
    });

    await vi.waitFor(() => {
      expect(getByLabelText('No alternatives found')).toBeDefined();
    });
  });
});
