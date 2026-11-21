
export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryAttempt {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  error: unknown;
}

export interface RetryResult<T> {
  success: boolean;
  value?: T;
  attempts: number;
  error?: unknown;
}

export interface RetryOptions {
  policy?: Partial<RetryPolicy>;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (event: RetryAttempt) => void;
  signal?: AbortSignal;
}

const DEFAULT_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

function validatePolicy(policy: RetryPolicy): void {
  if (!Number.isInteger(policy.maxRetries) || policy.maxRetries < 0) {
    throw new Error("maxRetries must be a non-negative integer.");
  }

  if (
    !Number.isFinite(policy.initialDelayMs) ||
    policy.initialDelayMs < 0
  ) {
    throw new Error("initialDelayMs must be non-negative.");
  }

  if (
    !Number.isFinite(policy.maxDelayMs) ||
    policy.maxDelayMs < policy.initialDelayMs
  ) {
    throw new Error("maxDelayMs must be >= initialDelayMs.");
  }

  if (
    !Number.isFinite(policy.backoffMultiplier) ||
    policy.backoffMultiplier < 1
  ) {
    throw new Error("backoffMultiplier must be >= 1.");
  }
}

function calculateDelay(
  retryNumber: number,
  policy: RetryPolicy
): number {
  const exponential =
    policy.initialDelayMs *
    Math.pow(policy.backoffMultiplier, retryNumber - 1);

  const bounded = Math.min(exponential, policy.maxDelayMs);

  if (!policy.jitter) return Math.round(bounded);

  return Math.round(bounded * (0.5 + Math.random() * 0.5));
}

function abortError(): Error {
  const error = new Error("Operation was cancelled.");
  error.name = "AbortError";
  return error;
}

function wait(
  delayMs: number,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortError());
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(abortError());
    };

    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function executeWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const policy: RetryPolicy = {
    ...DEFAULT_POLICY,
    ...options.policy,
  };

  validatePolicy(policy);

  let attempts = 0;
  let lastError: unknown;

  while (attempts <= policy.maxRetries) {
    if (options.signal?.aborted) {
      return {
        success: false,
        attempts,
        error: abortError(),
      };
    }

    attempts += 1;

    try {
      const value = await operation(attempts);

      return {
        success: true,
        value,
        attempts,
      };
    } catch (error) {
      lastError = error;

      const retryAvailable = attempts <= policy.maxRetries;
      const allowed =
        options.shouldRetry?.(error, attempts) ?? true;

      if (!retryAvailable || !allowed) {
        break;
      }

      const delayMs = calculateDelay(attempts, policy);

      options.onRetry?.({
        attempt: attempts,
        maxAttempts: policy.maxRetries + 1,
        delayMs,
        error,
      });

      try {
        await wait(delayMs, options.signal);
      } catch (waitError) {
        return {
          success: false,
          attempts,
          error: waitError,
        };
      }
    }
  }

  return {
    success: false,
    attempts,
    error: lastError,
  };
}
