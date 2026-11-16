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
import type { Runner } from '@podman-desktop/tests-playwright';
import { NavigationBar, expect, test, waitUntil } from '@podman-desktop/tests-playwright';
import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export const extensionName = 'hummingbird';
export const extensionLabel = 'redhat.hummingbird';
export const extensionHeading = 'Hummingbird';
export const extensionImage = process.env.OCI_IMAGE ?? 'ghcr.io/redhat-developer/podman-desktop-hummingbird-ext:next';

export const grypeExtensionName = 'grype';
export const grypeExtensionLabel = 'podman-desktop.grype';
export const grypeExtensionHeading = 'Grype';
export const grypeExtensionImage = process.env.GRYPE_OCI_IMAGE ?? 'ghcr.io/podman-desktop/extension-grype:next';

// The webview panel is registered in packages/backend/src/services/webview-service.ts through
// createWebviewPanel('hummingbird', 'Hummingbird', ...): Podman Desktop exposes the panel in its
// navigation rail under the panel title, and renders the <webview> element with the accessible
// name "Webview <title>" (see Webview.svelte in podman-desktop).
const HUMMINGBIRD_NAVBAR_EXTENSION_LABEL = 'Hummingbird';
const HUMMINGBIRD_PAGE_BODY_LABEL = 'Webview Hummingbird';

/**
 * Opens the Hummingbird extension page from the Podman Desktop navigation bar and returns the
 * main Podman Desktop page together with the webview guest page.
 *
 * The extension UI runs inside an Electron `<webview>` tag, so its content cannot be queried
 * through the main page: the guest page is exposed as an additional window by
 * `runner.getWindows()` and must be driven directly (same approach as the bootc extension
 * E2E suite).
 */
export async function handleWebview(runner: Runner): Promise<[Page, Page]> {
  const page = runner.getPage();
  const navigationBar = new NavigationBar(page);
  const hummingbirdPodmanExtensionButton = navigationBar.navigationLocator.getByRole('link', {
    name: HUMMINGBIRD_NAVBAR_EXTENSION_LABEL,
  });

  // The navigation entry appears once the extension has activated and registered its webview
  // panel, which can lag slightly behind the extension card on slower machines.
  await expect(hummingbirdPodmanExtensionButton).toBeEnabled({ timeout: 30_000 });
  await hummingbirdPodmanExtensionButton.click();
  await page.waitForTimeout(2_000);

  const webView = page.getByRole('document', { name: HUMMINGBIRD_PAGE_BODY_LABEL });
  await expect(webView).toBeVisible({ timeout: 30_000 });

  let mainPage!: Page;
  let webViewPage!: Page;
  await waitUntil(
    async () => {
      const windows = runner.getWindows();
      if (windows.length >= 2) {
        [mainPage, webViewPage] = windows;
        return true;
      }
      return false;
    },
    {
      timeout: 10_000,
      diff: 500,
      message: 'Webview guest window did not appear in the Electron app',
    },
  );

  await mainPage.evaluate(() => {
    const element = document.querySelector('webview');
    if (element) {
      (element as HTMLElement).focus();
    } else {
      console.log(`element is null`);
    }
  });

  return [mainPage, webViewPage];
}

export async function installHummingbirdExtensionIfNeeded(navigationBar: NavigationBar): Promise<void> {
  console.log('Installing Hummingbird extension if needed');
  const extensionsPage = await navigationBar.openExtensions();
  const extensionInstalled = await extensionsPage.extensionIsInstalled(extensionLabel);

  if (extensionInstalled || process.env.SKIP_INSTALLATION === 'true') {
    // The workflow may preload the extension in the test profile: only wait for it.
    await expect
      .poll(async () => await extensionsPage.extensionIsInstalled(extensionLabel), { timeout: 60_000 })
      .toBeTruthy();
    return;
  }

  console.log(`Installing Hummingbird extension from OCI image ${extensionImage}`);
  await extensionsPage.installExtensionFromOCIImage(extensionImage);
  await expect
    .poll(async () => await extensionsPage.extensionIsInstalled(extensionLabel), { timeout: 60_000 })
    .toBeTruthy();
  console.log('Hummingbird extension installed');
}

export async function ensureHummingbirdIsRemoved(navigationBar: NavigationBar): Promise<void> {
  console.log('Ensuring Hummingbird extension is removed');
  let extensionsPage = await navigationBar.openExtensions();
  if (!(await extensionsPage.extensionIsInstalled(extensionLabel))) return;

  const hummingbirdExtensionPage = await extensionsPage.openExtensionDetails(
    extensionName,
    extensionLabel,
    extensionHeading,
  );
  await hummingbirdExtensionPage.removeExtension();
  extensionsPage = await navigationBar.openExtensions();

  await expect
    .poll(async () => await extensionsPage.extensionIsInstalled(extensionLabel), { timeout: 30_000 })
    .toBeFalsy();
  console.log('Hummingbird extension removed');
}

/**
 * Removes the Hummingbird extension unless it was preloaded in the test profile
 * (SKIP_INSTALLATION=true): removing a preloaded plugin deletes its files from the
 * profile's plugins folder, so it would not be installed again on the next Podman
 * Desktop start and the remaining spec files would fail to find it. The profile is
 * discarded at the end of the test run anyway.
 */
export async function removeHummingbirdExtensionIfNeeded(navigationBar: NavigationBar): Promise<void> {
  if (process.env.SKIP_INSTALLATION === 'true') {
    console.log('Hummingbird extension was preloaded in the test profile, skipping removal');
    return;
  }
  await ensureHummingbirdIsRemoved(navigationBar);
}

export async function ensureGrypeExtensionIsRemoved(navigationBar: NavigationBar): Promise<void> {
  console.log('Ensuring Grype extension is removed');
  let extensionsPage = await navigationBar.openExtensions();
  if (!(await extensionsPage.extensionIsInstalled(grypeExtensionLabel))) return;

  const grypeExtensionPage = await extensionsPage.openExtensionDetails(
    grypeExtensionName,
    grypeExtensionLabel,
    grypeExtensionHeading,
  );
  await grypeExtensionPage.removeExtension();
  extensionsPage = await navigationBar.openExtensions();

  await expect
    .poll(async () => await extensionsPage.extensionIsInstalled(grypeExtensionLabel), { timeout: 30_000 })
    .toBeFalsy();
  console.log('Grype extension removed');
}

/**
 * Strips the tag from an image reference: Podman Desktop labels image rows and details
 * headings with the repository only (`quay.io/hummingbird/curl`), the tag is rendered
 * in a separate column / subtitle.
 */
export function stripImageTag(imageReference: string): string {
  const lastColon = imageReference.lastIndexOf(':');
  if (lastColon === -1 || lastColon < imageReference.lastIndexOf('/')) {
    return imageReference;
  }
  return imageReference.substring(0, lastColon);
}

/**
 * Pulls `imageName` through the Podman Desktop Images page unless it is already available
 * on the container engine (the podman machine storage persists across spec files, so images
 * pulled by an earlier spec do not need to be pulled again).
 */
export async function pullImageIfNeeded(navigationBar: NavigationBar, imageName: string): Promise<void> {
  const imagesPage = await navigationBar.openImages();
  const imageExists = await imagesPage.waitForImageExists(stripImageTag(imageName), 5_000).catch(() => false);
  if (imageExists) {
    console.log(`Image ${imageName} already available, skipping pull`);
    return;
  }

  console.log(`Pulling image ${imageName}`);
  await imagesPage.pullImage(imageName);
  await imagesPage.waitForImageExists(stripImageTag(imageName), 60_000);
}

/** Deletes `imageName` from the Podman Desktop Images page, ignoring missing images and errors. */
export async function deleteImageIfExists(navigationBar: NavigationBar, imageName: string): Promise<void> {
  try {
    const imageRepo = stripImageTag(imageName);
    const imagesPage = await navigationBar.openImages();
    const imageExists = await imagesPage.waitForImageExists(imageRepo, 5_000).catch(() => false);
    if (!imageExists) return;

    const imageDetailsPage = await imagesPage.openImageDetails(imageRepo);
    await imageDetailsPage.deleteImage();
    await imagesPage.waitForImageDelete(imageRepo, 30_000);
    console.log(`Deleted image ${imageName}`);
  } catch (error) {
    console.log(`Failed to delete image ${imageName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Playwright generates raw video files with 32-char hex names (from createGuid()).
 * Runner.close() only saves/deletes the main page's recording — additional Electron
 * windows (e.g. webviews) leave orphaned raw files.
 *
 * When {@link expectedVideoName} is provided and the corresponding named video
 * (`<name>.webm`) exists, raw files are simply deleted. Callers should pass
 * `runner.getVideoAndTraceName()` which includes the `_w<index>` worker suffix
 * appended by the upstream Runner.
 *
 * If the named video is absent (e.g. the Electron process was force-killed and
 * `saveVideoAs` failed), raw recordings are moved into a `backups/` subfolder
 * under the videos directory so they survive into the CI artifact instead of
 * being lost.
 *
 * **Important:** `runner.close()` deletes the named video when the test passed
 * (via `removeTracesOnFinished`), so the named-video check alone would produce a
 * false-positive save-failure. This function reads `test.info().status` directly
 * to distinguish intentional cleanup from a genuine save failure.
 */
export function cleanupRawVideoFiles(outputFolder: string, expectedVideoName?: string): void {
  if (!existsSync(outputFolder)) return;
  const RAW_VIDEO_PATTERN = /^[0-9a-f]{32,}\.webm$/;

  const videoDirs: string[] = [];

  // videos/ directly under outputFolder (no profile)
  const topLevelVideos = join(outputFolder, 'videos');
  if (existsSync(topLevelVideos)) {
    videoDirs.push(topLevelVideos);
  }

  // <profile>/videos/ under outputFolder (when a profile is configured)
  const subdirs = readdirSync(outputFolder, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const subdir of subdirs) {
    const nested = join(outputFolder, subdir.name, 'videos');
    if (nested !== topLevelVideos && existsSync(nested)) {
      videoDirs.push(nested);
    }
  }

  const namedVideoMissing =
    !!expectedVideoName && !videoDirs.some(dir => existsSync(join(dir, `${expectedVideoName}.webm`)));
  const testStatus = test?.info()?.status;
  const testPassedOrSkipped = testStatus === 'passed' || testStatus === 'skipped';
  const saveFailure = namedVideoMissing && !testPassedOrSkipped;

  if (saveFailure) {
    console.log(`Named video '${expectedVideoName}.webm' not found — moving raw recordings to backups/`);
  }

  for (const videosDir of videoDirs) {
    for (const file of readdirSync(videosDir)) {
      if (!RAW_VIDEO_PATTERN.test(file)) continue;

      const filePath = join(videosDir, file);

      if (saveFailure) {
        try {
          const backupsDir = join(videosDir, 'backups');
          if (!existsSync(backupsDir)) {
            mkdirSync(backupsDir, { recursive: true });
          }
          const dest = join(backupsDir, file);
          renameSync(filePath, dest);
          console.log(`Moved raw video to backup: ${dest}`);
        } catch (e) {
          console.log(`Failed to move raw video file to backups: ${e}`);
        }
      } else {
        try {
          unlinkSync(filePath);
          console.log(`Removed raw video file: ${filePath}`);
        } catch (e) {
          console.log(`Failed to remove raw video file: ${e}`);
        }
      }
    }
  }
}
