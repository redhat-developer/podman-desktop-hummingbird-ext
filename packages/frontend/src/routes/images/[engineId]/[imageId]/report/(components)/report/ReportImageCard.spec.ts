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
import ReportImageCard from './ReportImageCard.svelte';

test('Expect that ReportImageCard displays basic info', async () => {
  render(ReportImageCard, {
    title: 'test-image',
    subtitle: 'test-subtitle',
    version: '1.2.3',
    size: '100 MB',
  });

  expect(screen.getByText('test-image')).toBeInTheDocument();
  expect(screen.getByText('test-subtitle')).toBeInTheDocument();
  expect(screen.getByText('1.2.3')).toBeInTheDocument();
  expect(screen.getByText('100 MB')).toBeInTheDocument();
});

test('Expect that ReportImageCard displays reduction info for Hummingbird', async () => {
  render(ReportImageCard, {
    title: 'hummingbird-image',
    subtitle: 'Hummingbird hardened image',
    version: 'latest',
    size: '60 MB',
    sizeReductionPercent: 40,
    isHummingbird: true,
  });

  expect(screen.getByText('(-40%)')).toBeInTheDocument();
});
