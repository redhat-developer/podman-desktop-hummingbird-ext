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
import type { commands, Disposable } from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import type { RoutingService } from './routing-service';
import { ImageInfoUISchema } from '../schemas/image-info-ui';

interface Dependencies {
  commands: typeof commands;
  routes: RoutingService;
}

export const IMAGE_SCAN_CMD = 'hummingbird:image-scan';

export class CommandService implements AsyncInit, Disposable {
  #disposables: Disposable[] = [];

  constructor(protected readonly dependencies: Dependencies) {}

  dispose(): void {
    return this.#disposables.forEach(disposable => disposable.dispose());
  }

  async init(): Promise<void> {
    this.#disposables.push(this.dependencies.commands.registerCommand(IMAGE_SCAN_CMD, this.handleImageScan.bind(this)));
  }

  protected async handleImageScan(args: unknown): Promise<void> {
    console.log('handleImageScan', args);

    const result = ImageInfoUISchema.safeParse(args);
    if (!result.success) {
      throw result.error;
    }

    const { engineId, id } = result.data;

    return this.dependencies.routes.openImageAnalysisPage(engineId, id);
  }
}
