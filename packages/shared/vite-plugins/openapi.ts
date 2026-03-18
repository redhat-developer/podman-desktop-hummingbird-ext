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
import type { Plugin } from 'vite';
import { generateApi } from 'swagger-typescript-api';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const HUMMINGBIRD_SERVER_OPEN_API_URL = 'https://api-rawhide.hummingbird-project.io/v1/openapi.json';

export function openapi(): Plugin {
  return {
    name: 'vite-plugin-openapi',
    enforce: 'pre',
    configResolved: async (resolved): Promise<void> => {
      const generated = join(resolved.root, 'src', 'generated');
      await mkdir(generated, { recursive: true });

      const swaggerPath = join(generated, 'openapi.json');

      const response = await fetch(HUMMINGBIRD_SERVER_OPEN_API_URL);

      await writeFile(swaggerPath, JSON.stringify(await response.json(), undefined, 2), 'utf-8');

      await generateApi({
        input: swaggerPath,
        output: generated,
        fileName: 'hummingbird-project.ts',
      });
    },
  };
}
