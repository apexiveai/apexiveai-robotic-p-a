
import type { JsonValue } from "../../types/workflow";

export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "exists"
  | "isEmpty"
  | "isTrue"
  | "isFalse";

export type ConditionOperand =
  | { kind: "literal"; value: JsonValue }
  | { kind: "variable"; path: string };

export interface ComparisonCondition {
  kind: "comparison";
  operator: ConditionOperator;
  left: ConditionOperand;
  right?: ConditionOperand;
}

export interface ConditionGroup {
  kind: "group";
  operator: "and" | "or";
  conditions: ConditionExpression[];
}

export interface NotCondition {
  kind: "not";
  condition: ConditionExpression;
}

export type ConditionExpression =
  | ComparisonCondition
  | ConditionGroup
  | NotCondition;

export interface ConditionEvaluationResult {
  success: boolean;
  value: boolean;
  error?: string;
}

function isSafePath(path: string): boolean {
  const parts = path.split(".");
  return (
    parts.length > 0 &&
    parts.every(
      (part) =>
        part.length > 0 &&
        part !== "__proto__" &&
        part !== "prototype" &&
        part !== "constructor"
    )
  );
}

function resolvePath(
  source: JsonValue,
  path: string
): JsonValue | undefined {
  if (!isSafePath(path)) return undefined;

  let current: unknown = source;

  for (const part of path.split(".")) {
    if (
      current === null ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current as JsonValue;
}

function resolveOperand(
  operand: ConditionOperand,
  variables: JsonValue
): JsonValue | undefined {
  if (operand.kind === "literal") return operand.value;
  return resolvePath(variables, operand.path);
}

function isEmpty(value: JsonValue | undefined): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function compare(
  condition: ComparisonCondition,
  variables: JsonValue
): boolean {
  const left = resolveOperand(condition.left, variables);
  const right =
    condition.right === undefined
      ? undefined
      : resolveOperand(condition.right, variables);

  switch (condition.operator) {
    case "exists":
      return left !== undefined;

    case "isEmpty":
      return isEmpty(left);

    case "isTrue":
      return left === true;

    case "isFalse":
      return left === false;

    case "equals":
      return JSON.stringify(left) === JSON.stringify(right);

    case "notEquals":
      return JSON.stringify(left) !== JSON.stringify(right);

    case "greaterThan":
      return typeof left === "number" &&
        typeof right === "number" && left > right;

    case "greaterThanOrEqual":
      return typeof left === "number" &&
        typeof right === "number" && left >= right;

    case "lessThan":
      return typeof left === "number" &&
        typeof right === "number" && left < right;

    case "lessThanOrEqual":
      return typeof left === "number" &&
        typeof right === "number" && left <= right;

    case "contains":
      if (typeof left === "string" && typeof right === "string") {
        return left.includes(right);
      }
      if (Array.isArray(left)) {
        return left.some(
          (item) => JSON.stringify(item) === JSON.stringify(right)
        );
      }
      return false;

    case "startsWith":
      return typeof left === "string" &&
        typeof right === "string" && left.startsWith(right);

    case "endsWith":
      return typeof left === "string" &&
        typeof right === "string" && left.endsWith(right);

    default:
      return false;
  }
}

export function evaluateCondition(
  condition: ConditionExpression,
  variables: JsonValue
): ConditionEvaluationResult {
  try {
    const evaluate = (expression: ConditionExpression): boolean => {
      if (expression.kind === "comparison") {
        return compare(expression, variables);
      }

      if (expression.kind === "not") {
        return !evaluate(expression.condition);
      }

      if (expression.operator === "and") {
        return expression.conditions.every(evaluate);
      }

      return expression.conditions.some(evaluate);
    };

    return {
      success: true,
      value: evaluate(condition),
    };
  } catch (error) {
    return {
      success: false,
      value: false,
      error:
        error instanceof Error
          ? error.message
          : "Condition evaluation failed.",
    };
  }
}
