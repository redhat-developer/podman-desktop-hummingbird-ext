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
import { describe, expect, test, vi } from 'vitest';
import { PromiseQueue } from './promise-queue';

describe('PromiseQueue', () => {
  test('should execute a single task', async () => {
    const queue = new PromiseQueue();
    const result = await queue.enqueue(async () => 'hello');
    expect(result).toBe('hello');
  });

  test('should preserve return types', async () => {
    const queue = new PromiseQueue();
    const numberResult = await queue.enqueue(async () => 42);
    const stringResult = await queue.enqueue(async () => 'test');
    const objectResult = await queue.enqueue(async () => ({ id: 1 }));

    expect(numberResult).toBe(42);
    expect(stringResult).toBe('test');
    expect(objectResult).toEqual({ id: 1 });
  });

  test('should respect concurrency limit', async () => {
    const queue = new PromiseQueue(2);
    const { promise: p1, resolve: r1 } = Promise.withResolvers<number>();
    const { promise: p2, resolve: r2 } = Promise.withResolvers<number>();
    const { promise: p3, resolve: r3 } = Promise.withResolvers<number>();

    // Enqueue 3 tasks
    queue.enqueue(() => p1).catch(console.error);
    queue.enqueue(() => p2).catch(console.error);
    queue.enqueue(() => p3).catch(console.error);

    // With limit of 2, only 2 should be running
    expect(queue.runningCount).toBe(2);
    expect(queue.queuedCount).toBe(1);

    // Complete one task
    r1(1);
    await new Promise(resolve => setTimeout(resolve, 0));

    // Now the third should start
    expect(queue.runningCount).toBe(2);
    expect(queue.queuedCount).toBe(0);

    // Complete remaining
    r2(2);
    r3(3);
  });

  test('should process queued tasks as running tasks complete', async () => {
    const queue = new PromiseQueue(1);
    const { promise: p1, resolve: r1 } = Promise.withResolvers<string>();
    const { promise: p2, resolve: r2 } = Promise.withResolvers<string>();

    const result1Promise = queue.enqueue(() => p1);
    const result2Promise = queue.enqueue(() => p2);

    expect(queue.runningCount).toBe(1);
    expect(queue.queuedCount).toBe(1);

    // Complete first task
    r1('first');
    const result1 = await result1Promise;
    expect(result1).toBe('first');

    // Second task should now be running

    await vi.waitFor(() => {
      expect(queue.runningCount).toBe(1);
      expect(queue.queuedCount).toBe(0);
    });

    // Complete second task
    r2('second');
    const result2 = await result2Promise;

    expect(result2).toBe('second');

    await vi.waitFor(() => {
      expect(queue.runningCount).toBe(0);
      expect(queue.queuedCount).toBe(0);
    });
  });

  test('should handle promise rejections', async () => {
    const queue = new PromiseQueue();
    const error = new Error('Task failed');

    await expect(
      queue.enqueue(async () => {
        throw error;
      }),
    ).rejects.toThrowError('Task failed');

    // Queue should still work after rejection
    const result = await queue.enqueue(async () => 'works');
    expect(result).toBe('works');
  });

  test('should handle multiple concurrent tasks with different completion times', async () => {
    const queue = new PromiseQueue(3);
    const { promise: p1, resolve: r1 } = Promise.withResolvers<number>();
    const { promise: p2, resolve: r2 } = Promise.withResolvers<number>();
    const { promise: p3, resolve: r3 } = Promise.withResolvers<number>();

    const result1Promise = queue.enqueue(() => p1);
    const result2Promise = queue.enqueue(() => p2);
    const result3Promise = queue.enqueue(() => p3);

    expect(queue.runningCount).toBe(3);

    // Resolve in different order
    r2(20);
    r1(10);
    r3(30);

    const [result1, result2, result3] = await Promise.all([result1Promise, result2Promise, result3Promise]);

    expect(result1).toBe(10);
    expect(result2).toBe(20);
    expect(result3).toBe(30);

    await vi.waitFor(() => {
      expect(queue.runningCount).toBe(0);
    });
  });

  test('should execute tasks sequentially with concurrency of 1', async () => {
    const queue = new PromiseQueue(1);
    const executionOrder: number[] = [];

    const task1 = queue.enqueue(async () => {
      executionOrder.push(1);
      await new Promise(resolve => setTimeout(resolve, 10));
      executionOrder.push(1);
    });

    const task2 = queue.enqueue(async () => {
      executionOrder.push(2);
      await new Promise(resolve => setTimeout(resolve, 10));
      executionOrder.push(2);
    });

    await Promise.all([task1, task2]);

    // With concurrency 1, task 1 should complete before task 2 starts
    expect(executionOrder).toEqual([1, 1, 2, 2]);
  });

  test('should throw error if maxConcurrent is less than 1', () => {
    expect(() => new PromiseQueue(0)).toThrowError('maxConcurrent must be at least 1');
    expect(() => new PromiseQueue(-1)).toThrowError('maxConcurrent must be at least 1');
  });

  test('should update counts correctly throughout execution', async () => {
    const queue = new PromiseQueue(2);
    const { promise: p1, resolve: r1 } = Promise.withResolvers<void>();
    const { promise: p2, resolve: r2 } = Promise.withResolvers<void>();
    const { promise: p3, resolve: r3 } = Promise.withResolvers<void>();
    const { promise: p4, resolve: r4 } = Promise.withResolvers<void>();

    queue.enqueue(() => p1).catch(console.error);
    queue.enqueue(() => p2).catch(console.error);
    queue.enqueue(() => p3).catch(console.error);
    queue.enqueue(() => p4).catch(console.error);

    expect(queue.runningCount).toBe(2);
    expect(queue.queuedCount).toBe(2);

    r1();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(queue.runningCount).toBe(2);
    expect(queue.queuedCount).toBe(1);

    r2();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(queue.runningCount).toBe(2);
    expect(queue.queuedCount).toBe(0);

    r3();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(queue.runningCount).toBe(1);
    expect(queue.queuedCount).toBe(0);

    r4();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(queue.runningCount).toBe(0);
    expect(queue.queuedCount).toBe(0);
  });
});

test('error on promise creation should be correctly handled', async () => {
  const queue = new PromiseQueue(2);

  function mThrow(): Promise<void> {
    throw new Error('test');
  }

  await expect(async () => {
    return queue.enqueue(() => mThrow());
  }).rejects.toThrowError('test');

  expect(queue.runningCount).toBe(0);
});
