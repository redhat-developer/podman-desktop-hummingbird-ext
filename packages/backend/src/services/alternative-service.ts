import { inject, injectable } from 'inversify';
import { TelemetryLoggerSymbol } from '../inject/symbol';
import type { TelemetryLogger } from '@podman-desktop/api';
import { containerEngine as containerEngineAPI } from '@podman-desktop/api';
import { HummingbirdService } from './hummingbird-service';
import { LocalImageAlternative } from '@podman-desktop/extension-hummingbird-core-api';
import alt from '../assets/alt.json' with { type: 'json' };

@injectable()
export class AlternativeService {
  #altMap: Map<string, string>;

  constructor(
    @inject(TelemetryLoggerSymbol)
    protected readonly telemetryLogger: TelemetryLogger,
    @inject(HummingbirdService)
    protected readonly hummingbirdService: HummingbirdService,
  ) {
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

  public async getAlternatives(): Promise<Array<LocalImageAlternative>> {
    const results: LocalImageAlternative[] = [];

    // Get all images from all engines
    const images = await containerEngineAPI.listImages();

    // Get all Hummingbird images from API
    const hummingbirdImages = await this.hummingbirdService.getImages();
    const hummingbirdMap = new Map(hummingbirdImages.map(img => [img.name, img]));

    for (const image of images) {
      if (!image.RepoTags || image.RepoTags.length === 0) continue;

      for (const repoTag of image.RepoTags) {
        const [repo, tag] = repoTag.split(':');

        // Check if this image has a Hummingbird alternative
        const hummingbirdImageName = this.#altMap.get(repo);
        if (!hummingbirdImageName) continue;

        const hummingbirdImage = hummingbirdMap.get(hummingbirdImageName);

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
              tag: tag || 'latest',
              size: image.Size,
              architecture: image.Arch,
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
}
