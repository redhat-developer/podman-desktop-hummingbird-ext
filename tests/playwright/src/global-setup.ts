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

import { playwrightGlobalSetup } from '@podman-desktop/tests-playwright';

// Playwright requires a module path for globalSetup, while the framework only exports
// the setup as a function. Always run it: it installs the Chromium browser and clears
// stale output folders (the cleanup is skipped on CI, and locally with
// SKIP_REMOVE_FOLDER=true when the extension profile is preloaded).
export default async function globalSetup(): Promise<void> {
  await playwrightGlobalSetup();
}
