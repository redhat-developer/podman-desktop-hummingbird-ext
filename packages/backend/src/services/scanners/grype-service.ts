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
import { extensions as extensionsAPI } from '@podman-desktop/api';
import type { AsyncInit } from '/@/utils/async-init';
import type { GrypeExtensionApi, grype } from '@podman-desktop/grype-extension-api';
import { injectable } from 'inversify';
import { VulnerabilitiesSummary } from '@podman-desktop/extension-hummingbird-core-api';

@injectable()
export class GrypeService implements AsyncInit, Disposable {
  #api: GrypeExtensionApi | undefined;

  get api(): GrypeExtensionApi {
    if (this.#api) {
      return this.#api;
    }
    this.#api = this.getGrypeAPI();
    return this.#api;
  }

  dispose(): void {
    this.#api = undefined;
  }

  public toVulnerabilitySummary(document: grype.Document): VulnerabilitiesSummary {
    return document.matches.reduce(
      (accumulator, match) => {
        switch (match.vulnerability.severity) {
          case 'high':
            accumulator.high++;
            break;
          case 'critical':
            accumulator.critical++;
            break;
          case 'medium':
            accumulator.medium++;
            break;
          case 'low':
            accumulator.low++;
            break;
          default:
            accumulator.unknown++;
            break;
        }
        accumulator.total++;

        return accumulator;
      },
      {
        critical: 0,
        high: 0,
        low: 0,
        medium: 0,
        negligible: 0,
        total: 0,
        unknown: 0,
      } as VulnerabilitiesSummary,
    );
  }

  protected getGrypeAPI(): GrypeExtensionApi {
    const grype = extensionsAPI.getExtension<GrypeExtensionApi>('podman-desktop.grype');
    if (grype) {
      return grype.exports;
    } else {
      throw new Error('cannot find the grype extension');
    }
  }

  async init(): Promise<void> {}
}
