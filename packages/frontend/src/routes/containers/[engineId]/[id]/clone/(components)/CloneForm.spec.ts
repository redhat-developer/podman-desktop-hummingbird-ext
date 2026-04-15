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
import { render, fireEvent } from '@testing-library/svelte';
import { expect, test, vi, beforeEach } from 'vitest';
import CloneForm from './CloneForm.svelte';
import { containerAPI } from '/@/api/client';
import type { LocalContainer, ImageSummary, LocalImage } from '@podman-desktop/extension-hummingbird-core-api';

vi.mock(import('/@/api/client'), () => ({
  containerAPI: {
    clone: vi.fn(),
    getContainer: vi.fn(),
  },
  routingAPI: {
    navigateToContainerDetails: vi.fn(),
    navigateToCatalog: vi.fn(),
    readRoute: vi.fn(),
  },
}));

const CONTAINER = {
  id: 'container-id',
  engineId: 'podman',
  name: 'my-container',
} as unknown as LocalContainer;

const ALTERNATIVE = {
  name: 'nginx-hardened',
  latest_tag: '1.2.3',
} as unknown as ImageSummary;

const LOCAL_IMAGE = {
  name: 'nginx',
  tag: 'latest',
} as unknown as Omit<LocalImage, 'containers'>;

const CLOSE_FN = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
});

test('Expect that clicking Clone calls containerAPI.clone', async () => {
  vi.mocked(containerAPI.clone).mockResolvedValue({
    Id: 'new-container-id',
    engineId: 'podman',
  });

  const { getByRole, getByText } = render(CloneForm, {
    container: CONTAINER,
    alternative: ALTERNATIVE,
    localImage: LOCAL_IMAGE,
    close: CLOSE_FN,
  });

  const cloneButton = getByRole('button', { name: 'Clone' });
  await fireEvent.click(cloneButton);

  expect(containerAPI.clone).toHaveBeenCalledWith(
    'podman',
    'container-id',
    'quay.io/hummingbird/nginx-hardened:1.2.3',
    {
      stopBeforeClone: true,
      name: 'my-container-clone',
    },
  );

  expect(getByText('Container new-cont created')).toBeInTheDocument();
  expect(getByRole('button', { name: 'Open container details' })).toBeInTheDocument();
});

test('Expect that cloning error is displayed', async () => {
  vi.mocked(containerAPI.clone).mockRejectedValue(new Error('Clone failed!'));

  const { getByRole, getByText } = render(CloneForm, {
    container: CONTAINER,
    alternative: ALTERNATIVE,
    localImage: LOCAL_IMAGE,
    close: CLOSE_FN,
  });

  const cloneButton = getByRole('button', { name: 'Clone' });
  await fireEvent.click(cloneButton);

  expect(getByText('Error: Clone failed!')).toBeInTheDocument();
});
