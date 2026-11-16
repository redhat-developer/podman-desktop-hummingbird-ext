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
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import type { Page } from '@playwright/test';
import { RunnerOptions, expect, test } from '@podman-desktop/tests-playwright';
import { HummingbirdNavigationBar } from './model/hummingbird-navigation-bar';
import {
  cleanupRawVideoFiles,
  handleWebview,
  installHummingbirdExtensionIfNeeded,
  pullImageIfNeeded,
  stripImageTag,
  waitForPodmanReady,
} from './utility/hummingbird-test-utils';

// Local image with a known Hummingbird alternative (see packages/backend/src/assets/alt.json).
const localImageReference = 'docker.io/library/nginx:alpine';
const localImageRepo = stripImageTag(localImageReference);

let page: Page;
let webview: Page;

test.use({
  runnerOptions: new RunnerOptions({
    customFolder: 'hummingbird-tests-pd',
    customOutputFolder: 'tests/output',
    autoUpdate: false,
    autoCheckUpdates: false,
    saveTracesOnPass: false,
    saveVideosOnPass: false,
  }),
});

test.beforeAll(async ({ runner, welcomePage, page: mainPage }) => {
  test.setTimeout(300_000); // Podman machine startup can be slow.
  runner.setVideoAndTraceName('hummingbird-alternatives');
  await welcomePage.handleWelcomePage(true);
  await expect(welcomePage.skipOnBoarding).toBeHidden();
  await waitForPodmanReady(mainPage);
});

test.afterAll(async ({ runner }) => {
  const videoAndTraceName = runner.getVideoAndTraceName();
  await runner.close();
  cleanupRawVideoFiles('tests/output', videoAndTraceName);
});

test.describe.serial('Hummingbird alternatives', { tag: ['@smoke', '@alternatives'] }, () => {
  test.beforeAll(async ({ navigationBar }) => {
    test.setTimeout(300_000); // Installing the extension can take a while.
    await installHummingbirdExtensionIfNeeded(navigationBar);
  });

  test('Open the Alternatives page from the webview navigation', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.heading).toBeVisible();
    // Depending on the images already on the engine, either the empty screen or the table.
    await expect(alternativesPage.noAlternativesScreen.or(alternativesPage.table)).toBeVisible({
      timeout: 60_000,
    });
  });

  test('Alternatives page lists local images with a Hummingbird alternative', async ({ runner, navigationBar }) => {
    test.setTimeout(300_000); // Pulls an image over the network.
    await pullImageIfNeeded(navigationBar, localImageReference);

    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.table).toBeVisible({ timeout: 60_000 });
    await expect(alternativesPage.getImageRow(localImageRepo)).toBeVisible();
  });

  test('Analyze stays disabled without the Grype extension', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.grypeBanner).toBeVisible({ timeout: 60_000 });
    await expect(alternativesPage.checkCatalogButton).toBeVisible();
    await expect(alternativesPage.analyzeButton).toBeDisabled();
  });
});
