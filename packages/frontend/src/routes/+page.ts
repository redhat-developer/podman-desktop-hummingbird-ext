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
import type { PageLoad } from './$types';
import type { SimpleImageInfo } from '@podman-desktop/extension-hummingbird-core-api';
import { imageAPI } from '/@/api/client';

interface Data {
  pulled?: Promise<Array<SimpleImageInfo>>;
  providerId?: string;
  connection?: string;
}

export const load: PageLoad = async ({ url, depends }): Promise<Data> => {
  depends('images:pulled');

  const providerId = url.searchParams.get('providerId') ?? undefined;
  const connection = url.searchParams.get('connection') ?? undefined;

  let pulled: Promise<Array<SimpleImageInfo>> | undefined = undefined;
  if (providerId && connection) {
    /**
     * The imageAPI.all is tricky as the call could take 50ms or 500ms or even a few seconds if using remote connections
     * The UI should be able to handle all cases, but the 50ms is annoying as we see the loading state flickering
     *
     * To solve this UI problem, we artificially delay the promise resolution to 500ms minimum
     */
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 500);

    pulled = Promise.all([
      imageAPI.all({
        connection: {
          providerId,
          name: connection,
        },
        registry: 'quay.io',
        organisation: 'hummingbird',
      }),
      promise,
    ]).then(([images]) => images);
  }
  return {
    pulled,
    providerId,
    connection,
  };
};
