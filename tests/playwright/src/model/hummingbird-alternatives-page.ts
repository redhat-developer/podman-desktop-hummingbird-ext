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

// Hardened Image Alternatives page rendered inside the webview.
export class HummingbirdAlternativesPage {
  readonly page: Page;
  readonly webview: Page;
  readonly heading: Locator;
  readonly analyzeButton: Locator;
  // Shown when the Grype extension is not installed and local images with alternatives exist.
  readonly grypeBanner: Locator;
  readonly checkCatalogButton: Locator;
  readonly noAlternativesScreen: Locator;
  readonly table: Locator;

  constructor(page: Page, webview: Page) {
    this.page = page;
    this.webview = webview;
    this.heading = webview.getByRole('region', { name: 'Hardened Image Alternatives' });
    this.analyzeButton = webview.getByRole('button', { name: 'Analyze', exact: true });
    this.grypeBanner = webview.getByText('you can install the Grype extension');
    this.checkCatalogButton = webview.getByRole('button', { name: 'Check catalog', exact: true });
    this.noAlternativesScreen = webview.getByText('No alternatives found');
    this.table = webview.getByRole('table', { name: 'alternatives' });
  }

  // Rows are labelled with the repository name: match exactly to avoid collisions.
  getImageRow(imageRepository: string): Locator {
    return this.table.getByRole('row', { name: imageRepository, exact: true });
  }

  // Row cells are: expander, Status, Name, CVEs, Size Reduction, Actions — the CVEs report
  // cell sits at index 3 and only contains text once the scan has finished.
  getReportCell(imageRepository: string): Locator {
    return this.getImageRow(imageRepository).getByRole('cell').nth(3);
  }

  get cvesColumnHeader(): Locator {
    return this.table.getByRole('columnheader').filter({ hasText: 'CVEs' });
  }

  get sizeReductionColumnHeader(): Locator {
    return this.table.getByRole('columnheader').filter({ hasText: 'Size Reduction' });
  }
}
