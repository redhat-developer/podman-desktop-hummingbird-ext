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
import type { ImageSummary } from '../generated/hummingbird-project';
import type { LocalImageAlternative } from '../models/local-image-alternative';
import type { LocalImageAlternativeReport } from '../models/local-image-alternative-report';
import type { OptimisationReport } from '../models/optimization-report';

export abstract class AlternativesApi {
  static readonly CHANNEL: string = 'alternatives-api';

  /**
   * Get all local images that have Hummingbird alternatives
   */
  abstract getAlternatives(): Promise<Array<LocalImageAlternative>>;

  abstract getAlternative(engineId: string, imageId: string): Promise<ImageSummary>;

  /**
   * Given a pair Local Image <-> Hummingbird alternative, get the report
   * @param alternative
   */
  abstract getAlternativeReport(alternative: LocalImageAlternative): Promise<LocalImageAlternativeReport>;

  abstract getOptimisationReport(engineId: string, imageId: string): Promise<OptimisationReport>;
}
