/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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
import type { InputBoxOptions, TelemetryLogger } from '@podman-desktop/api';
import { window as windowAPI, env as envAPI, Uri } from '@podman-desktop/api';
import { TelemetryEvents } from '../utils/telemetry-events';
import { injectable, inject } from 'inversify';
import { TelemetryLoggerSymbol } from '../inject/symbol';

@injectable()
export class DialogService {
  constructor(
    @inject(TelemetryLoggerSymbol)
    protected readonly telemetryLogger: TelemetryLogger,
  ) {}

  showWarningMessage(message: string, ...items: string[]): Promise<string | undefined> {
    return windowAPI.showWarningMessage(message, ...items);
  }

  showInputBox(options: InputBoxOptions): Promise<string | undefined> {
    return windowAPI.showInputBox(options);
  }

  showInformationMessage(message: string, ...items: string[]): Promise<string | undefined> {
    return windowAPI.showInformationMessage(message, ...items);
  }

  async openExternal(href: string): Promise<boolean> {
    const telemetry: Record<string, unknown> = {
      href,
    };
    try {
      const result = await envAPI.openExternal(Uri.parse(href));
      telemetry['opened'] = result;
      return result;
    } finally {
      this.telemetryLogger.logUsage(TelemetryEvents.OPEN_EXTERNAL, telemetry);
    }
  }
}
