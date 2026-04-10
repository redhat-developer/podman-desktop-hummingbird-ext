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

import { render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';

import CVEReductionCell from './CVEReductionCell.svelte';
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';

test('should display skeleton when promise is pending', () => {
  const { promise } = Promise.withResolvers<LocalImageAlternativeReport>();

  render(CVEReductionCell, { object: promise });

  const skeleton = screen.getByLabelText('CVEs');
  expect(skeleton).toBeInTheDocument();
  expect(skeleton).toHaveAttribute('aria-busy', 'true');
});

test('should display report when promise resolves', async () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      vulnerabilities: {
        critical: 5,
        high: 10,
        medium: 20,
        low: 15,
        negligible: 0,
        unknown: 0,
        total: 50,
      },
    },
    alternative: {
      vulnerabilities: {
        critical: 1,
        high: 2,
        medium: 5,
        low: 5,
        negligible: 0,
        unknown: 0,
        total: 13,
      },
    },
  };

  render(CVEReductionCell, { object: Promise.resolve(report) });

  await vi.waitFor(() => {
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('37 CVEs eliminated')).toBeInTheDocument();
  });
});

test('should display error message when promise rejects', async () => {
  const error = new Error('Failed to scan image');

  render(CVEReductionCell, { object: Promise.reject(error) });

  await vi.waitFor(() => {
    expect(screen.getByText(/Error scanning/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to scan image/)).toBeInTheDocument();
  });
});
