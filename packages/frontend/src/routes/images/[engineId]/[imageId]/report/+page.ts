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
import { alternativesAPI } from '#api/client.js';
import { IMAGE_QUERY_KEY } from '#routes/images/[engineId]/[imageId]/report/constants.js';

export const load: PageLoad = async ({ params, url }) => {
  const engineId = decodeURIComponent(params.engineId);
  const imageId = decodeURIComponent(params.imageId);

  const isGrypeInstalled = await alternativesAPI.isGrypeInstalled();

  const image = url.searchParams.get(IMAGE_QUERY_KEY);

  return {
    label: image ?? 'Optimisation report',
    engineId,
    isGrypeInstalled,
    image: image ?? '<unknown>',
    report: alternativesAPI.getOptimisationReport(engineId, imageId),
  };
};
