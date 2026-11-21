
import {
  executeWithRetry,
  type RetryOptions,
} from "./retryManager";

import {
  withTimeout,
  type TimeoutOptions,
} from "./timeoutManager";

export interface ResilientExecutionOptions {
  timeoutMs: number;
  maxRetries?: number;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
  activityId?: string;
  signal?: AbortSignal;
  shouldRetry?: RetryOptions["shouldRetry"];
  onRetry?: RetryOptions["onRetry"];
}

export interface ResilientExecutionResult<T> {
  success: boolean;
  value?: T;
  attempts: number;
  durationMs: number;
  error?: unknown;
}

export async function executeResiliently<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: ResilientExecutionOptions
): Promise<ResilientExecutionResult<T>> {
  const startedAt = Date.now();

  const retryResult = await executeWithRetry(
    async () => {
      const timeoutOptions: TimeoutOptions = {
        timeoutMs: options.timeoutMs,
        signal: options.signal,
        activityId: options.activityId,
      };

      const result = await withTimeout(
        operation,
        timeoutOptions
      );

      return result.value;
    },
    {
      policy: {
        maxRetries: options.maxRetries ?? 0,
        initialDelayMs: options.retryDelayMs ?? 500,
        maxDelayMs: options.maxRetryDelayMs ?? 10000,
        backoffMultiplier: 2,
        jitter: true,
      },
      shouldRetry: options.shouldRetry,
      onRetry: options.onRetry,
      signal: options.signal,
    }
  );

  return {
    success: retryResult.success,
    value: retryResult.value,
    attempts: retryResult.attempts,
    durationMs: Date.now() - startedAt,
    error: retryResult.error,
  };
}
