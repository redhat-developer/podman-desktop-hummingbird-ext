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
import type { ExtensionContext } from '@podman-desktop/api';
import {
  containerEngine,
  extensions,
  provider,
  process as processApi,
  env,
  window,
  cli as cliApi,
  commands as commandsApi,
  configuration as configurationApi,
  navigation as navigationApi,
} from '@podman-desktop/api';
import { MainService } from './services/main-service';

let main: MainService | undefined;

// Initialize the activation of the extension.
export async function activate(extensionContext: ExtensionContext): Promise<void> {
  main = new MainService({
    window: window,
    extensionContext,
    env,
    extensions,
    processApi: processApi,
    providers: provider,
    cliApi: cliApi,
    commandsApi: commandsApi,
    containers: containerEngine,
    configuration: configurationApi,
    navigationApi: navigationApi,
  });
  return main.init();
}

export async function deactivate(): Promise<void> {
  main?.dispose();
  main = undefined;
}
