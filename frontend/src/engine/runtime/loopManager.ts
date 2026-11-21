import type { JsonValue } from "../../types/workflow";
import {
  evaluateCondition,
  type ConditionExpression,
} from "../expressions/conditionEvaluator";

export type LoopKind = "for-each" | "while" | "do-while";

export type LoopStatus =
  | "ready"
  | "running"
  | "completed"
  | "broken"
  | "failed";

export interface LoopDefinition {
  id: string;
  kind: LoopKind;
  items?: JsonValue[];
  itemVariable?: string;
  indexVariable?: string;
  condition?: ConditionExpression;
  maxIterations?: number;
}

export interface LoopState {
  loopId: string;
  kind: LoopKind;
  status: LoopStatus;
  iteration: number;
  index: number;
  started: boolean;
  maxIterations: number;
  items: JsonValue[];
  itemVariable: string;
  indexVariable: string;
  condition?: ConditionExpression;
  currentItem?: JsonValue;
  error?: string;
}

export interface LoopDecision {
  state: LoopState;
  action: "execute-body" | "completed" | "failed";
  variables: Record<string, JsonValue>;
  iteration: number;
  index: number;
  error?: string;
}

const DEFAULT_MAX_ITERATIONS = 10000;

function isValidVariableName(name: string): boolean {
  return (
    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) &&
    name !== "__proto__" &&
    name !== "prototype" &&
    name !== "constructor"
  );
}

export function createLoopState(
  definition: LoopDefinition
): LoopState {
  const maxIterations =
    definition.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  if (!Number.isInteger(maxIterations) || maxIterations < 1) {
    throw new Error("maxIterations must be a positive integer.");
  }

  if (
    definition.kind === "for-each" &&
    !Array.isArray(definition.items)
  ) {
    throw new Error("For Each requires an items array.");
  }

  if (
    definition.kind !== "for-each" &&
    !definition.condition
  ) {
    throw new Error(`${definition.kind} requires a condition.`);
  }

  const itemVariable = definition.itemVariable ?? "item";
  const indexVariable = definition.indexVariable ?? "index";

  if (
    !isValidVariableName(itemVariable) ||
    !isValidVariableName(indexVariable) ||
    itemVariable === indexVariable
  ) {
    throw new Error("Invalid loop variable names.");
  }

  return {
    loopId: definition.id,
    kind: definition.kind,
    status: "ready",
    iteration: 0,
    index: -1,
    started: false,
    maxIterations,
    items: definition.items ?? [],
    itemVariable,
    indexVariable,
    condition: definition.condition,
  };
}

function createDecision(
  state: LoopState,
  action: LoopDecision["action"],
  variables: Record<string, JsonValue> = {},
  error?: string
): LoopDecision {
  return {
    state,
    action,
    variables,
    iteration: state.iteration,
    index: state.index,
    error,
  };
}

function complete(state: LoopState): LoopDecision {
  const nextState: LoopState = {
    ...state,
    status: "completed",
    currentItem: undefined,
  };

  return createDecision(nextState, "completed");
}

function fail(state: LoopState, error: string): LoopDecision {
  const nextState: LoopState = {
    ...state,
    status: "failed",
    error,
    currentItem: undefined,
  };

  return createDecision(nextState, "failed", {}, error);
}

function evaluateLoopCondition(
  state: LoopState,
  variables: JsonValue
): boolean | string {
  if (!state.condition) {
    return "Loop condition is missing.";
  }

  const result = evaluateCondition(state.condition, variables);

  if (!result.success) {
    return result.error ?? "Condition evaluation failed.";
  }

  return result.value;
}

export function stepLoop(
  state: LoopState,
  variables: JsonValue
): LoopDecision {
  if (
    state.status === "completed" ||
    state.status === "broken"
  ) {
    return createDecision(state, "completed");
  }

  if (state.status === "failed") {
    return createDecision(
      state,
      "failed",
      {},
      state.error ?? "Loop has failed."
    );
  }

  if (state.kind === "for-each") {
    const nextIndex = state.index + 1;

    if (nextIndex >= state.items.length) {
      return complete(state);
    }

    if (state.iteration >= state.maxIterations) {
      return fail(
        state,
        `Loop exceeded maximum iteration limit (${state.maxIterations}).`
      );
    }

    const currentItem = state.items[nextIndex];

    const nextState: LoopState = {
      ...state,
      status: "running",
      started: true,
      index: nextIndex,
      iteration: state.iteration + 1,
      currentItem,
    };

    return createDecision(
      nextState,
      "execute-body",
      {
        [state.itemVariable]: currentItem,
        [state.indexVariable]: nextIndex,
      }
    );
  }

  if (state.kind === "do-while" && !state.started) {
    const nextState: LoopState = {
      ...state,
      status: "running",
      started: true,
      iteration: state.iteration + 1,
    };

    return createDecision(nextState, "execute-body");
  }

  const conditionResult = evaluateLoopCondition(
    state,
    variables
  );

  if (typeof conditionResult === "string") {
    return fail(state, conditionResult);
  }

  if (!conditionResult) {
    return complete(state);
  }

  const nextState: LoopState = {
    ...state,
    status: "running",
    started: true,
    iteration: state.iteration + 1,
  };

  return createDecision(nextState, "execute-body");
}

export function breakLoop(state: LoopState): LoopState {
  if (state.status !== "running" && state.status !== "ready") {
    return state;
  }

  return {
    ...state,
    status: "broken",
    currentItem: undefined,
  };
}

export function continueLoop(state: LoopState): LoopState {
  if (state.status !== "running") {
    return state;
  }

  return {
    ...state,
    status: "running",
  };
}

export function resetLoop(state: LoopState): LoopState {
  return {
    ...state,
    status: "ready",
    iteration: 0,
    index: -1,
    started: false,
    currentItem: undefined,
    error: undefined,
  };
}