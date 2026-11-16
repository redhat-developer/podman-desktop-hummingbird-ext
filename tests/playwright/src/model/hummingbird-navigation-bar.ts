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
import { HummingbirdAlternativesPage } from './hummingbird-alternatives-page';
import { HummingbirdCatalogPage } from './hummingbird-catalog-page';

// Navigation bar rendered inside the Hummingbird webview.
export class HummingbirdNavigationBar {
  readonly page: Page;
  readonly webview: Page;
  readonly navigationBar: Locator;
  readonly catalogButtonLocator: Locator;
  readonly alternativesButtonLocator: Locator;

  constructor(page: Page, webview: Page) {
    this.page = page;
    this.webview = webview;
    this.navigationBar = webview.getByLabel('Navigation', { exact: true });
    this.catalogButtonLocator = this.navigationBar.getByRole('link', { name: 'Catalog', exact: true });
    this.alternativesButtonLocator = this.navigationBar.getByRole('link', { name: 'Alternatives', exact: true });
  }

  async openCatalog(): Promise<HummingbirdCatalogPage> {
    await expect(this.catalogButtonLocator).toBeVisible();
    await this.catalogButtonLocator.click();
    const catalogPage = new HummingbirdCatalogPage(this.page, this.webview);
    await expect(catalogPage.heading).toBeVisible({ timeout: 30_000 });
    return catalogPage;
  }

  async openAlternatives(): Promise<HummingbirdAlternativesPage> {
    await expect(this.alternativesButtonLocator).toBeVisible();
    await this.alternativesButtonLocator.click();
    const alternativesPage = new HummingbirdAlternativesPage(this.page, this.webview);
    await expect(alternativesPage.heading).toBeVisible({ timeout: 30_000 });
    return alternativesPage;
  }
}
