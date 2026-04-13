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

import ActionColumn from './ActionColumn.svelte';
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';
import type { AlternativeRow } from '/@/routes/alternatives/(components)/row';
import { goto } from '$app/navigation';

vi.mock(import('$app/navigation'));

beforeEach(() => {
  vi.resetAllMocks();
});

test('should display info icon button for alternative image row', () => {
  const alternativeRow: AlternativeRow = {
    name: 'nginx:latest',
    localImage: {
      id: 'sha256:abc123',
      engineId: 'podman',
      name: 'nginx',
      tag: 'latest',
      size: 1024000,
      architecture: 'amd64',
      containers: [],
    },
    alternative: {
      name: 'nginx',
      latest_tag: '1.21',
    },
    report: Promise.resolve({} as LocalImageAlternativeReport),
  } as unknown as AlternativeRow;

  const { getByTitle } = render(ActionColumn, { object: alternativeRow });

  const button = getByTitle('Open Image Report Details');
  expect(button).toBeInTheDocument();
});

test('should display clone icon button for container row', () => {
  const containerRow = {
    name: 'my-container',
    id: 'container123',
    engineId: 'podman',
    imageId: 'sha256:abc123',
  };

  const { getByTitle } = render(ActionColumn, { object: containerRow });

  const button = getByTitle('Clone Container');
  expect(button).toBeInTheDocument();
});

test('should navigate to image report when info button is clicked', async () => {
  const alternativeRow = {
    name: 'nginx:latest',
    localImage: {
      id: 'sha256:abc123',
      engineId: 'podman',
      name: 'nginx',
      tag: 'latest',
      size: 1024000,
      architecture: 'amd64',
      containers: [],
    },
    alternative: {
      name: 'nginx',
      latest_tag: '1.21',
    },
    report: Promise.resolve({} as LocalImageAlternativeReport),
  } as unknown as AlternativeRow;

  const { getByTitle } = render(ActionColumn, { object: alternativeRow });

  const button = getByTitle('Open Image Report Details');
  await fireEvent.click(button);

  expect(goto).toHaveBeenCalledWith('/images/podman/sha256:abc123/report');
});

test('should navigate to clone container when clone button is clicked', async () => {
  const containerRow = {
    name: 'my-container',
    id: 'container123',
    engineId: 'podman',
    imageId: 'sha256:abc123',
  };

  const { getByTitle } = render(ActionColumn, { object: containerRow });

  const button = getByTitle('Clone Container');
  await fireEvent.click(button);

  expect(goto).toHaveBeenCalledWith('/containers/podman/container123/clone');
});
