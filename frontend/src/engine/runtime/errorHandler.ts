
export type AutomationErrorCategory =
  | "validation"
  | "configuration"
  | "authentication"
  | "authorization"
  | "network"
  | "timeout"
  | "element-not-found"
  | "application"
  | "runtime"
  | "cancellation"
  | "unknown";

export type RecoveryAction =
  | "retry"
  | "skip"
  | "continue"
  | "stop"
  | "restart"
  | "manual-intervention";

export interface AutomationError {
  id: string;
  code: string;
  category: AutomationErrorCategory;
  message: string;
  details?: string;
  activityId?: string;
  workflowId?: string;
  timestamp: string;
  retryable: boolean;
  originalError?: unknown;
}

export interface ErrorRecoveryPolicy {
  category: AutomationErrorCategory;
  action: RecoveryAction;
  maxRetries?: number;
  message?: string;
}

export interface ErrorHandlerOptions {
  workflowId?: string;
  activityId?: string;
  retryable?: boolean;
}

export interface ErrorHandlerResult {
  error: AutomationError;
  recovery: ErrorRecoveryPolicy;
}

const DEFAULT_POLICIES: Record<
  AutomationErrorCategory,
  ErrorRecoveryPolicy
> = {
  validation: {
    category: "validation",
    action: "stop",
  },
  configuration: {
    category: "configuration",
    action: "stop",
  },
  authentication: {
    category: "authentication",
    action: "manual-intervention",
  },
  authorization: {
    category: "authorization",
    action: "stop",
  },
  network: {
    category: "network",
    action: "retry",
    maxRetries: 3,
  },
  timeout: {
    category: "timeout",
    action: "retry",
    maxRetries: 2,
  },
  "element-not-found": {
    category: "element-not-found",
    action: "retry",
    maxRetries: 2,
  },
  application: {
    category: "application",
    action: "manual-intervention",
  },
  runtime: {
    category: "runtime",
    action: "stop",
  },
  cancellation: {
    category: "cancellation",
    action: "stop",
  },
  unknown: {
    category: "unknown",
    action: "stop",
  },
};

function createErrorId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `error-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error) ?? "Unknown automation error.";
  } catch {
    return "Unknown automation error.";
  }
}

export function classifyError(
  error: unknown
): AutomationErrorCategory {
  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();

    if (name.includes("abort") || name.includes("cancel")) {
      return "cancellation";
    }

    if (name.includes("timeout") || message.includes("timed out")) {
      return "timeout";
    }

    if (
      message.includes("unauthorized") ||
      message.includes("invalid credentials")
    ) {
      return "authentication";
    }

    if (
      message.includes("forbidden") ||
      message.includes("permission denied")
    ) {
      return "authorization";
    }

    if (
      message.includes("network") ||
      message.includes("fetch failed") ||
      message.includes("connection")
    ) {
      return "network";
    }

    if (
      message.includes("element not found") ||
      message.includes("selector not found")
    ) {
      return "element-not-found";
    }

    if (
      message.includes("invalid configuration") ||
      message.includes("configuration missing")
    ) {
      return "configuration";
    }

    if (name.includes("typeerror") || name.includes("referenceerror")) {
      return "runtime";
    }
  }

  return "unknown";
}

export function createAutomationError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): AutomationError {
  const category = classifyError(error);

  return {
    id: createErrorId(),
    code: `RPA_${category.toUpperCase().replace(/-/g, "_")}`,
    category,
    message: normalizeMessage(error),
    details:
      error instanceof Error ? error.stack : undefined,
    workflowId: options.workflowId,
    activityId: options.activityId,
    timestamp: new Date().toISOString(),
    retryable:
      options.retryable ??
      ["network", "timeout", "element-not-found"].includes(category),
    originalError: error,
  };
}

export function getRecoveryPolicy(
  category: AutomationErrorCategory,
  overrides: Partial<ErrorRecoveryPolicy> = {}
): ErrorRecoveryPolicy {
  return {
    ...DEFAULT_POLICIES[category],
    ...overrides,
    category,
  };
}

export function handleAutomationError(
  error: unknown,
  options: ErrorHandlerOptions = {},
  overrides: Partial<ErrorRecoveryPolicy> = {}
): ErrorHandlerResult {
  const automationError = createAutomationError(error, options);

  const recovery = getRecoveryPolicy(
    automationError.category,
    overrides
  );

  if (!automationError.retryable && recovery.action === "retry") {
    recovery.action = "stop";
  }

  return {
    error: automationError,
    recovery,
  };
}
