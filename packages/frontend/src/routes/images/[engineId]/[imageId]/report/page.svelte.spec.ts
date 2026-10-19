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

import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { OptimisationReport } from '@podman-desktop/extension-hummingbird-core-api';
import Page from './+page.svelte';

vi.mock(import('$app/navigation'));
vi.mock(import('#api/client.js'));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('when grype is not installed', () => {
  test('should display install prompt', () => {
    const { getByLabelText } = render(Page, {
      data: {
        engineId: 'podman',
        image: 'nginx:latest',
        isGrypeInstalled: false,
        report: new Promise<OptimisationReport>(vi.fn()),
      },
      params: {
        engineId: 'podman',
        imageId: 'sha256:abc123',
      },
    });

    const emptyScreen = getByLabelText('You need to install Grype to use this feature');
    expect(emptyScreen).toBeInTheDocument();
  });

  test('should render the ExtensionBanner', () => {
    const { getByLabelText } = render(Page, {
      data: {
        engineId: 'podman',
        image: 'nginx:latest',
        isGrypeInstalled: false,
        report: new Promise<OptimisationReport>(vi.fn()),
      },
      params: {
        engineId: 'podman',
        imageId: 'sha256:abc123',
      },
    });

    const banner = getByLabelText('Grype');
    expect(banner).toBeInTheDocument();
  });
});

describe('when grype is installed', () => {
  test('should show loading text while report is pending', () => {
    const { getByText } = render(Page, {
      data: {
        engineId: 'podman',
        image: 'nginx:latest',
        isGrypeInstalled: true,
        report: new Promise<OptimisationReport>(vi.fn()),
      },
      params: {
        engineId: 'podman',
        imageId: 'sha256:abc123',
      },
    });

    expect(getByText('Loading...')).toBeInTheDocument();
  });

  test('should show error screen when report promise rejects', async () => {
    const { getByLabelText } = render(Page, {
      data: {
        engineId: 'podman',
        image: 'nginx:latest',
        isGrypeInstalled: true,
        report: Promise.reject(new Error('Something went wrong')),
      },
      params: {
        engineId: 'podman',
        imageId: 'sha256:abc123',
      },
    });

    const errorScreen = await vi.waitFor(() => getByLabelText('Error loading optimisation report'));
    expect(errorScreen).toBeInTheDocument();
  });
});
