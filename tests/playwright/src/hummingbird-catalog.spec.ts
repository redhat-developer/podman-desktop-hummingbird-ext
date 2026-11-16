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
import { RunnerOptions, expect, test, waitUntil } from '@podman-desktop/tests-playwright';
import { HummingbirdNavigationBar } from './model/hummingbird-navigation-bar';
import {
  cleanupRawVideoFiles,
  handleWebview,
  installHummingbirdExtensionIfNeeded,
  markImagePulledBySuite,
  stripImageTag,
  waitForPodmanReady,
} from './utility/hummingbird-test-utils';

// Bare repository name as shown on the catalog card, e.g. "curl".
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const catalogImageName = process.env.HUMMINGBIRD_CATALOG_IMAGE || 'curl';
const catalogImageReference = `quay.io/hummingbird/${catalogImageName}:latest`;

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
  runner.setVideoAndTraceName('hummingbird-catalog');
  await welcomePage.handleWelcomePage(true);
  await expect(welcomePage.skipOnBoarding).toBeHidden();
  await waitForPodmanReady(mainPage);
});

test.afterAll(async ({ runner }) => {
  const videoAndTraceName = runner.getVideoAndTraceName();
  await runner.close();
  cleanupRawVideoFiles('tests/output', videoAndTraceName);
});

test.describe.serial('Hummingbird catalog', { tag: ['@smoke', '@catalog'] }, () => {
  test.beforeAll(async ({ navigationBar }) => {
    test.setTimeout(300_000); // Installing the extension can take a while.
    await installHummingbirdExtensionIfNeeded(navigationBar);
  });

  test('Open the Hummingbird extension from the navigation bar', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);

    await expect(page.getByRole('document', { name: 'Webview Hummingbird' })).toBeVisible();

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

    // Waiting for the cards validates the backend fetch from the Hummingbird API too.
    await expect(catalogPage.repositoryCards.first()).toBeVisible({ timeout: 60_000 });

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

    // The page loads twice (connection auto-selection navigates again): poll for stability.
    let totalCards = 0;
    await waitUntil(
      async () => {
        totalCards = await catalogPage.repositoryCards.count();
        return totalCards > 1;
      },
      { timeout: 10_000, message: 'Catalog cards were not rendered' },
    );

    await catalogPage.searchInput.fill('nginx');
    // No exact count: upstream may add similarly named repositories.
    await expect(catalogPage.getRepositoryCard('nginx')).toBeVisible();
    await expect(catalogPage.repositoryCards.filter({ hasNotText: 'nginx' })).toHaveCount(0);

    await catalogPage.searchInput.fill('no-such-hummingbird-image');
    // Tie the "no results" check to a known card disappearing, so it cannot pass on an
    // unrelated empty (still loading) state.
    await expect(catalogPage.getRepositoryCard('nginx')).toBeHidden();
    await expect(catalogPage.repositoryCards).toHaveCount(0);

    await catalogPage.searchInput.fill('');
    await expect(catalogPage.repositoryCards).toHaveCount(totalCards);
  });

  test('Pull a Hummingbird image from the catalog', async ({ runner, navigationBar }) => {
    test.setTimeout(360_000);

    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const catalogPage = await hummingbirdNavigationBar.openCatalog();

    await catalogPage.pullImage(catalogImageName, () => markImagePulledBySuite(catalogImageReference));

    // Image rows are labelled with the repository only.
    const imagesPage = await navigationBar.openImages();
    await imagesPage.waitForImageExists(stripImageTag(catalogImageReference), 60_000);
  });

  test('Open the pulled image details from the catalog', async ({ runner }) => {
    [page, webview] = await handleWebview(runner);
    const hummingbirdNavigationBar = new HummingbirdNavigationBar(page, webview);
    const catalogPage = await hummingbirdNavigationBar.openCatalog();

    await expect(catalogPage.getOpenButton(catalogImageName)).toBeVisible({ timeout: 30_000 });
    await catalogPage.getOpenButton(catalogImageName).click();

    await expect(page.getByRole('heading', { name: stripImageTag(catalogImageReference) })).toBeVisible({
      timeout: 30_000,
    });
  });
});
