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
import ReportBanner from './ReportBanner.svelte';

test('Expect that ReportBanner displays CVE reduction and size reduction info', async () => {
  render(ReportBanner, {
    cveReductionCount: 15,
    cveReductionPercent: 75,
    sizeReductionPercent: 40,
  });

  expect(screen.getByText('-15')).toBeInTheDocument();
  expect(screen.getByText('75%')).toBeInTheDocument();
  expect(screen.getByText('-40%')).toBeInTheDocument();
  expect(screen.getByText('Hardened Alternative Found!')).toBeInTheDocument();
});

test('Expect that ReportBanner does not display CVE info when not provided', async () => {
  render(ReportBanner, {
    sizeReductionPercent: 40,
  });

  expect(screen.queryByText('CVEs')).not.toBeInTheDocument();
  expect(screen.getByText('-40%')).toBeInTheDocument();
});
