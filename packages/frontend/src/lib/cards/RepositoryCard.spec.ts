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
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ImageSummary, SimpleImageInfo } from '@podman-desktop/extension-hummingbird-core-api';
import RepositoryCard from './RepositoryCard.svelte';

vi.mock(import('/@/api/client'));

const IMAGE_SUMMARY: ImageSummary = {
  name: 'curl',
  architectures: [],
  description: 'A curl image',
  latest_tag: 'latest',
  pull_url: '',
  streams: [],
  tag_count: 1,
  variants: [],
  application_category: '',
  summary: '',
};

const SIMPLE_IMAGE_INFO: SimpleImageInfo = {
  id: 'image1',
  name: 'quay.io/hummingbird/curl',
  connection: { name: 'conn1', providerId: 'podman' },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('RepositoryCard', () => {
  test('should display the image name', async () => {
    const { getByText } = render(RepositoryCard, {
      object: IMAGE_SUMMARY,
      version: { major: 1, minor: 28 },
    });

    expect(getByText('curl')).toBeDefined();
  });

  test('should display the description when provided', async () => {
    const { getByText } = render(RepositoryCard, {
      object: IMAGE_SUMMARY,
      version: { major: 1, minor: 28 },
    });

    expect(getByText('A curl image')).toBeDefined();
  });

  test('should show Run button when version >= 1.29', async () => {
    const { getByRole } = render(RepositoryCard, {
      object: IMAGE_SUMMARY,
      version: { major: 1, minor: 29 },
      pulled: Promise.resolve(SIMPLE_IMAGE_INFO),
    });

    await vi.waitFor(() => {
      expect(getByRole('button', { name: 'Run' })).toBeDefined();
    });
  });

  test('should not show Run button when version < 1.29', async () => {
    const { queryByRole, getByRole } = render(RepositoryCard, {
      object: IMAGE_SUMMARY,
      version: { major: 1, minor: 28 },
      pulled: Promise.resolve(SIMPLE_IMAGE_INFO),
    });

    await vi.waitFor(() => {
      expect(getByRole('button', { name: 'Open' })).toBeDefined();
    });

    expect(queryByRole('button', { name: 'Run' })).toBeNull();
  });

  test('should show Pull button when image is not pulled', async () => {
    const { getByRole } = render(RepositoryCard, {
      object: IMAGE_SUMMARY,
      version: { major: 1, minor: 28 },
      pulled: Promise.resolve(undefined),
    });

    await vi.waitFor(() => {
      expect(getByRole('button', { name: 'Pull' })).toBeDefined();
    });
  });
});
