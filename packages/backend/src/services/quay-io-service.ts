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
import type { Disposable } from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import { Api } from '/@generated/quay-io-api';
import type { RepositoriesResponse } from '@hummingbird/core-api';
import { RepositoriesResponseSchema } from '@hummingbird/core-api';

export class QuayIOService implements Disposable, AsyncInit {
  #client: Api<unknown>;

  constructor() {
    this.#client = new Api();
  }

  public async listRepos(options: { organisation: string }): Promise<RepositoriesResponse> {
    const res = await this.#client.api.listRepos({
      public: true,
      namespace: options.organisation,
      last_modified: true,
    });
    const data = await res.json();
    return RepositoriesResponseSchema.parse(data);
  }

  dispose(): void {}
  async init(): Promise<void> {}
}
