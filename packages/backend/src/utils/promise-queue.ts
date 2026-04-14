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
/**
 * A queue that limits the number of concurrent promise executions.
 * When the limit is reached, new promises are queued and executed as previous ones complete.
 */
export class PromiseQueue {
  private queue: Array<() => void> = [];
  private running: number = 0;
  private maxConcurrent: number;

  /**
   * Creates a new PromiseQueue
   * @param maxConcurrent - Maximum number of promises that can run concurrently (default: 1)
   */
  constructor(maxConcurrent: number = 2) {
    if (maxConcurrent < 1) {
      throw new Error('maxConcurrent must be at least 1');
    }
    this.maxConcurrent = maxConcurrent;
  }

  protected onCompleted(): void {
    this.running--;
    this.processNext();
  }

  /**
   * Enqueues a function that returns a promise.
   * Returns a promise that resolves/rejects when the enqueued function's promise resolves/rejects.
   * @param fn - Function that returns a promise
   * @returns Promise that resolves with the same value as the input function's promise
   */
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = (): void => {
        this.running++;

        let promise: Promise<T>;
        // eslint-disable-next-line sonarjs/no-try-promise
        try {
          promise = fn();
        } catch (err: unknown) {
          reject(err);
          this.onCompleted();
          return;
        }

        promise.then(resolve).catch(reject).finally(this.onCompleted.bind(this));
      };

      this.queue.push(task);
      this.processNext();
    });
  }

  /**
   * Processes the next task in the queue if capacity is available
   */
  private processNext(): void {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      task();
    }
  }

  /**
   * Returns the number of currently running tasks
   */
  get runningCount(): number {
    return this.running;
  }

  /**
   * Returns the number of tasks waiting in the queue
   */
  get queuedCount(): number {
    return this.queue.length;
  }
}
