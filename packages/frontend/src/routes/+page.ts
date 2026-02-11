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
import type { Repository } from '@podman-desktop/extension-hummingbird-core-api';
import { hummingbirdAPI } from '/@/api/client';

interface Data {
  repositories: Promise<Array<Repository>>;
  providerId: string | undefined;
  connection: string | undefined;
}

export const load: PageLoad = async ({ url }): Promise<Data> => {
  return {
    repositories: hummingbirdAPI.all(),
    providerId: url.searchParams.get('providerId') ?? undefined,
    connection: url.searchParams.get('connection') ?? undefined,
  };
};
