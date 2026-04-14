/**********************************************************************
 * Copyright (C) 2024 Red Hat, Inc.
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
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import OptimisationReport from './OptimisationReport.svelte';
import type { OptimisationReport as OptimisationReportType } from '@podman-desktop/extension-hummingbird-core-api';

test('Expect that OptimisationReport displays RawReport when alternative is present', async () => {
  const object = {
    image: {
      inspect: {
        RepoTags: ['original-image:latest'],
        Size: 100000000,
        Architecture: 'amd64',
        Created: '2024-01-01T00:00:00Z',
      },
      vulnerabilities: { total: 20, critical: 2, high: 4, medium: 8, low: 6 },
    },
    alternative: {
      image: {
        name: 'alt-image',
        latest_tag: '1.0.0',
      },
      tags: [{ name: '1.0.0', sizes: { amd64: 50000000 } }],
      vulnerabilities: {
        summary: { total: 5, critical: 0, high: 1, medium: 2, low: 2 },
      },
    },
  };

  render(OptimisationReport, { object: object as unknown as OptimisationReportType });

  expect(screen.getByText('alt-image')).toBeInTheDocument();
});

test('Expect that OptimisationReport displays empty screen when no alternative is present', async () => {
  const object = {
    image: {
      inspect: {
        RepoTags: ['original-image:latest'],
        Size: 100000000,
        Architecture: 'amd64',
        Created: '2024-01-01T00:00:00Z',
      },
      vulnerabilities: { total: 20 },
    },
    alternative: undefined,
  };

  render(OptimisationReport, { object: object as unknown as OptimisationReportType });

  expect(screen.getByText('No alternative image found')).toBeInTheDocument();
});
