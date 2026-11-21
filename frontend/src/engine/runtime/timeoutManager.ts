
export class AutomationTimeoutError extends Error {
  readonly code = "RPA_TIMEOUT";

  constructor(
    message = "Automation activity exceeded its timeout."
  ) {
    super(message);
    this.name = "AutomationTimeoutError";
  }
}

export class AutomationCancelledError extends Error {
  readonly code = "RPA_CANCELLED";

  constructor(message = "Automation activity was cancelled.") {
    super(message);
    this.name = "AutomationCancelledError";
  }
}

export interface TimeoutOptions {
  timeoutMs: number;
  signal?: AbortSignal;
  activityId?: string;
}

export interface TimeoutResult<T> {
  value: T;
  durationMs: number;
}

export function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: TimeoutOptions
): Promise<TimeoutResult<T>> {
  const { timeoutMs, signal: externalSignal } = options;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(
      new Error("timeoutMs must be a positive number.")
    );
  }

  if (externalSignal?.aborted) {
    return Promise.reject(new AutomationCancelledError());
  }

  const controller = new AbortController();
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const onExternalAbort = () => {
      controller.abort();

      finish(() => {
        reject(new AutomationCancelledError());
      });
    };

    const timeout = setTimeout(() => {
      controller.abort();

      finish(() => {
        reject(
          new AutomationTimeoutError(
            `Activity ${options.activityId ?? "unknown"} exceeded ${timeoutMs}ms.`
          )
        );
      });
    }, timeoutMs);

    externalSignal?.addEventListener(
      "abort",
      onExternalAbort,
      { once: true }
    );

    Promise.resolve()
      .then(() => operation(controller.signal))
      .then((value) => {
        finish(() => {
          resolve({
            value,
            durationMs: Date.now() - startedAt,
          });
        });
      })
      .catch((error: unknown) => {
        finish(() => reject(error));
      });
  });
}
