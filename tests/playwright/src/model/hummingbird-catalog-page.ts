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

// Hummingbird Catalog page rendered inside the webview.
export class HummingbirdCatalogPage {
  readonly page: Page;
  readonly webview: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly content: Locator;
  // Skeleton cards ("Loading repository card") are groups too: only match real cards,
  // which all display their quay.io/hummingbird/<name> reference.
  readonly repositoryCards: Locator;

  constructor(page: Page, webview: Page) {
    this.page = page;
    this.webview = webview;
    this.heading = webview.getByRole('region', { name: 'Hummingbird Catalog' });
    this.searchInput = webview.getByLabel('search Hummingbird Catalog');
    this.content = this.heading.getByRole('region', { name: 'content' });
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
   * Pulls the `quay.io/hummingbird/<repositoryName>:latest` image and waits for the card to
   * switch to the pulled state. Returns true only when it performed the pull.
   */
  async pullImage(repositoryName: string, timeout = 300_000): Promise<boolean> {
    await expect(this.getRepositoryCard(repositoryName)).toBeVisible();

    const pullButton = this.getPullButton(repositoryName);
    const openButton = this.getOpenButton(repositoryName);
    // Wait for a stable footer: while the page loads, the card shows a disabled Pull button
    // (no connection selected yet) or a skeleton. isVisible() does not wait for the element,
    // while isEnabled() does — hence the guard and the short timeouts.
    await waitUntil(
      async () => {
        if (await openButton.isVisible().catch(() => false)) return true;
        if (!(await pullButton.isVisible().catch(() => false))) return false;
        return await pullButton.isEnabled({ timeout: 1_000 }).catch(() => false);
      },
      { timeout: 30_000, message: `Catalog card for ${repositoryName} did not settle on a Pull or Open action` },
    );

    if (await openButton.isVisible()) {
      console.log(`Image for ${repositoryName} already pulled`);
      return false;
    }

    try {
      await pullButton.click({ timeout: 10_000 });
    } catch (error) {
      // The card switched to the pulled state between the check and the click.
      if (await openButton.isVisible().catch(() => false)) return false;
      throw error;
    }

    await expect(openButton).toBeVisible({ timeout });
    await expect(this.getRunButton(repositoryName)).toBeVisible({ timeout: 10_000 });
    return true;
  }
}
