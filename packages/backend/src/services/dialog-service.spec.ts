/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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
import type { InputBoxOptions, TelemetryLogger } from '@podman-desktop/api';
import { window as windowAPI } from '@podman-desktop/api';

import { beforeEach, vi, test, expect } from 'vitest';
import { DialogService } from './dialog-service';

beforeEach(() => {
  vi.resetAllMocks();
});

const TELEMETRY_LOGGER_MOCK: TelemetryLogger = {
  logUsage: vi.fn(),
  onDidChangeEnableStates: vi.fn(),
  isUsageEnabled: true,
  isErrorsEnabled: true,
  logError: vi.fn(),
  dispose: vi.fn(),
};

function getDialogService(): DialogService {
  return new DialogService(TELEMETRY_LOGGER_MOCK);
}

test('expect DialogService#showWarningMessage to use windowApi#showWarningMessage', async () => {
  vi.mocked(windowAPI.showWarningMessage).mockResolvedValue('hello');

  const dialog = getDialogService();
  const result = await dialog.showWarningMessage('foo.bar', 'hello', 'world');
  expect(result).toStrictEqual('hello');

  expect(windowAPI.showWarningMessage).toHaveBeenCalledWith('foo.bar', 'hello', 'world');
});

test('expect DialogService#showInputBox to use windowApi#showInputBox', async () => {
  vi.mocked(windowAPI.showInputBox).mockResolvedValue('hello');
  const options: InputBoxOptions = {
    title: 'Foo title',
  };

  const dialog = getDialogService();
  const result = await dialog.showInputBox(options);
  expect(result).toStrictEqual('hello');

  expect(windowAPI.showInputBox).toHaveBeenCalledWith(options);
});

test('expect DialogService#showInformationMessage to use windowApi#showInformationMessage', async () => {
  vi.mocked(windowAPI.showInformationMessage).mockResolvedValue('hello');

  const dialog = getDialogService();
  const result = await dialog.showInformationMessage('foo.bar', 'hello', 'world');
  expect(result).toStrictEqual('hello');

  expect(windowAPI.showInformationMessage).toHaveBeenCalledWith('foo.bar', 'hello', 'world');
});
