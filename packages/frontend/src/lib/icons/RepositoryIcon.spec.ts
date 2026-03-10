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
import { describe, expect, test, vi } from 'vitest';
import RepositoryIcon from './RepositoryIcon.svelte';
import * as colorSchemeState from '/@/states/color-scheme.svelte';

vi.mock(
  import('/@/states/color-scheme.svelte'),
  () =>
    ({
      colorScheme: {
        theme: 'dark',
      },
    }) as unknown as typeof colorSchemeState,
);

describe('RepositoryIcon', () => {
  test('should render with dark theme color', async () => {
    vi.mocked(colorSchemeState.colorScheme).theme = 'dark';

    const { container } = render(RepositoryIcon);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
    // Dark theme color is #6A4AB2
    expect(paths[0]).toHaveAttribute('fill', '#6A4AB2');
    expect(paths[1]).toHaveAttribute('fill', '#B393FA');
  });

  test('should render with light theme color', async () => {
    vi.mocked(colorSchemeState.colorScheme).theme = 'light';

    const { container } = render(RepositoryIcon);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
    // Light theme color is #7E44FF
    expect(paths[0]).toHaveAttribute('fill', '#7E44FF');
    expect(paths[1]).toHaveAttribute('fill', '#7E44FF');
  });
});
