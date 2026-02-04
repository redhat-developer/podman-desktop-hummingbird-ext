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

/* ---------- Swagger types ---------- */

type SwaggerParameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'body' | 'formData';
};

type SwaggerOperation = {
  parameters?: SwaggerParameter[];
};

type SwaggerPathItem = {
  parameters?: SwaggerParameter[];
  [key: string]: unknown;
};

type SwaggerSpec = {
  paths?: Record<string, SwaggerPathItem>;
};

/* ---------- Type guards ---------- */

function isOperation(value: unknown): value is SwaggerOperation {
  return (
    typeof value === 'object' &&
    !!value &&
    'parameters' in value &&
    Array.isArray((value as { parameters?: unknown }).parameters)
  );
}

/* ---------- Deduper ---------- */

// eslint-disable-next-line sonarjs/no-invariant-returns
function dedupePathParameters(spec: SwaggerSpec): SwaggerSpec {
  if (!spec.paths) return spec;

  for (const pathItem of Object.values(spec.paths)) {
    if (!pathItem.parameters) continue;

    const pathParamKeys = new Set(pathItem.parameters.map(p => `${p.name}:${p.in}`));

    for (const value of Object.values(pathItem)) {
      if (!isOperation(value) || !value.parameters) continue;

      value.parameters = value.parameters.filter(p => !pathParamKeys.has(`${p.name}:${p.in}`));
    }
  }

  return spec;
}

export function swagger(): Plugin {
  return {
    name: 'vite-plugin-swagger',
    enforce: 'pre',
    configResolved: async (resolved): Promise<void> => {
      const generated = join(resolved.root, 'generated');
      await mkdir(generated, { recursive: true });

      const swaggerPath = join(generated, 'swagger.json');

      const response = await fetch(QUAY_IO_SWAGGER_URL);

      const spec = (await response.json()) as SwaggerSpec;
      /**
       * The quay swagger is not respecting the swagger spec, and they have some duplicate issue
       * https://github.com/quay/quay/pull/4998
       */
      const sanitized = dedupePathParameters(spec);

      await writeFile(swaggerPath, JSON.stringify(sanitized, undefined, 2), 'utf-8');

      await generateApi({
        input: swaggerPath,
        output: generated,
        fileName: 'quay-io-api.ts',
      });
    },
  };
}
