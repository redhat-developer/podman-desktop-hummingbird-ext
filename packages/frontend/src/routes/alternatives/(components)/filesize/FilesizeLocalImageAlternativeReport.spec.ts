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

import FilesizeLocalImageAlternativeReport from './FilesizeLocalImageAlternativeReport.svelte';
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';

test('should display local and alternative sizes', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 100_000_000, // 100 MB
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
    alternative: {
      size: 50_000_000, // 50 MB
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
  };

  render(FilesizeLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('100 MB')).toBeInTheDocument();
  expect(screen.getByText('50 MB')).toBeInTheDocument();
});

test('should display size reduction percentage and saved amount', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 100_000_000, // 100 MB
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
    alternative: {
      size: 25_000_000, // 25 MB
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
  };

  render(FilesizeLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('-75% smaller')).toBeInTheDocument();
  expect(screen.getByText('(75 MB saved)')).toBeInTheDocument();
});

test('should display "Same size" when sizes are equal', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 100_000_000,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
    alternative: {
      size: 100_000_000,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
  };

  render(FilesizeLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('Same size')).toBeInTheDocument();
});

test('should display "Larger" when alternative is bigger', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 50_000_000,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
    alternative: {
      size: 100_000_000,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
  };

  render(FilesizeLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('Larger')).toBeInTheDocument();
});

test('should round reduction percentage', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: 3_000_000, // 3 MB
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
    alternative: {
      size: 1_000_000, // 1 MB
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
  };

  render(FilesizeLocalImageAlternativeReport, { object: report });

  // (3-1)/3 * 100 = 66.666... which should round to 67
  expect(screen.getByText('-67% smaller')).toBeInTheDocument();
});

test('should display "-" for invalid sizes', () => {
  const report: LocalImageAlternativeReport = {
    localImage: {
      size: NaN,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
    alternative: {
      size: 100_000_000,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        negligible: 0,
        unknown: 0,
        total: 0,
      },
    },
  };

  render(FilesizeLocalImageAlternativeReport, { object: report });

  expect(screen.getByText('-')).toBeInTheDocument();
});
