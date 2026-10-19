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
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite'; // Add this

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.MODE,
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: { experimental: { async: true } },
      adapter: adapter({
        pages: '../backend/media',
        assets: '../backend/media',
        strict: false,
      }),
      prerender: { handleUnseenRoutes: 'ignore' },
      paths: { relative: false },
      output: { bundleStrategy: 'inline' },
    }),
    svelteTesting(),
  ],
  build: {
    // vite module preload option create dynamically a <link rel="modulepreload" ../>
    // preloading a module do not send referrer header
    // due to limitation with how podman-desktop serve static content, we cannot make request without referrer
    modulePreload: false,
    sourcemap: true,
  },
});
