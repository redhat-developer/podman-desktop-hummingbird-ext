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
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/
import type { extensions, Disposable } from '@podman-desktop/api';
import type { AsyncInit } from '../../utils/async-init';
import type { GrypeExtensionApi } from '@podman-desktop/grype-extension-api';

interface Dependencies {
  extensionsAPI: typeof extensions;
}

export class GrypeService implements AsyncInit, Disposable {
  #api: GrypeExtensionApi | undefined;

  constructor(protected readonly dependencies: Dependencies) {}

  get api(): GrypeExtensionApi | undefined {
    return this.#api;
  }

  dispose(): void {
    this.#api = undefined;
  }

  async init(): Promise<void> {
    const grype = this.dependencies.extensionsAPI.getExtension<GrypeExtensionApi>('podman-desktop.grype');
    if (grype) {
      this.#api = grype.exports;
    } else {
      console.warn('cannot find the grype extension');
    }
  }
}
