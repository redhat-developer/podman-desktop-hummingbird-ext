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

import { ContainerModule } from 'inversify';
import { DialogService } from './dialog-service';
import { StartupSymbol } from '../inject/symbol';
import { HummingbirdService } from './hummingbird-service';
import { WebviewService } from './webview-service';
import { ImageService } from './image-service';
import { RoutingService } from './routing-service';
import { ProviderService } from './provider-service';
import { PodmanService } from './podman-service';

const module = new ContainerModule(options => {
  options.bind<DialogService>(DialogService).toSelf().inSingletonScope();
  options.bind<HummingbirdService>(HummingbirdService).toSelf().inSingletonScope();
  options.bind<ImageService>(ImageService).toSelf().inSingletonScope();
  options.bind<PodmanService>(PodmanService).toSelf().inSingletonScope();
  options.bind<ProviderService>(ProviderService).toSelf().inSingletonScope();
  options.bind<WebviewService>(WebviewService).toSelf().inSingletonScope();
  options.bind<RoutingService>(RoutingService).toSelf().inSingletonScope();

  // mark it as a startup service
  options.bind(StartupSymbol).toService(DialogService);
  options.bind(StartupSymbol).toService(WebviewService);
});

export { module };
