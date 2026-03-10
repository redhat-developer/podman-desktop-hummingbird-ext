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

class ColorScheme {
  protected static instance: ColorScheme | undefined = undefined;

  static build(): ColorScheme {
    if (ColorScheme.instance) {
      return ColorScheme.instance;
    }
    ColorScheme.instance = new ColorScheme();
    ColorScheme.instance.init();
    return ColorScheme.instance;
  }

  #mediaQuery: MediaQueryList;
  #theme: 'dark' | 'light' | undefined = $state(undefined);

  constructor() {
    this.#mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  protected onchange(event: MediaQueryListEvent): void {
    if (event.matches) {
      this.#theme = 'dark';
    } else {
      this.#theme = 'light';
    }
  }

  protected init(): ColorScheme {
    this.#mediaQuery.addEventListener('change', this.onchange.bind(this));
    return this;
  }

  get theme(): 'dark' | 'light' | undefined {
    return this.#theme;
  }
}

export const colorScheme = ColorScheme.build();
