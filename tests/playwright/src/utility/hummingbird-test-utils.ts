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
import type { ExtensionsPage, Runner } from '@podman-desktop/tests-playwright';
import { NavigationBar, delay, expect, test, waitUntil } from '@podman-desktop/tests-playwright';
import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export const extensionName = 'hummingbird';
export const extensionLabel = 'redhat.hummingbird';
export const extensionHeading = 'Hummingbird';
// `||` on purpose: an empty variable must fall back to the default.
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
export const extensionImage = process.env.OCI_IMAGE || 'ghcr.io/redhat-developer/podman-desktop-hummingbird-ext:next';

export const grypeExtensionName = 'grype';
export const grypeExtensionLabel = 'podman-desktop.grype';
export const grypeExtensionHeading = 'Grype';
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const grypeOciImage = process.env.GRYPE_OCI_IMAGE || 'ghcr.io/podman-desktop/extension-grype:next';
export const grypeExtensionImage = grypeOciImage;

// Suite-wide state, shared by all spec files (the suite runs in a single worker). Only what
// the run installed / pulled itself may be removed during cleanup: a preloaded plugin
// cannot be restored once removed.
let hummingbirdInstalledBySuite = false;
let grypeInstalledBySuite = false;
const imagesPulledBySuite = new Set<string>();

export function markHummingbirdInstalledBySuite(): void {
  hummingbirdInstalledBySuite = true;
}

export function didSuiteInstallHummingbird(): boolean {
  return hummingbirdInstalledBySuite;
}

export function didSuiteInstallGrype(): boolean {
  return grypeInstalledBySuite;
}

export function markImagePulledBySuite(imageReference: string): void {
  imagesPulledBySuite.add(imageReference);
}

export function getImagesPulledBySuite(): string[] {
  return [...imagesPulledBySuite];
}

/**
 * Opens the Hummingbird extension page and returns the main Podman Desktop page together
 * with the webview guest page. The webview runs inside an Electron `<webview>` tag, so its
 * content must be driven through the guest page (same approach as the bootc E2E suite),
 * matched by URL rather than by position.
 */
export async function handleWebview(runner: Runner): Promise<[Page, Page]> {
  const page = runner.getPage();
  const navigationBar = new NavigationBar(page);
  const hummingbirdPodmanExtensionButton = navigationBar.navigationLocator.getByRole('link', {
    name: 'Hummingbird',
  });

  await expect(hummingbirdPodmanExtensionButton).toBeEnabled({ timeout: 30_000 });
  await hummingbirdPodmanExtensionButton.click();

  await expect(page.getByRole('document', { name: 'Webview Hummingbird' })).toBeVisible({ timeout: 30_000 });

  let webViewPage: Page | undefined;
  await waitUntil(
    async () => {
      webViewPage = runner.getWindows().find(window => window !== page && window.url().includes('.webview.localhost'));
      return webViewPage !== undefined;
    },
    { timeout: 15_000, diff: 500, message: 'Webview guest window did not appear in the Electron app' },
  );

  await page.evaluate(() => {
    (document.querySelector('webview') as HTMLElement | null)?.focus();
  });

  return [page, webViewPage!];
}

/** Installs the extension unless already present. Returns true only when it installed it. */
async function installExtensionIfNeeded(
  navigationBar: NavigationBar,
  label: string,
  image: string,
  installedBySuite: () => void,
): Promise<boolean> {
  const extensionsPage = await navigationBar.openExtensions();
  await expect(extensionsPage.header).toBeVisible();

  if (await extensionInstalledAfterSettling(extensionsPage, label)) return false;

  if (label === extensionLabel && process.env.SKIP_INSTALLATION === 'true') {
    // Preloaded in the test profile: only wait for it.
    await expect.poll(async () => await extensionsPage.extensionIsInstalled(label), { timeout: 60_000 }).toBeTruthy();
    return false;
  }

  await extensionsPage.installExtensionFromOCIImage(image);
  // Record before verifying, so a failing verification still leads to cleanup.
  installedBySuite();
  await expect.poll(async () => await extensionsPage.extensionIsInstalled(label), { timeout: 60_000 }).toBeTruthy();
  return true;
}

export async function installHummingbirdExtensionIfNeeded(navigationBar: NavigationBar): Promise<boolean> {
  return installExtensionIfNeeded(navigationBar, extensionLabel, extensionImage, () => {
    hummingbirdInstalledBySuite = true;
  });
}

export async function installGrypeExtensionIfNeeded(navigationBar: NavigationBar): Promise<boolean> {
  return installExtensionIfNeeded(navigationBar, grypeExtensionLabel, grypeExtensionImage, () => {
    grypeInstalledBySuite = true;
  });
}

/** Removes an installed extension. No-op if absent. */
export async function ensureExtensionIsRemoved(
  navigationBar: NavigationBar,
  name: string,
  label: string,
  heading: string,
): Promise<void> {
  let extensionsPage = await navigationBar.openExtensions();
  await expect(extensionsPage.header).toBeVisible();
  if (!(await extensionInstalledAfterSettling(extensionsPage, label))) return;

  const details = await extensionsPage.openExtensionDetails(name, label, heading);
  await details.removeExtension();
  extensionsPage = await navigationBar.openExtensions();
  await expect.poll(async () => await extensionsPage.extensionIsInstalled(label), { timeout: 30_000 }).toBeFalsy();
}

export async function ensureHummingbirdIsRemoved(navigationBar: NavigationBar): Promise<void> {
  await ensureExtensionIsRemoved(navigationBar, extensionName, extensionLabel, extensionHeading);
}

export async function ensureGrypeExtensionIsRemoved(navigationBar: NavigationBar): Promise<void> {
  await ensureExtensionIsRemoved(navigationBar, grypeExtensionName, grypeExtensionLabel, grypeExtensionHeading);
}

/** Podman Desktop labels image rows and details headings with the repository only. */
export function stripImageTag(imageReference: string): string {
  const lastColon = imageReference.lastIndexOf(':');
  if (lastColon === -1 || lastColon < imageReference.lastIndexOf('/')) {
    return imageReference;
  }
  return imageReference.substring(0, lastColon);
}

/**
 * Pulls `imageName` through the Podman Desktop Images page unless already available, and
 * records it for the final cleanup. Returns true only when it pulled it.
 */
export async function pullImageIfNeeded(navigationBar: NavigationBar, imageName: string): Promise<boolean> {
  const imagesPage = await navigationBar.openImages();
  const imageExists = await imagesPage.waitForImageExists(stripImageTag(imageName), 5_000).catch(() => false);
  if (imageExists) return false;

  await imagesPage.pullImage(imageName);
  await imagesPage.waitForImageExists(stripImageTag(imageName), 60_000);
  markImagePulledBySuite(imageName);
  return true;
}

/** Deletes `imageName`, ignoring missing images and errors. */
export async function deleteImageIfExists(navigationBar: NavigationBar, imageName: string): Promise<void> {
  try {
    const imageRepo = stripImageTag(imageName);
    const imagesPage = await navigationBar.openImages();
    const imageExists = await imagesPage.waitForImageExists(imageRepo, 5_000).catch(() => false);
    if (!imageExists) return;

    const imageDetailsPage = await imagesPage.openImageDetails(imageRepo);
    await imageDetailsPage.deleteImage();
    await imagesPage.waitForImageDelete(imageRepo, 30_000);
  } catch (error) {
    console.log(`Failed to delete image ${imageName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Gives a still-populating extension list a short window before concluding "absent".
async function extensionInstalledAfterSettling(
  extensionsPage: ExtensionsPage,
  label: string,
  settleTimeout = 5_000,
): Promise<boolean> {
  if (await extensionsPage.extensionIsInstalled(label)) return true;
  const deadline = Date.now() + settleTimeout;
  while (Date.now() < deadline) {
    await delay(500);
    if (await extensionsPage.extensionIsInstalled(label)) return true;
  }
  return false;
}

// Webview guest windows leave orphaned raw video files that runner.close() does not track:
// delete them, or move them to backups/ when the named video failed to save.
export function cleanupRawVideoFiles(outputFolder: string, expectedVideoName?: string): void {
  if (!existsSync(outputFolder)) return;
  const RAW_VIDEO_PATTERN = /^[0-9a-f]{32,}\.webm$/;

  const videoDirs: string[] = [];
  const topLevelVideos = join(outputFolder, 'videos');
  if (existsSync(topLevelVideos)) {
    videoDirs.push(topLevelVideos);
  }
  for (const subdir of readdirSync(outputFolder, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const nested = join(outputFolder, subdir.name, 'videos');
    if (nested !== topLevelVideos && existsSync(nested)) {
      videoDirs.push(nested);
    }
  }

  const namedVideoMissing =
    !!expectedVideoName && !videoDirs.some(dir => existsSync(join(dir, `${expectedVideoName}.webm`)));
  const testStatus = test?.info()?.status;
  const saveFailure = namedVideoMissing && testStatus !== 'passed' && testStatus !== 'skipped';

  for (const videosDir of videoDirs) {
    for (const file of readdirSync(videosDir)) {
      if (!RAW_VIDEO_PATTERN.test(file)) continue;
      const filePath = join(videosDir, file);
      try {
        if (saveFailure) {
          const backupsDir = join(videosDir, 'backups');
          if (!existsSync(backupsDir)) {
            mkdirSync(backupsDir, { recursive: true });
          }
          renameSync(filePath, join(backupsDir, file));
        } else {
          unlinkSync(filePath);
        }
      } catch (e) {
        console.log(`Failed to process raw video file ${filePath}: ${e}`);
      }
    }
  }
}
