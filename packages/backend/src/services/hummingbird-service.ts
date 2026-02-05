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
import type { QuayIOService } from './quay-io-service';
import type { Disposable } from '@podman-desktop/api';
import type { Repository } from '@podman-desktop/extension-hummingbird-core-api';

export const QUAY_HUMMING_BIRD_ORGANISATION = 'hummingbird';

interface Dependencies {
  quay: QuayIOService;
}

export class HummingbirdService implements Disposable {
  #cache: Array<Repository> | undefined;

  constructor(protected readonly dependencies: Dependencies) {}

  public async getRepositories(): Promise<Array<Repository>> {
    if (this.#cache) return this.#cache;

    const results = await this.dependencies.quay.listRepos({ organisation: QUAY_HUMMING_BIRD_ORGANISATION });
    this.#cache = results.repositories;
    return this.#cache;
  }

  dispose(): void {}
}
