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
import { ImageService } from '/@/services/image-service';
import { ProviderService } from '/@/services/provider-service';
import { inject, injectable } from 'inversify';

@injectable()
export class ImageApiImpl extends ImageApi {
  constructor(
    @inject(ProviderService)
    protected readonly providers: ProviderService,
    @inject(ImageService)
    protected readonly images: ImageService,
  ) {
    super();
  }

  override pull(options: {
    image: string;
    connection: ProviderContainerConnectionIdentifierInfo;
  }): Promise<SimpleImageInfo> {
    const connection = this.providers.getProviderContainerConnection(options.connection);
    return this.images.pull({
      image: options.image,
      connection,
    });
  }

  override all(options: {
    registry: string;
    organisation: string;
    connection: ProviderContainerConnectionIdentifierInfo;
  }): Promise<Array<SimpleImageInfo>> {
    const connection = this.providers.getProviderContainerConnection(options.connection);
    return this.images.all({
      registry: options.registry,
      organisation: options.organisation,
      connection,
    });
  }

  override navigateToImageDetails(image: SimpleImageInfo): Promise<void> {
    return this.images.navigateToImageDetails(image);
  }
}
