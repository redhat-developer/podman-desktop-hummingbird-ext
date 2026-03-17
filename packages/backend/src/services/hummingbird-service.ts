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
import type { containerEngine, Disposable, ImageInfo, ImageInspectInfo } from '@podman-desktop/api';
import { Api } from '@podman-desktop/extension-hummingbird-core-api';
import type {
  Alternative,
  OptimisationReport,
  SBOMReport,
  ImageSummary,
  VulnerabilitiesSummary,
} from '@podman-desktop/extension-hummingbird-core-api';
import type { GrypeService } from './scanners/grype-service';
import alt from '../assets/alt.json' with { type: 'json' };

interface Dependencies {
  containersAPI: typeof containerEngine;
  grype: GrypeService;
}

export class HummingbirdService implements Disposable {
  #cache: Array<ImageSummary> | undefined;
  #client: Api<unknown>;

  #altMap: Map<string, string> = new Map(
    Object.entries(alt).reduce(
      (accumulator, [key, { alts }]) => {
        console.log(key, alts);
        alts.forEach(alt => {
          accumulator.push([alt, key]);
        });
        return accumulator;
      },
      [] as [string, string][],
    ),
  );

  constructor(protected readonly dependencies: Dependencies) {
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

  protected async findAlternative(imageInspect: ImageInspectInfo): Promise<Alternative | undefined> {
    for (const repoTag of imageInspect.RepoTags) {
      const [repo] = repoTag.split(':');
      const imageName = this.#altMap.get(repo);
      if (imageName) {
        const { data: imageSummary } = await this.#client.v1.getImage(imageName);
        const { data: tags } = await this.#client.v1.getTags(imageName);
        const { data: vulnerabilities } = await this.#client.v1.getVulnerabilities(imageName, imageSummary.latest_tag);
        const { data: sbom } = await this.#client.v1.getSbom(imageName, imageSummary.latest_tag);

        return {
          image: imageSummary,
          sbom: sbom[imageInspect.Architecture],
          tags: tags.tags,
          vulnerabilities,
        };
      }
    }
    return undefined;
  }

  protected async getSBOMReport(image: ImageInspectInfo): Promise<SBOMReport | undefined> {
    if (!this.dependencies.grype.api) return undefined;

    const doc = await this.dependencies.grype.api.sbom.analyse({
      engineId: image.engineId,
      Id: image.Id,
    } as unknown as ImageInfo);

    return {
      count: doc.artifacts.length,
      packages: doc.artifacts.map((artifact) => artifact.name),
    };
  }

  protected async findVulnerabilities(image: ImageInspectInfo): Promise<VulnerabilitiesSummary | undefined> {
    if (!this.dependencies.grype.api) return undefined;

    const doc = await this.dependencies.grype.api.vulnerability.analyse({
      engineId: image.engineId,
      Id: image.Id,
    } as unknown as ImageInfo);

    return doc.matches.reduce(
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

  public async getOptimisationReport(engineId: string, imageId: string): Promise<OptimisationReport> {
    const imageInspectInfo = await this.dependencies.containersAPI.getImageInspect(engineId, imageId);

    const [alternative, sbom, vulns] = await Promise.allSettled([
      this.findAlternative(imageInspectInfo),
      this.getSBOMReport(imageInspectInfo),
      this.findVulnerabilities(imageInspectInfo),
    ]);

    return {
      alternative: alternative.status === 'fulfilled' ? alternative.value : undefined,
      inspect: {
        size: imageInspectInfo.Size,
      },
      sbom: sbom.status === 'fulfilled' ? sbom.value : undefined,
      vulnerabilities: vulns.status === 'fulfilled' ? vulns.value : undefined,
    };
  }

  dispose(): void {}
}
