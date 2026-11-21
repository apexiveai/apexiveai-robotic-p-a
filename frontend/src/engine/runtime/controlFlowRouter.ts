
export interface ControlFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export type ControlFlowOutcome =
  | { type: "success" }
  | { type: "condition"; result: boolean }
  | { type: "switch"; caseValue: string | number | boolean }
  | { type: "loop"; hasNext: boolean }
  | { type: "break" }
  | { type: "continue" }
  | { type: "error" };

export interface RoutingResult {
  nextNodeIds: string[];
  route: string;
  terminated: boolean;
}

function getHandle(edge: ControlFlowEdge): string {
  return edge.sourceHandle || "next";
}

function selectEdges(
  edges: ControlFlowEdge[],
  handle: string
): ControlFlowEdge[] {
  return edges.filter((edge) => getHandle(edge) === handle);
}

export function routeControlFlow(
  nodeId: string,
  nodeType: string,
  edges: ControlFlowEdge[],
  outcome: ControlFlowOutcome
): RoutingResult {
  const outgoing = edges.filter((edge) => edge.source === nodeId);
  const normalizedType = nodeType.toLowerCase();

  let selected: ControlFlowEdge[] = [];
  let route = "next";

  if (outcome.type === "error") {
    selected = selectEdges(outgoing, "error");
    route = "error";
  } else if (outcome.type === "break") {
    selected = selectEdges(outgoing, "done");
    route = "break";
  } else if (outcome.type === "continue") {
    selected = selectEdges(outgoing, "continue");
    route = "continue";
  } else if (
    normalizedType === "if" ||
    normalizedType === "condition" ||
    normalizedType === "if-else"
  ) {
    route = outcome.type === "condition" && outcome.result
      ? "true"
      : "false";

    selected = selectEdges(outgoing, route);
  } else if (normalizedType === "switch") {
    if (outcome.type === "switch") {
      const caseHandle = `case:${String(outcome.caseValue)}`;
      selected = selectEdges(outgoing, caseHandle);
      route = caseHandle;
    }

    if (selected.length === 0) {
      selected = selectEdges(outgoing, "default");
      route = "default";
    }
  } else if (
    normalizedType === "for-each" ||
    normalizedType === "while" ||
    normalizedType === "do-while" ||
    normalizedType === "loop"
  ) {
    const hasNext =
      outcome.type === "loop" && outcome.hasNext;

    route = hasNext ? "body" : "done";
    selected = selectEdges(outgoing, route);
  } else if (
    normalizedType === "parallel" ||
    normalizedType === "parallel-branch"
  ) {
    selected = outgoing;
    route = "parallel";
  } else {
    selected = selectEdges(outgoing, "next");

    if (selected.length === 0) {
      selected = outgoing.filter(
        (edge) => !["true", "false", "error", "done", "body"].includes(
          getHandle(edge)
        )
      );
    }
  }

  return {
    nextNodeIds: selected.map((edge) => edge.target),
    route,
    terminated: selected.length === 0,
  };
}
