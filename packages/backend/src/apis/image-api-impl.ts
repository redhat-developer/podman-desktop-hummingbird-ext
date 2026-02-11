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
import type {
  ProviderContainerConnectionIdentifierInfo,
  SimpleImageInfo,
} from '@podman-desktop/extension-hummingbird-core-api';
import { ImageApi } from '@podman-desktop/extension-hummingbird-core-api';
import type { ImageService } from '../services/image-service';
import type { ProviderService } from '../services/provider-service';

interface Dependencies {
  images: ImageService;
  providers: ProviderService;
}

export class ImageApiImpl extends ImageApi {
  constructor(protected readonly dependencies: Dependencies) {
    super();
  }

  override pull(options: {
    image: string;
    connection: ProviderContainerConnectionIdentifierInfo;
  }): Promise<SimpleImageInfo> {
    const connection = this.dependencies.providers.getProviderContainerConnection(options.connection);
    return this.dependencies.images.pull({
      image: options.image,
      connection,
    });
  }

  override all(options: {
    registry: string;
    organisation: string;
    connection: ProviderContainerConnectionIdentifierInfo;
  }): Promise<Array<SimpleImageInfo>> {
    const connection = this.dependencies.providers.getProviderContainerConnection(options.connection);
    return this.dependencies.images.all({
      registry: options.registry,
      organisation: options.organisation,
      connection,
    });
  }

  override navigateToImageDetails(image: SimpleImageInfo): Promise<void> {
    return this.dependencies.images.navigateToImageDetails(image);
  }
}
