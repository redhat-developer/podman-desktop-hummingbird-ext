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
import { HummingbirdApi } from '@podman-desktop/extension-hummingbird-core-api';
import type { Repository } from '@podman-desktop/extension-hummingbird-core-api';
import type { HummingbirdService } from '../services/hummingbird-service';

interface Dependencies {
  hummingbird: HummingbirdService;
}

export class HummingbirdApiImpl extends HummingbirdApi {
  constructor(protected readonly dependencies: Dependencies) {
    super();
  }

  override async all(): Promise<Array<Repository>> {
    return this.dependencies.hummingbird.getRepositories();
  }
}
