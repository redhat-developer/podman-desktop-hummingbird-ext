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

/**
 * Page object for the Hardened Image Alternatives page rendered inside the webview
 * (see packages/frontend/src/routes/alternatives/+page.svelte).
 */
export class HummingbirdAlternativesPage {
  readonly page: Page;
  readonly webview: Page;
  readonly heading: Locator;
  readonly analyzeButton: Locator;
  readonly grypeBanner: Locator;
  readonly checkCatalogButton: Locator;
  readonly noAlternativesScreen: Locator;
  readonly table: Locator;

  constructor(page: Page, webview: Page) {
    this.page = page;
    this.webview = webview;
    this.heading = webview.getByRole('region', { name: 'Hardened Image Alternatives' });
    this.analyzeButton = webview.getByRole('button', { name: 'Analyze', exact: true });
    // GrypeBanner.svelte, shown when the grype extension is not installed and local
    // images with Hummingbird alternatives exist.
    this.grypeBanner = webview.getByText('you can install the Grype extension');
    this.checkCatalogButton = webview.getByRole('button', { name: 'Check catalog', exact: true });
    this.noAlternativesScreen = webview.getByText('No alternatives found');
    // The Table component of @podman-desktop/ui-svelte sets aria-label to the table kind.
    this.table = webview.getByRole('table', { name: 'alternatives' });
  }

  getImageRow(imageName: string): Locator {
    return this.table.getByRole('row').filter({ hasText: imageName });
  }

  /**
   * Locator for the CVEs report cell of a row. The report columns only exist once the
   * analysis has started: before that the cell at the same index is the icon-only Actions
   * cell, and while the scan is running the cell is a text-less skeleton. The locator
   * therefore matches only once the numeric vulnerability counts are rendered.
   */
  getReportCell(imageName: string): Locator {
    return this.getImageRow(imageName).getByRole('cell').nth(2);
  }

  get cvesColumnHeader(): Locator {
    return this.table.getByRole('columnheader').filter({ hasText: 'CVEs' });
  }

  get sizeReductionColumnHeader(): Locator {
    return this.table.getByRole('columnheader').filter({ hasText: 'Size Reduction' });
  }

  async openImageReport(imageName: string): Promise<void> {
    const row = this.getImageRow(imageName);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Open Image Report Details' }).click();
  }
}
