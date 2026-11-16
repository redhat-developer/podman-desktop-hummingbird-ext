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
import { RunnerOptions, expect, test, waitForPodmanMachineStartup } from '@podman-desktop/tests-playwright';
import { HummingbirdNavigationBar } from './model/hummingbird-navigation-bar';
import {
  cleanupRawVideoFiles,
  deleteImageIfExists,
  ensureHummingbirdIsRemoved,
  handleWebview,
  installHummingbirdExtensionIfNeeded,
  pullImageIfNeeded,
} from './utility/hummingbird-test-utils';

// Local image with a known Hummingbird alternative (see packages/backend/src/assets/alt.json).
// The alpine tag keeps the pull small; alternatives are matched on the repository only.
const localImageReference = 'docker.io/library/nginx:alpine';

// Opt in locally with SAVE_TRACES_ON_PASS=true. Keep off in CI by default.
const saveArtifactsOnPass = process.env.SAVE_TRACES_ON_PASS === 'true';

let page: Page;
let webview: Page;
// Cleanup must only remove what this spec file installed / pulled itself.
let hummingbirdInstalledBySpec = false;
let localImagePulledBySpec = false;

test.use({
  runnerOptions: new RunnerOptions({
    customFolder: 'hummingbird-tests-pd',
    customOutputFolder: 'tests/output',
    autoUpdate: false,
    autoCheckUpdates: false,
    saveTracesOnPass: saveArtifactsOnPass,
    saveVideosOnPass: saveArtifactsOnPass,
  }),
});

test.beforeAll(async ({ runner, welcomePage, page: mainPage }) => {
  // Extends the timeout of this hook (Podman machine startup can be slow) and of the
  // subsequent hooks and tests.
  test.setTimeout(300_000);
  runner.setVideoAndTraceName('hummingbird-alternatives');
  await welcomePage.handleWelcomePage(true);
  await expect(welcomePage.skipOnBoarding).toBeHidden();
  // Listing alternatives and pulling images requires a running container provider connection.
  await waitForPodmanMachineStartup(mainPage);
});

// Playwright runs this hook even if the tests fail, after recording the failure,
// so runner.close() retains its diagnostic artifacts.
test.afterAll(async ({ runner }) => {
  const videoAndTraceName = runner.getVideoAndTraceName();
  await runner.close();
  // The webview guest windows leave orphaned raw video files behind.
  cleanupRawVideoFiles('tests/output', videoAndTraceName);
});

test.describe.serial('Hummingbird alternatives', { tag: ['@smoke', '@alternatives'] }, () => {
  test.beforeAll(async ({ navigationBar }) => {
    hummingbirdInstalledBySpec = await installHummingbirdExtensionIfNeeded(navigationBar);
  });

  test.afterAll(async ({ navigationBar }) => {
    if (localImagePulledBySpec) {
      await deleteImageIfExists(navigationBar, localImageReference);
    }
    if (hummingbirdInstalledBySpec) {
      await ensureHummingbirdIsRemoved(navigationBar);
    }
  });

  test('Open the Alternatives page from the webview navigation', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.heading).toBeVisible();

    // Depending on the images already present on the engine, the page either shows the
    // empty screen or the alternatives table.
    await expect(alternativesPage.noAlternativesScreen.or(alternativesPage.table)).toBeVisible({
      timeout: 60_000,
    });
  });

  test('Alternatives page lists local images with a Hummingbird alternative', async ({ runner, navigationBar }) => {
    // Pull a local image that has a Hummingbird alternative (docker.io/library/nginx -> nginx).
    localImagePulledBySpec = await pullImageIfNeeded(navigationBar, localImageReference);

    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.table).toBeVisible({ timeout: 60_000 });
    await expect(alternativesPage.getImageRow('nginx')).toBeVisible();
  });

  test('Analyze stays disabled without the Grype extension', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    // Without the Grype extension the page advertises it and the analysis cannot run.
    await expect(alternativesPage.grypeBanner).toBeVisible({ timeout: 60_000 });
    await expect(alternativesPage.checkCatalogButton).toBeVisible();
    await expect(alternativesPage.analyzeButton).toBeDisabled();
  });
});
