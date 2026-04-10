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
import {
  AlternativesApi,
  ImageSummary,
  LocalImageAlternative,
  LocalImageAlternativeReport,
} from '@podman-desktop/extension-hummingbird-core-api';
import { inject, injectable } from 'inversify';
import { AlternativeService } from '../services/alternative-service';

@injectable()
export class AlternativesApiImpl extends AlternativesApi {
  constructor(
    @inject(AlternativeService)
    protected readonly alternativeService: AlternativeService,
  ) {
    super();
  }

  override async getAlternatives(): Promise<LocalImageAlternative[]> {
    return this.alternativeService.getAlternatives();
  }

  override getAlternative(engineId: string, imageId: string): Promise<ImageSummary> {
    return this.alternativeService.getAlternative(engineId, imageId);
  }

  override getAlternativeReport(alternative: LocalImageAlternative): Promise<LocalImageAlternativeReport> {
    return this.alternativeService.getAlternativeReport(alternative);
  }
}
