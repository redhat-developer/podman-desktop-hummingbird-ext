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
import type { Disposable, NavigateToHistoryEvent, WebviewPanel } from '@podman-desktop/api';
import { navigation } from '@podman-desktop/api';
import { RoutingService } from '/@/services/routing-service';
import type { WebviewService } from '/@/services/webview-service';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';

const panelMock = {
  reveal: vi.fn(),
  webview: {
    postMessage: vi.fn(),
  },
} as unknown as WebviewPanel;

const webviewServiceMock = {
  getPanel: vi.fn(),
} as unknown as WebviewService;

const historyListenerMock: Disposable = { dispose: vi.fn() };

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(webviewServiceMock.getPanel).mockReturnValue(panelMock);
  vi.mocked(panelMock.webview.postMessage).mockResolvedValue(true);
  vi.mocked(navigation.onDidNavigateToHistoryEntry).mockReturnValue(historyListenerMock);
});

async function getRoutingService(): Promise<RoutingService> {
  const routing = new RoutingService(webviewServiceMock);
  await routing.init();
  return routing;
}

function navigateToHistoryEntry(id: string): void {
  const listener = vi.mocked(navigation.onDidNavigateToHistoryEntry).mock.calls[0][0];
  listener({ id } as NavigateToHistoryEvent);
}

test('pushHistory should push an entry in Podman Desktop history', async () => {
  const routing = await getRoutingService();
  routing.pushHistory('/alternatives', 'Alternatives');

  expect(navigation.pushHistoryEntry).toHaveBeenCalledWith({ id: '/alternatives', label: 'Alternatives' });
});

test('navigating to a history entry should set the route, notify the webview and reveal it', async () => {
  const routing = await getRoutingService();
  navigateToHistoryEntry('/alternatives');

  expect(panelMock.webview.postMessage).toHaveBeenCalledWith({
    id: Messages.ROUTE_UPDATE,
    body: '/alternatives',
  });
  expect(panelMock.reveal).toHaveBeenCalled();
  expect(routing.read()).toBe('/alternatives');
});

test('read should reset the route', async () => {
  const routing = await getRoutingService();
  navigateToHistoryEntry('/alternatives');

  expect(routing.read()).toBe('/alternatives');
  expect(routing.read()).toBeUndefined();
});

test('dispose should dispose the history listener', async () => {
  const routing = await getRoutingService();
  routing.dispose();

  expect(historyListenerMock.dispose).toHaveBeenCalled();
});
