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

import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { waitUntil } from '@podman-desktop/tests-playwright';

/**
 * Page object for the Hummingbird Catalog page rendered inside the webview
 * (see packages/frontend/src/routes/+page.svelte and RepositoryCard.svelte).
 */
export class HummingbirdCatalogPage {
  readonly page: Page;
  readonly webview: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly content: Locator;
  readonly repositoryCards: Locator;

  constructor(page: Page, webview: Page) {
    this.page = page;
    this.webview = webview;
    this.heading = webview.getByRole('region', { name: 'Hummingbird Catalog' });
    this.searchInput = webview.getByLabel('search Hummingbird Catalog');
    // The NavPage component renders the cards inside a region labelled "content".
    this.content = this.heading.getByRole('region', { name: 'content' });
    // While the catalog is loading the page renders skeleton cards, which are groups
    // labelled "Loading repository card": only match real cards — every repository card
    // displays its quay.io/hummingbird/<name> reference.
    this.repositoryCards = this.content.getByRole('group').filter({ hasText: 'quay.io/hummingbird/' });
  }

  getRepositoryCard(repositoryName: string): Locator {
    return this.content.getByRole('group', { name: repositoryName, exact: true });
  }

  getPullButton(repositoryName: string): Locator {
    return this.getRepositoryCard(repositoryName).getByRole('button', { name: 'Pull', exact: true });
  }

  getOpenButton(repositoryName: string): Locator {
    return this.getRepositoryCard(repositoryName).getByRole('button', { name: 'Open', exact: true });
  }

  getRunButton(repositoryName: string): Locator {
    return this.getRepositoryCard(repositoryName).getByRole('button', { name: 'Run', exact: true });
  }

  getMoreDetailsButton(repositoryName: string): Locator {
    return this.getRepositoryCard(repositoryName).getByRole('button', { name: 'More details', exact: true });
  }

  /**
   * Pulls the `quay.io/hummingbird/<repositoryName>:latest` image from the catalog card and
   * waits for the card to switch to the pulled state (Open / Run buttons).
   *
   * The card footer goes through transient states while the page loads: a disabled Pull
   * button before a provider connection is selected, then a skeleton while the pulled state
   * resolves. Only act on a stable footer — either the image is already on the engine
   * (Open / Run), or the Pull action is enabled.
   *
   * @returns `true` only when this method performed the pull itself: only then may the
   * caller delete the image during cleanup, otherwise it could wipe an image that was
   * already on the engine before the test run.
   */
  async pullImage(repositoryName: string, timeout = 300_000): Promise<boolean> {
    const card = this.getRepositoryCard(repositoryName);
    await expect(card).toBeVisible();

    const pullButton = this.getPullButton(repositoryName);
    const openButton = this.getOpenButton(repositoryName);
    await waitUntil(async () => (await openButton.isVisible()) || (await pullButton.isEnabled()), {
      timeout: 30_000,
      message: `Catalog card for ${repositoryName} did not settle on a Pull or Open action`,
    });

    // A previous run may have left the image on the engine: the card then shows Open/Run.
    if (await openButton.isVisible()) {
      console.log(`Image for ${repositoryName} already pulled`);
      return false;
    }

    // The card may switch to the pulled state between the check and the click; treat a
    // vanished Pull button as "already pulled" instead of failing.
    try {
      await pullButton.click();
    } catch (error) {
      if (await openButton.isVisible().catch(() => false)) {
        console.log(`Image for ${repositoryName} was pulled while clicking, continuing`);
        return false;
      }
      throw error;
    }

    await expect(openButton).toBeVisible({ timeout });
    await expect(this.getRunButton(repositoryName)).toBeVisible({ timeout: 10_000 });
    return true;
  }
}
