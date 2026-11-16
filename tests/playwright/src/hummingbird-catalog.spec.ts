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
  stripImageTag,
} from './utility/hummingbird-test-utils';

// Small Hummingbird image used to exercise the pull flow from the catalog card.
const catalogImageName = process.env.HUMMINGBIRD_CATALOG_IMAGE ?? 'curl';
const catalogImageReference = `quay.io/hummingbird/${catalogImageName}:latest`;

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
  runner.setVideoAndTraceName('hummingbird-catalog');
  await welcomePage.handleWelcomePage(true);
  await expect(welcomePage.skipOnBoarding).toBeHidden();
  // Pulling images from the catalog requires a running container provider connection.
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

test.describe.serial('Hummingbird catalog', { tag: ['@smoke', '@catalog'] }, () => {
  test.beforeAll(async ({ navigationBar }) => {
    await installHummingbirdExtensionIfNeeded(navigationBar);
  });

  test.afterAll(async ({ navigationBar }) => {
    await deleteImageIfExists(navigationBar, catalogImageReference);
    await ensureHummingbirdIsRemoved(navigationBar);
  });

  test('Open the Hummingbird extension from the navigation bar', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);

    // The webview itself is rendered on the main Podman Desktop page...
    await expect(page.getByRole('document', { name: 'Webview Hummingbird' })).toBeVisible();

    // ...and its content is driven through the guest page.
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    await expect(hummingbirdNavigationBar.navigationBar).toBeVisible();
    await expect(hummingbirdNavigationBar.catalogButtonLocator).toBeVisible();
    await expect(hummingbirdNavigationBar.alternativesButtonLocator).toBeVisible();

    const catalogPage = await hummingbirdNavigationBar.openCatalog();
    await expect(catalogPage.heading).toBeVisible();
  });

  test('Catalog lists the Hummingbird repositories', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const catalogPage = await hummingbirdNavigationBar.openCatalog();

    // The catalog is fetched from the Hummingbird API: waiting for the cards to be
    // rendered (out of the skeleton state) validates the extension backend too.
    await expect(catalogPage.repositoryCards.first()).toBeVisible({ timeout: 60_000 });
    await expect(catalogPage.repositoryCards).not.toHaveCount(0);

    const card = catalogPage.getRepositoryCard('nginx');
    await expect(card).toBeVisible();
    await expect(card).toContainText('quay.io/hummingbird/nginx');
    await expect(catalogPage.getMoreDetailsButton('nginx')).toBeVisible();
  });

  test('Search filters the catalog', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const catalogPage = await hummingbirdNavigationBar.openCatalog();
    await expect(catalogPage.repositoryCards.first()).toBeVisible({ timeout: 60_000 });

    const totalCards = await catalogPage.repositoryCards.count();
    expect(totalCards).toBeGreaterThan(1);

    await catalogPage.searchInput.fill('nginx');
    await expect(catalogPage.repositoryCards).toHaveCount(1);
    await expect(catalogPage.getRepositoryCard('nginx')).toBeVisible();

    await catalogPage.searchInput.fill('no-such-hummingbird-image');
    await expect(catalogPage.repositoryCards).toHaveCount(0);

    await catalogPage.searchInput.fill('');
    await expect(catalogPage.repositoryCards).toHaveCount(totalCards);
  });

  test('Pull a Hummingbird image from the catalog', async ({ runner, navigationBar }) => {
    test.setTimeout(360_000);

    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const catalogPage = await hummingbirdNavigationBar.openCatalog();

    await catalogPage.pullImage(catalogImageName);

    // The image must be visible on the Podman Desktop Images page. Image rows are labelled
    // with the repository only (the tag is a separate column).
    const imagesPage = await navigationBar.openImages();
    await imagesPage.waitForImageExists(stripImageTag(catalogImageReference), 60_000);
  });

  test('Open the pulled image details from the catalog', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const catalogPage = await hummingbirdNavigationBar.openCatalog();

    // After a successful pull the card switches to the Open / Run actions.
    await expect(catalogPage.getOpenButton(catalogImageName)).toBeVisible();
    await catalogPage.getOpenButton(catalogImageName).click();

    // The Open action navigates the main Podman Desktop page to the image details. The page
    // title is the image repository, the tag is displayed in the subtitle.
    await expect(page.getByRole('heading', { name: stripImageTag(catalogImageReference) })).toBeVisible({
      timeout: 30_000,
    });
  });
});
