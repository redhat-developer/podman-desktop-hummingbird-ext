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
import type { LocalContainer } from '../models/local-container';

export interface CloneOptions {
  stopBeforeClone: boolean;
  name: string;
}

export interface CloneResult {
  engineId: string;
  Id: string;
}

export abstract class ContainerApi {
  static readonly CHANNEL: string = 'container-api';

  /**
   * Get a single container's information
   */
  abstract getContainer(engineId: string, containerId: string): Promise<LocalContainer>;

  /**
   * Clone a container with a Hummingbird alternative base image
   */
  abstract clone(
    engineId: string,
    containerId: string,
    alternativeImage: string,
    options: CloneOptions,
  ): Promise<CloneResult>;
}
