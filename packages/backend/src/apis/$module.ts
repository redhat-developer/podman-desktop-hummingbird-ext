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
import { DialogApiImpl } from './dialog-api-impl';
import { ContainerModule } from 'inversify';
import { HummingbirdApiImpl } from './hummingbird-api-impl';
import { ImageApiImpl } from './image-api-impl';
import { ProviderApiImpl } from './provider-api-impl';
import { RoutingApiImpl } from './routing-api-impl';

const module = new ContainerModule(options => {
  const impls: Array<new (...args: never[]) => unknown> = [
    DialogApiImpl,
    HummingbirdApiImpl,
    ImageApiImpl,
    ProviderApiImpl,
    RoutingApiImpl,
  ];

  impls.forEach(implementation => {
    options.bind(implementation).toSelf().inSingletonScope();
  });
});

export { module };
