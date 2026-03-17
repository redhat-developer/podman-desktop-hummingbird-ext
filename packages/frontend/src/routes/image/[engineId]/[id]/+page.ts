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
import type { OptimisationReport } from '@podman-desktop/extension-hummingbird-core-api';
import type { PageLoad } from './$types';
import { hummingbirdAPI } from '/@/api/client';

interface Data {
  engineId: string;
  report: Promise<OptimisationReport>
}

export const load: PageLoad = async ({ params }): Promise<Data> => {
  const engineId = decodeURIComponent(params.engineId);
  const imageId = decodeURIComponent(params.id);

  return {
    engineId,
    report: hummingbirdAPI.getOptimisationReport(engineId, imageId),
  };
};
