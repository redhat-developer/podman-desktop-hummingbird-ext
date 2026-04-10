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
import type { ImageSummary, Tag, VulnerabilitiesSummary } from '@podman-desktop/extension-hummingbird-core-api';
import { Api } from '@podman-desktop/extension-hummingbird-core-api';
import { injectable, preDestroy } from 'inversify';

@injectable()
export class HummingbirdService implements Disposable {
  #cache: Array<ImageSummary> | undefined;
  #client: Api<unknown>;

  constructor() {
    this.#client = new Api({
      baseUrl: 'https://api-rawhide.hummingbird-project.io',
    });
  }

  public async getImages(): Promise<Array<ImageSummary>> {
    if (this.#cache) return this.#cache;

    const res = await this.#client.v1.getImages();
    this.#cache = res.data.images;

    return this.#cache;
  }

  public async getVulnerabilitiesSummary(image: string, canonical: string): Promise<VulnerabilitiesSummary> {
    const res = await this.#client.v1.getVulnerabilities(image, canonical);
    return res.data.summary;
  }

  public async getTags(image: string): Promise<Array<Tag>> {
    const res = await this.#client.v1.getTags(image);
    return res.data.tags;
  }
  @preDestroy()
  dispose(): void {}
}
