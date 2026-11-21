
export interface GraphNode {
  id: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface GraphCycle {
  nodeIds: string[];
}

export interface GraphAnalysis {
  nodeCount: number;
  edgeCount: number;
  missingSourceIds: string[];
  missingTargetIds: string[];
  unreachableNodeIds: string[];
  cycles: GraphCycle[];
}

export function getOutgoingEdges<E extends GraphEdge>(
  nodeId: string,
  edges: E[]
): E[] {
  return edges.filter((edge) => edge.source === nodeId);
}

export function getIncomingEdges<E extends GraphEdge>(
  nodeId: string,
  edges: E[]
): E[] {
  return edges.filter((edge) => edge.target === nodeId);
}

export function getReachableNodeIds<
  N extends GraphNode,
  E extends GraphEdge
>(
  startNodeId: string,
  nodes: N[],
  edges: E[]
): Set<string> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const visited = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current) || !nodeIds.has(current)) {
      continue;
    }

    visited.add(current);

    for (const edge of getOutgoingEdges(current, edges)) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return visited;
}

export function findGraphCycles<E extends GraphEdge>(
  nodes: GraphNode[],
  edges: E[]
): GraphCycle[] {
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const cycleKeys = new Set<string>();
  const cycles: GraphCycle[] = [];

  function visit(nodeId: string): void {
    if (active.has(nodeId)) {
      const start = stack.indexOf(nodeId);
      if (start >= 0) {
        const cycle = stack.slice(start);
        const key = [...cycle].sort().join("|");

        if (!cycleKeys.has(key)) {
          cycleKeys.add(key);
          cycles.push({ nodeIds: cycle });
        }
      }
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    active.add(nodeId);
    stack.push(nodeId);

    for (const next of adjacency.get(nodeId) || []) {
      visit(next);
    }

    stack.pop();
    active.delete(nodeId);
  }

  for (const node of nodes) {
    visit(node.id);
  }

  return cycles;
}

export function analyzeWorkflowGraph<
  N extends GraphNode,
  E extends GraphEdge
>(
  nodes: N[],
  edges: E[],
  startNodeId: string
): GraphAnalysis {
  const nodeIds = new Set(nodes.map((node) => node.id));

  const missingSourceIds = edges
    .filter((edge) => !nodeIds.has(edge.source))
    .map((edge) => edge.id);

  const missingTargetIds = edges
    .filter((edge) => !nodeIds.has(edge.target))
    .map((edge) => edge.id);

  const reachable = getReachableNodeIds(
    startNodeId,
    nodes,
    edges
  );

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    missingSourceIds,
    missingTargetIds,
    unreachableNodeIds: nodes
      .filter((node) => !reachable.has(node.id))
      .map((node) => node.id),
    cycles: findGraphCycles(nodes, edges),
  };
}
