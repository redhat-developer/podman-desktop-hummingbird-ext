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
import { RoutingApi } from '@podman-desktop/extension-hummingbird-core-api';
import { RoutingService } from '/@/services/routing-service';
import { inject, injectable } from 'inversify';
import { navigation } from '@podman-desktop/api';

@injectable()
export class RoutingApiImpl extends RoutingApi {
  constructor(
    @inject(RoutingService)
    protected readonly routing: RoutingService,
  ) {
    super();
  }

  override async readRoute(): Promise<string | undefined> {
    return this.routing.read();
  }

  override navigateToCatalog(searchTerm?: string): Promise<void> {
    return navigation.navigateToExtensionsCatalog({
      searchTerm,
    });
  }

  override navigateToContainerDetails(_: string, containerId: string): Promise<void> {
    return navigation.navigateToContainer(containerId);
  }
}
