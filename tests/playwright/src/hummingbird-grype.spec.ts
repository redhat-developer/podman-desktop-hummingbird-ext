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
import { RunnerOptions, expect, isWindows, test, waitUntil } from '@podman-desktop/tests-playwright';
import { HummingbirdNavigationBar } from './model/hummingbird-navigation-bar';
import {
  cleanupRawVideoFiles,
  didSuiteInstallGrype,
  ensureGrypeExtensionIsRemoved,
  grypeExtensionHeading,
  grypeExtensionLabel,
  grypeExtensionName,
  handleWebview,
  installGrypeExtensionIfNeeded,
  installHummingbirdExtensionIfNeeded,
  pullImageIfNeeded,
  stripImageTag,
  waitForPodmanReady,
} from './utility/hummingbird-test-utils';

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
  runner.setVideoAndTraceName('hummingbird-grype');
  await welcomePage.handleWelcomePage(true);
  await expect(welcomePage.skipOnBoarding).toBeHidden();
  await waitForPodmanReady(mainPage);
});

test.afterAll(async ({ runner }) => {
  const videoAndTraceName = runner.getVideoAndTraceName();
  await runner.close();
  cleanupRawVideoFiles('tests/output', videoAndTraceName);
});

test.describe.serial('Hummingbird Grype integration', { tag: ['@smoke', '@grype'] }, () => {
  // The Grype extension scanning flow is only exercised on Windows.
  // eslint-disable-next-line sonarjs/no-skipped-tests
  test.skip(!isWindows, 'Grype scanning tests are only supported on Windows');

  test.beforeAll(async ({ navigationBar }) => {
    test.setTimeout(600_000); // Installs the extensions and pulls the image to analyze.
    await installHummingbirdExtensionIfNeeded(navigationBar);
    await installGrypeExtensionIfNeeded(navigationBar);
    await pullImageIfNeeded(navigationBar, localImageReference);
  });

  test.afterAll(async ({ navigationBar }) => {
    // Only the Grype spec uses the Grype extension: remove it right away.
    if (didSuiteInstallGrype()) {
      await ensureGrypeExtensionIsRemoved(navigationBar);
    }
  });

  test('Verify the Grype extension is installed and active', async ({ navigationBar }) => {
    const extensionsPage = await navigationBar.openExtensions();
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
    await expect(alternativesPage.grypeBanner).not.toBeVisible();
    await expect(alternativesPage.analyzeButton).toBeEnabled({ timeout: 60_000 });
  });

  test('Analyze local images with Grype', async ({ runner }) => {
    test.setTimeout(900_000);

    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const alternativesPage = await hummingbirdNavigationBar.openAlternatives();

    await expect(alternativesPage.analyzeButton).toBeEnabled({ timeout: 60_000 });
    await alternativesPage.analyzeButton.click();

    await expect(alternativesPage.cvesColumnHeader).toBeVisible({ timeout: 30_000 });
    await expect(alternativesPage.sizeReductionColumnHeader).toBeVisible({ timeout: 30_000 });

    // First use prompts on the main page (not the webview) to install the Syft/Grype
    // binaries, and possibly system-wide: answer the dialogs while waiting for the report.
    const reportCell = alternativesPage.getReportCell(localImageRepo);
    const errorScanning = alternativesPage.getImageRow(localImageRepo).getByText('Error scanning');
    const reportDone = async (): Promise<boolean> => {
      // innerText() waits for the element: only read a cell that is currently rendered.
      if (!(await reportCell.isVisible().catch(() => false))) return false;
      return await reportCell
        .innerText({ timeout: 1_000 })
        .then(text => /\d/.test(text))
        .catch(() => false);
    };

    await waitUntil(
      async () => {
        if (await reportDone()) return true;
        // Stop early on a scan error: the assertions below report the real cause.
        if (await errorScanning.isVisible().catch(() => false)) return true;

        const binariesDialog = page.getByRole('dialog').filter({ hasText: 'install Syft and Grype binaries' });
        const systemWideDialog = page.getByRole('dialog').filter({ hasText: 'system-wide' });
        // Swallow click errors (e.g. the dialog closed in between): the loop retries.
        if (await binariesDialog.isVisible().catch(() => false)) {
          await binariesDialog
            .getByRole('button', { name: 'Yes', exact: true })
            .click({ timeout: 10_000 })
            .catch(() => {});
        } else if (await systemWideDialog.isVisible().catch(() => false)) {
          await systemWideDialog
            .getByRole('button', { name: 'Cancel', exact: true })
            .click({ timeout: 10_000 })
            .catch(() => {});
        }
        return false;
      },
      {
        timeout: 600_000,
        diff: 1_000,
        message: 'Vulnerability analysis did not complete (no report rendered for the nginx row)',
      },
    );

    await expect(reportCell).toContainText(/\d/);
    await expect(errorScanning).not.toBeVisible();
  });
});
