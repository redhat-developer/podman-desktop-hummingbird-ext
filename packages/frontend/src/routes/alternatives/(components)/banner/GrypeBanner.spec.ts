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
import { render, screen, fireEvent } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import GrypeBanner from './GrypeBanner.svelte';
import { routingAPI } from '/@/api/client';

vi.mock(import('/@/api/client'), () => ({
  routingAPI: {
    navigateToCatalog: vi.fn(),
    readRoute: vi.fn(),
  },
}));

test('Expect that GrypeBanner button calls navigateToCatalog', async () => {
  render(GrypeBanner);

  const button = screen.getByRole('button', { name: 'Check catalog' });
  expect(button).toBeInTheDocument();

  await fireEvent.click(button);

  expect(routingAPI.navigateToCatalog).toHaveBeenCalledWith('grype');
});
