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
import {
  RunnerOptions,
  expect,
  isWindows,
  test,
  waitForPodmanMachineStartup,
  waitUntil,
} from '@podman-desktop/tests-playwright';
import { HummingbirdNavigationBar } from './model/hummingbird-navigation-bar';
import {
  cleanupRawVideoFiles,
  deleteImageIfExists,
  ensureGrypeExtensionIsRemoved,
  ensureHummingbirdIsRemoved,
  grypeExtensionHeading,
  grypeExtensionImage,
  grypeExtensionLabel,
  grypeExtensionName,
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
  runner.setVideoAndTraceName('hummingbird-grype');
  await welcomePage.handleWelcomePage(true);
  await expect(welcomePage.skipOnBoarding).toBeHidden();
  // Pulling images and scanning them requires a running container provider connection.
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

test.describe.serial('Hummingbird Grype integration', { tag: ['@smoke', '@grype'] }, () => {
  // The Grype extension scanning flow is only exercised on Windows.
  test.skip(!isWindows, 'Grype scanning tests are only supported on Windows');

  test.beforeAll(async ({ navigationBar }) => {
    await installHummingbirdExtensionIfNeeded(navigationBar);
    // The analysis needs a local image with a Hummingbird alternative.
    await pullImageIfNeeded(navigationBar, localImageReference);
  });

  test.afterAll(async ({ navigationBar }) => {
    await ensureGrypeExtensionIsRemoved(navigationBar);
    await deleteImageIfExists(navigationBar, localImageReference);
    await ensureHummingbirdIsRemoved(navigationBar);
  });

  test('Install the Grype extension', async ({ navigationBar }) => {
    const extensionsPage = await navigationBar.openExtensions();
    await expect(extensionsPage.header).toBeVisible();

    if (await extensionsPage.extensionIsInstalled(grypeExtensionLabel)) return;

    await extensionsPage.installExtensionFromOCIImage(grypeExtensionImage);
    await expect
      .poll(async () => await extensionsPage.extensionIsInstalled(grypeExtensionLabel), { timeout: 60_000 })
      .toBeTruthy();

    const details = await extensionsPage.openExtensionDetails(
      grypeExtensionName,
      grypeExtensionLabel,
      grypeExtensionHeading,
    );
    await expect(details.heading).toBeVisible();
    await expect(details.disableButton).toBeEnabled({ timeout: 60_000 });
  });

  test('Hummingbird detects the Grype extension', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.table).toBeVisible({ timeout: 60_000 });

    // With Grype installed the banner disappears and the analysis becomes available.
    await expect(alternativesPage.grypeBanner).not.toBeVisible();
    await expect(alternativesPage.analyzeButton).toBeEnabled({ timeout: 60_000 });
  });

  test('Analyze local images with Grype', async ({ runner }) => {
    // Covers the whole scanning flow: Syft/Grype binaries installation, SBOM generation,
    // vulnerability scan of the local image and comparison with the Hummingbird alternative.
    test.setTimeout(900_000);

    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.analyzeButton).toBeEnabled({ timeout: 60_000 });
    await alternativesPage.analyzeButton.click();

    // The CVEs / Size Reduction columns appear as soon as the analysis starts.
    await expect(alternativesPage.cvesColumnHeader).toBeVisible({ timeout: 30_000 });
    await expect(alternativesPage.sizeReductionColumnHeader).toBeVisible({ timeout: 30_000 });

    // On first use the Grype extension asks to install the Syft and Grype binaries, and then
    // possibly to install them system-wide. These dialogs are rendered by the Podman Desktop
    // shell on the main page — not inside the webview — and the analysis only proceeds once
    // they are answered.
    const reportCell = alternativesPage.getReportCell('nginx');
    const reportDone = async (): Promise<boolean> =>
      await reportCell
        .innerText()
        .then(text => /\d/.test(text))
        .catch(() => false);

    await waitUntil(
      async () => {
        if (await reportDone()) return true;

        const binariesDialog = page.getByRole('dialog').filter({ hasText: 'install Syft and Grype binaries' });
        const systemWideDialog = page.getByRole('dialog').filter({ hasText: 'system-wide' });
        if (await binariesDialog.isVisible().catch(() => false)) {
          await binariesDialog.getByRole('button', { name: 'Yes', exact: true }).click();
        } else if (await systemWideDialog.isVisible().catch(() => false)) {
          // Keep the binaries in the extension storage.
          await systemWideDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        }
        return false;
      },
      {
        timeout: 600_000,
        diff: 1_000,
        message: 'Vulnerability analysis did not complete (no report rendered for the nginx row)',
      },
    );

    // The report cell shows the "local CVEs -> alternative CVEs" counts once the scan is done.
    await expect(reportCell).toContainText(/\d/);
    await expect(alternativesPage.getImageRow('nginx').getByText('Error scanning')).not.toBeVisible();
  });
});
