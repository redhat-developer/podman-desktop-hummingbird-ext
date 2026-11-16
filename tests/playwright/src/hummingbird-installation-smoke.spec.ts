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

import { expect, RunnerOptions, test } from '@podman-desktop/tests-playwright';
import {
  deleteImageIfExists,
  didSuiteInstallGrype,
  didSuiteInstallHummingbird,
  ensureGrypeExtensionIsRemoved,
  ensureHummingbirdIsRemoved,
  extensionHeading,
  extensionImage,
  extensionInstalledAfterSettling,
  extensionLabel,
  extensionName,
  getImagesPulledBySuite,
  markHummingbirdInstalledBySuite,
  waitForPodmanReady,
} from './utility/hummingbird-test-utils';

// Podman Desktop 1.30.x renders the installed status as "ACTIVE" while current main renders
// "Installed": accept either.
const extensionStatusRegex = /^\s*(ACTIVE|Installed)\s*$/i;

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

test.beforeAll(async ({ runner, welcomePage, navigationBar, page: mainPage }) => {
  runner.setVideoAndTraceName('hummingbird-installation-smoke');
  await welcomePage.handleWelcomePage(true);
  await expect(welcomePage.skipOnBoarding).toBeHidden();
  const dashboardPage = await navigationBar.openDashboard();
  await expect(dashboardPage.heading).toBeVisible();
  // The final cleanup lists images: make sure Podman is connected by then.
  if (getImagesPulledBySuite().length > 0) {
    await waitForPodmanReady(mainPage);
  }
});

// This file sorts last: its afterAll performs the single final cleanup of what the run
// installed and pulled. The extension is installed once by the first spec file and never
// removed between. The cleanup lives at file level so it also runs when the setup fails.
test.afterAll(async ({ navigationBar }) => {
  for (const image of getImagesPulledBySuite()) {
    await deleteImageIfExists(navigationBar, image);
  }
  if (didSuiteInstallGrype()) {
    await ensureGrypeExtensionIsRemoved(navigationBar);
  }
  if (didSuiteInstallHummingbird()) {
    await ensureHummingbirdIsRemoved(navigationBar);
  }
});

// Playwright runs this hook even if the previous one fails, after recording the failure,
// so runner.close() retains its diagnostic artifacts.
test.afterAll(async ({ runner }) => {
  await runner.close();
});

test.describe.serial('Hummingbird extension installation', { tag: ['@smoke', '@installation'] }, () => {
  test('Install Hummingbird from an OCI image', async ({ navigationBar }) => {
    // eslint-disable-next-line sonarjs/no-skipped-tests -- PRs preload the image; the next tests must still verify it.
    test.skip(process.env.SKIP_INSTALLATION === 'true', 'The workflow preloads the locally built OCI image');
    // eslint-disable-next-line sonarjs/no-skipped-tests -- An earlier spec file already exercised the install flow.
    test.skip(didSuiteInstallHummingbird(), 'Extension already installed by an earlier spec file');
    let extensionsPage = await navigationBar.openExtensions();
    await expect(extensionsPage.header).toBeVisible();
    // A failing earlier run may have left it installed: start from a clean state.
    if (await extensionInstalledAfterSettling(extensionsPage, extensionLabel)) {
      await ensureHummingbirdIsRemoved(navigationBar);
      extensionsPage = await navigationBar.openExtensions();
      await expect(extensionsPage.header).toBeVisible();
    }
    await expect.poll(() => extensionsPage.extensionIsInstalled(extensionLabel)).toBeFalsy();
    // Record before acting: a failed install that still lands the extension must clean up.
    markHummingbirdInstalledBySuite();
    await extensionsPage.installExtensionFromOCIImage(extensionImage);
    const extension = await extensionsPage.getInstalledExtension(extensionName, extensionLabel);
    await expect(extension.card).toBeVisible();
  });

  test('Verify Hummingbird is installed and active', async ({ navigationBar }) => {
    const extensionsPage = await navigationBar.openExtensions();
    await expect.poll(() => extensionsPage.extensionIsInstalled(extensionLabel), { timeout: 60_000 }).toBeTruthy();
    const details = await extensionsPage.openExtensionDetails(extensionName, extensionLabel, extensionHeading);
    await expect(details.heading).toBeVisible();
    await expect.poll(async () => await details.status.innerText(), { timeout: 60_000 }).toMatch(extensionStatusRegex);
    const errorTab = details.tabs.getByRole('button', { name: 'Error' });
    let stackTrace = '';
    if ((await errorTab.count()) > 0) {
      await details.activateTab('Error');
      stackTrace = await details.errorStackTrace.innerText();
    }
    await expect(errorTab, `Error Tab was present with stackTrace: ${stackTrace}`).not.toBeVisible();
    await expect(details.disableButton).toBeEnabled({ timeout: 60_000 });
  });

  test('Verify Hummingbird extension card', async ({ navigationBar }) => {
    const extensionsPage = await navigationBar.openExtensions();
    const extension = await extensionsPage.getInstalledExtension(extensionName, extensionLabel);
    await expect(extension.card).toBeVisible();
    await expect
      .poll(async () => await extension.status.innerText(), { timeout: 60_000 })
      .toMatch(extensionStatusRegex);
  });
});
