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

import { render } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import NameColumn from './NameColumn.svelte';
import type { LocalImageAlternativeReport } from '@podman-desktop/extension-hummingbird-core-api';
import type { AlternativeRow } from '/@/routes/alternatives/(components)/row';

test('should display alternative image mapping', () => {
  const alternativeRow: AlternativeRow = {
    name: 'nginx:latest',
    localImage: {
      id: 'sha256:abc123',
      engineId: 'podman',
      name: 'docker.io/library/nginx',
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

  const { getByText } = render(NameColumn, { object: alternativeRow });

  expect(getByText('docker.io/library/nginx:latest')).toBeInTheDocument();
  expect(getByText('quay.io/hummingbird/nginx')).toBeInTheDocument();
});

test('should display container name and ID', () => {
  const containerRow = {
    name: 'my-container',
    id: 'container123456789',
    engineId: 'podman',
    imageID: 'sha256:abc123',
  };

  const { getByText } = render(NameColumn, { object: containerRow });

  expect(getByText('my-container')).toBeInTheDocument();
  expect(getByText('containe')).toBeInTheDocument(); // First 8 chars of ID
});

test('should remove leading slash from container name', () => {
  const containerRow = {
    name: '/my-container',
    id: 'container123456789',
    engineId: 'podman',
    imageID: 'sha256:abc123',
  };

  const { getByText } = render(NameColumn, { object: containerRow });

  expect(getByText('my-container')).toBeInTheDocument();
  expect(getByText('containe')).toBeInTheDocument();
});

test('should truncate container ID to 8 characters', () => {
  const containerRow = {
    name: 'test',
    id: 'abcdefghijklmnop',
    engineId: 'podman',
    imageID: 'sha256:abc123',
  };

  const { getByText } = render(NameColumn, { object: containerRow });

  expect(getByText('abcdefgh')).toBeInTheDocument();
});
