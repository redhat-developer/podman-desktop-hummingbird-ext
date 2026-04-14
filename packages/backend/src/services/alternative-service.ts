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
import { inject, injectable, postConstruct, preDestroy } from 'inversify';
import { TelemetryLoggerSymbol } from '../inject/symbol';
import {
  CancellationTokenSource,
  containerEngine as containerEngineAPI,
  Disposable,
  ImageInspectInfo,
  TelemetryLogger,
} from '@podman-desktop/api';
import { HummingbirdService } from './hummingbird-service';
import type {
  LocalImageAlternative,
  LocalImageAlternativeReport,
  LocalContainer,
  ImageSummary,
  OptimisationReport,
  VulnerabilitiesSummary,
  AlternativeReport,
  SBOMReport,
} from '@podman-desktop/extension-hummingbird-core-api';
import alt from '../assets/alt.json' with { type: 'json' };
import { GrypeService } from './scanners/grype-service';
import { PromiseQueue } from '../utils/promise-queue';
import { Publisher } from '/@/utils/publisher';
import { WebviewService } from '/@/services/webview-service';
import { Messages } from '@podman-desktop/extension-hummingbird-core-api';
import type { AsyncInit } from '/@/utils/async-init';
import { z } from 'zod';

const ContainerEvent = z.object({
  Type: z.literal('container'),
  Action: z.literal(['init', 'remove']),
  Actor: z.object({
    Attributes: z.object({
      image: z.string().min(1),
    }),
  }),
});

const ImageEvent = z.object({
  Type: z.literal('image'),
  Action: z.literal(['pull', 'delete']),
  Actor: z.object({
    Attributes: z.object({
      name: z.string(),
    }),
  }),
});

@injectable()
export class AlternativeService extends Publisher<void> implements AsyncInit, Disposable {
  #altMap: Map<string, string>;
  #queue: PromiseQueue = new PromiseQueue(2);
  #cancellationToken = new CancellationTokenSource();
  #disposables: Disposable[] = [];

  constructor(
    @inject(TelemetryLoggerSymbol)
    protected readonly telemetryLogger: TelemetryLogger,
    @inject(HummingbirdService)
    protected readonly hummingbirdService: HummingbirdService,
    @inject(GrypeService)
    protected readonly grypeService: GrypeService,
    @inject(WebviewService)
    webviewService: WebviewService,
  ) {
    super(webviewService, Messages.UPDATE_ALTERNATIVES, () => {});

    // Create reverse mapping: from alternative repo to hummingbird image name
    this.#altMap = new Map(
      Object.entries(alt).reduce(
        (accumulator, [key, { alts }]) => {
          alts.forEach(altRepo => {
            accumulator.push([altRepo, key]);
          });
          return accumulator;
        },
        [] as [string, string][],
      ),
    );
  }

  protected hasAlternative(image: string): boolean {
    const [repo] = image.split(':');
    return this.#altMap.has(repo);
  }

  @postConstruct()
  async init(): Promise<void> {
    this.#disposables.push(
      containerEngineAPI.onEvent(event => {
        const containerEventParseResult = ContainerEvent.safeParse(event);
        if (containerEventParseResult.success) {
          if (this.hasAlternative(containerEventParseResult.data.Actor.Attributes.image)) {
            return this.notify();
          } else {
            return;
          }
        }

        const imageEventParseResult = ImageEvent.safeParse(event);
        if (imageEventParseResult.success) {
          if (this.hasAlternative(imageEventParseResult.data.Actor.Attributes.name)) {
            return this.notify();
          } else {
            return;
          }
        }
      }),
    );
  }

  // Map of Hummingbird image name -> Hummingbird image
  #cache: Map<string, ImageSummary> | undefined = undefined;
  protected async getHummingbirdImageSummary(name: string): Promise<ImageSummary> {
    if (!this.#cache) {
      const hummingbirdImages = await this.hummingbirdService.getImages();
      this.#cache = new Map(hummingbirdImages.map(img => [img.name, img]));
    }
    const image = this.#cache.get(name);
    if (!image) {
      throw new Error(`Cannot find Hummingbird image ${name}`);
    }
    return image;
  }

  public async getAlternative(engineId: string, imageId: string): Promise<ImageSummary> {
    const image = await containerEngineAPI.getImageInspect(engineId, imageId);
    const [repo] = image.RepoTags[0].split(':');

    // Check if this image has a Hummingbird alternative
    const hummingbirdImageName = this.#altMap.get(repo);
    if (!hummingbirdImageName) throw new Error(`Cannot find Hummingbird alternative for ${repo}`);

    return this.getHummingbirdImageSummary(hummingbirdImageName);
  }

  public async getAlternatives(): Promise<Array<LocalImageAlternative>> {
    const results: LocalImageAlternative[] = [];

    // Get all images & containers from all engines
    const [images, containers] = await Promise.all([
      containerEngineAPI.listImages(),
      containerEngineAPI.listContainers(),
    ]);

    // ImageId -> Container
    const containerMap: Map<string, Array<LocalContainer>> = containers.reduce((accumulator, container) => {
      const array = accumulator.get(container.ImageID) ?? [];
      array.push({
        engineId: container.engineId,
        id: container.Id,
        name: container.Names[0],
        imageID: container.ImageID,
      });
      accumulator.set(container.ImageID, array);

      return accumulator;
    }, new Map<string, Array<LocalContainer>>());

    for (const image of images) {
      if (!image.RepoTags || image.RepoTags.length === 0) continue;

      for (const repoTag of image.RepoTags) {
        const [repo, tag] = repoTag.split(':');

        // Check if this image has a Hummingbird alternative
        const hummingbirdImageName = this.#altMap.get(repo);
        if (!hummingbirdImageName) continue;

        const hummingbirdImage = await this.getHummingbirdImageSummary(hummingbirdImageName);

        // https://github.com/podman-desktop/podman-desktop/issues/16967
        if (!('Arch' in image) || typeof image.Arch !== 'string') {
          console.warn('missing arch on image', image);
          continue;
        }

        if (hummingbirdImage) {
          // Only add if we have a valid alternative
          results.push({
            localImage: {
              id: image.Id,
              engineId: image.engineId,
              name: repo,
              tag: tag ?? 'latest',
              size: image.Size,
              architecture: image.Arch,
              containers: containerMap.get(image.Id) ?? [],
            },
            alternative: hummingbirdImage,
          });
        }

        // Only add once per image
        break;
      }
    }

    return results;
  }

  public async getAlternativeReport({
    alternative,
    localImage,
  }: LocalImageAlternative): Promise<LocalImageAlternativeReport> {
    // Get all tags
    const tags = await this.hummingbirdService.getTags(alternative.name);
    const tag = tags.find(tag => tag.name === alternative.latest_tag);

    if (!tag) throw new Error(`Cannot find tag ${alternative.latest_tag} for ${alternative.name}`);

    console.log(
      `enqueuing getVulnerabilitiesSummary & this.grypeService.api.vulnerability for ${localImage.engineId}:${localImage.id}`,
    );
    const [altVulnerabilities, localVulnerabilities] = await this.#queue
      .enqueue(() =>
        Promise.all([
          this.hummingbirdService.getVulnerabilitiesSummary(alternative.name, tag.canonical),
          this.grypeService.api.vulnerability.analyse(
            {
              engineId: localImage.engineId,
              Id: localImage.id,
            },
            {
              task: {
                title: `Scanning ${localImage.name}:${localImage.tag}`,
              },
              token: this.#cancellationToken.token,
            },
          ),
        ]),
      )
      .catch((err: unknown) => {
        console.error(`Error enqueuing vulnerability scan for ${localImage.engineId}:${localImage.id}`, err);
        throw err;
      });
    console.log(`enqueuing resolved for ${localImage.engineId}:${localImage.id}`);

    return {
      localImage: {
        vulnerabilities: this.grypeService.toVulnerabilitySummary(localVulnerabilities),
        size: localImage.size,
      },
      alternative: {
        vulnerabilities: altVulnerabilities,
        size: tag.sizes[localImage.architecture] ?? NaN,
      },
    };
  }

  protected async getSBOMReport(image: ImageInspectInfo): Promise<SBOMReport | undefined> {
    if (!this.grypeService.api) return undefined;

    const doc = await this.grypeService.api.sbom.analyse(
      {
        engineId: image.engineId,
        Id: image.Id,
      },
      {
        task: {
          title: `Analysing image ${image.RepoTags[0] ?? image.Id}`,
        },
      },
    );

    return {
      count: doc.artifacts.length,
      packages: doc.artifacts.map(artifact => artifact.name),
    };
  }

  protected async findAlternative(imageInspect: ImageInspectInfo): Promise<AlternativeReport> {
    const alternative = await this.getAlternative(imageInspect.engineId, imageInspect.Id);

    const imageSummary = await this.hummingbirdService.getImage(alternative.name);
    const tags = await this.hummingbirdService.getTags(alternative.name);
    const vulnerabilities = await this.hummingbirdService.getVulnerabilities(alternative.name, imageSummary.latest_tag);
    const sbom = await this.hummingbirdService.getSbom(alternative.name, imageSummary.latest_tag);

    return {
      image: imageSummary,
      sbom: sbom[imageInspect.Architecture],
      tags: tags,
      vulnerabilities,
    };
  }

  protected async findVulnerabilities(image: ImageInspectInfo): Promise<VulnerabilitiesSummary | undefined> {
    if (!this.grypeService.isInstalled()) return undefined;

    const doc = await this.grypeService.api.vulnerability.analyse(
      {
        engineId: image.engineId,
        Id: image.Id,
      },
      {
        task: {
          title: `Scanning image ${image.RepoTags[0] ?? image.Id} for vulnerabilities`,
        },
      },
    );

    return this.grypeService.toVulnerabilitySummary(doc);
  }

  public async getOptimisationReport(engineId: string, imageId: string): Promise<OptimisationReport> {
    const imageInspectInfo = await containerEngineAPI.getImageInspect(engineId, imageId);

    const alternative = await this.findAlternative(imageInspectInfo);
    const sbom = await this.getSBOMReport(imageInspectInfo);
    const vulnerabilities = await this.findVulnerabilities(imageInspectInfo);

    return {
      image: {
        inspect: imageInspectInfo,
        sbom,
        vulnerabilities,
      },
      alternative: alternative,
    };
  }

  @preDestroy()
  override dispose(): void {
    super.dispose();
    this.#cancellationToken.cancel();
    this.#disposables.forEach(disposable => disposable.dispose());
  }
}
