
import type { WorkflowDocument } from '../../types/workflow'

export function createWorkflowId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `workflow-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

export function createNodeId(prefix = 'node'): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

export function createEmptyWorkflow(
  name = 'Untitled Workflow',
): WorkflowDocument {
  const now = new Date().toISOString()

  return {
    schemaVersion: '1.0.0',
    id: createWorkflowId(),

    metadata: {
      name,
      description: '',
      author: 'ApexiveAI',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },

    settings: {
      executionMode: 'sequential',
      timeoutMs: 300000,
      retryCount: 0,
      continueOnError: false,
    },

    variables: [],

    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 150 },
        data: {
          label: 'Start',
        },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 500, y: 150 },
        data: {
          label: 'End',
        },
      },
    ],

    edges: [
      {
        id: 'edge-start-end',
        source: 'start',
        target: 'end',
      },
    ],
  }
}
