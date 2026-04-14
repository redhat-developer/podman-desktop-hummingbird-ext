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
import ReportComparison from './ReportComparison.svelte';

test('Expect that ReportComparison displays comparison info', async () => {
  render(ReportComparison, {
    cveReductionPercent: 75,
    sizeReductionPercent: 40,
    altCveCount: 5,
    imageCveCount: 20,
    altSize: 60 * 1024 * 1024,
    imageSize: 100 * 1024 * 1024,
  });

  expect(screen.getByText('75% Fewer Vulnerabilities')).toBeInTheDocument();
  expect(screen.getByText('40% Smaller Image Size')).toBeInTheDocument();
  expect(screen.getByText('Only 5 CVE vs 20')).toBeInTheDocument();
  expect(screen.getByText('Try the Alternate Base Image')).toBeInTheDocument();
});
