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

import { ProviderApi } from '@podman-desktop/extension-hummingbird-core-api';
import type { ProviderContainerConnectionDetailedInfo } from '@podman-desktop/extension-hummingbird-core-api';
import type { ProviderService } from '../services/provider-service';

interface Dependencies {
  providers: ProviderService;
}

export class ProviderApiImpl extends ProviderApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async all(): Promise<ProviderContainerConnectionDetailedInfo[]> {
    return this.dependencies.providers.all();
  }
}
