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
import { expect, test, vi, beforeEach } from 'vitest';
import type { WebviewPanel, window as windowsApi } from '@podman-desktop/api';
import { Uri } from '@podman-desktop/api';
import { WebviewService } from './webview-service';
import { readFile } from 'node:fs/promises';

vi.mock(import('node:fs/promises'));

const windowMock: typeof windowsApi = {
  createWebviewPanel: vi.fn(),
} as unknown as typeof windowsApi;

function getWebviewService(): WebviewService {
  return new WebviewService({
    window: windowMock,
    extensionUri: {} as unknown as Uri,
  });
}

const webviewPanelMock: WebviewPanel = {
  webview: {
    html: undefined,
  },
  dispose: vi.fn(),
} as unknown as WebviewPanel;

const mockedHTML = '<div>Hello</div>';

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(windowMock.createWebviewPanel).mockReturnValue(webviewPanelMock);
  vi.mocked(Uri.joinPath).mockReturnValue({
    fsPath: '',
  } as unknown as Uri);

  vi.mocked(readFile).mockResolvedValue(mockedHTML);
});

test('non-init service should throw an error trying to access webview', async () => {
  const webview = getWebviewService();

  expect(() => {
    webview.getPanel();
  }).toThrowError('webview panel is not initialized.');
});

test('expect init to define html content', async () => {
  const webview = getWebviewService();
  await webview.init();

  const panel = webview.getPanel();
  expect(panel.webview.html).toBe(mockedHTML);
});

test('expect dispose to dispose webview', async () => {
  const webview = getWebviewService();
  await webview.init();

  webview.dispose();
  expect(webviewPanelMock.dispose).toHaveBeenCalled();
});
