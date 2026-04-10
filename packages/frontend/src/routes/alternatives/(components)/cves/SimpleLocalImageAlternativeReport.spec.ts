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
import { expect, test } from 'vitest';

import SimpleLocalImageAlternativeReport from './SimpleLocalImageAlternativeReport.svelte';
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';

test('should display local and alternative vulnerability counts', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 0,
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
      size: 0,
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

  render(SimpleLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('50')).toBeInTheDocument();
  expect(screen.getByText('13')).toBeInTheDocument();
});

test('should display CVE reduction count and percentage', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 100,
      },
    },
    alternative: {
      size: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 25,
      },
    },
  };

  render(SimpleLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('75 CVEs eliminated')).toBeInTheDocument();
  expect(screen.getByText('(75%)')).toBeInTheDocument();
});

test('should display "No change" when reduction is zero', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 10,
      },
    },
    alternative: {
      size: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 10,
      },
    },
  };

  render(SimpleLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('No change')).toBeInTheDocument();
});

test('should round reduction percentage', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 3,
      },
    },
    alternative: {
      size: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 1,
      },
    },
  };

  render(SimpleLocalImageAlternativeReport, { object: report });

  // (3-1)/3 * 100 = 66.666... which should round to 67
  expect(screen.getByText('2 CVEs eliminated')).toBeInTheDocument();
  expect(screen.getByText('(67%)')).toBeInTheDocument();
});
