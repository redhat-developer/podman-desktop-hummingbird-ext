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
import { expect, test, describe, beforeEach, vi } from 'vitest';
import { CoreApiImpl } from './core-api-impl';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('CoreApiImpl#getCoreVersion', () => {
  test('should return a valid parsed version', async () => {
    const api = new CoreApiImpl();
    const result = await api.getCoreVersion();

    expect(result.major).toBeTypeOf('number');
    expect(result.minor).toBeTypeOf('number');
    expect(result.patch).toBeTypeOf('number');
  });

  test('should return version with expected semver components', async () => {
    const api = new CoreApiImpl();
    const result = await api.getCoreVersion();

    expect(result.major).toBeGreaterThanOrEqual(1);
    expect(result.minor).toBeGreaterThanOrEqual(0);
    expect(result.patch).toBeGreaterThanOrEqual(0);
  });
});
