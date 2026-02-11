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

export const QUAY_IO_SWAGGER_URL = 'https://quay.io/api/v1/discovery';

export function swagger(): Plugin {
  return {
    name: 'vite-plugin-swagger',
    enforce: 'pre',
    configResolved: async (resolved): Promise<void> => {
      const generated = join(resolved.root, 'generated');
      await mkdir(generated, { recursive: true });

      const swaggerPath = join(generated, 'swagger.json');

      const response = await fetch(QUAY_IO_SWAGGER_URL);

      await writeFile(swaggerPath, JSON.stringify(await response.json(), undefined, 2), 'utf-8');

      await generateApi({
        input: swaggerPath,
        output: generated,
        fileName: 'quay-io-api.ts',
      });
    },
  };
}
