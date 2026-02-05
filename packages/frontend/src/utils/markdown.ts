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
import { marked } from 'marked';
import type { Tokens } from 'marked';

/**
 * Returns the first paragraph that appears after the first heading.
 * If no matching heading or paragraph is found, returns null.
 */
export function getFirstParagraphAfterFirstHeading(markdown: string): string | undefined {
  const lexer = new marked.Lexer();
  const tokens = lexer.lex(markdown);

  let seenHeading = false;

  for (const token of tokens) {
    if (token.type === 'heading' && !seenHeading) {
      seenHeading = true;
      continue;
    }

    if (seenHeading && token.type === 'paragraph') {
      const text = (token as Tokens.Paragraph).text;
      return marked.parse(text, { async: false });
    }
  }

  return undefined;
}
