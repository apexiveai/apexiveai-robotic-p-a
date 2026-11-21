
import type {
  WorkflowDocument,
  WorkflowValidationIssue,
  WorkflowValidationResult,
} from '../../types/workflow'

import { getActivityDefinition } from '../activities/activityRegistry'

export function validateWorkflow(
  workflow: WorkflowDocument,
): WorkflowValidationResult {
  const errors: WorkflowValidationIssue[] = []
  const warnings: WorkflowValidationIssue[] = []
  const infos: WorkflowValidationIssue[] = []

  const add = (
    severity: WorkflowValidationIssue['severity'],
    issue: WorkflowValidationIssue,
  ) => {
    if (severity === 'error') errors.push(issue)
    else if (severity === 'warning') warnings.push(issue)
    else infos.push(issue)
  }

  if (workflow.schemaVersion !== '1.0.0') {
    add('error', {
      code: 'UNSUPPORTED_SCHEMA_VERSION',
      severity: 'error',
      message: 'Unsupported workflow schema version.',
    })
  }

  if (!workflow.metadata.name.trim()) {
    add('error', {
      code: 'WORKFLOW_NAME_REQUIRED',
      severity: 'error',
      message: 'Workflow name is required.',
    })
  }

  if (workflow.settings.timeoutMs <= 0) {
    add('error', {
      code: 'INVALID_TIMEOUT',
      severity: 'error',
      message: 'Workflow timeout must be greater than zero.',
    })
  }

  if (workflow.settings.retryCount < 0) {
    add('error', {
      code: 'INVALID_RETRY_COUNT',
      severity: 'error',
      message: 'Retry count cannot be negative.',
    })
  }

  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()
  const nodeMap = new Map(
    workflow.nodes.map((node) => [node.id, node]),
  )

  for (const node of workflow.nodes) {
    if (nodeIds.has(node.id)) {
      add('error', {
        code: 'DUPLICATE_NODE_ID',
        severity: 'error',
        message: `Duplicate node ID: ${node.id}`,
        nodeId: node.id,
      })
    }

    nodeIds.add(node.id)

    if (!Number.isFinite(node.position.x) ||
        !Number.isFinite(node.position.y)) {
      add('error', {
        code: 'INVALID_NODE_POSITION',
        severity: 'error',
        message: `Node ${node.id} has an invalid position.`,
        nodeId: node.id,
      })
    }

    if (!getActivityDefinition(node.type)) {
      add('warning', {
        code: 'UNKNOWN_ACTIVITY',
        severity: 'warning',
        message: `Activity type "${node.type}" is not registered.`,
        nodeId: node.id,
      })
    }
  }

  const starts = workflow.nodes.filter((node) => node.type === 'start')
  const ends = workflow.nodes.filter((node) => node.type === 'end')

  if (starts.length === 0) {
    add('error', {
      code: 'START_NODE_MISSING',
      severity: 'error',
      message: 'Workflow must contain a Start node.',
    })
  }

  if (starts.length > 1) {
    add('error', {
      code: 'MULTIPLE_START_NODES',
      severity: 'error',
      message: 'Workflow must contain only one Start node.',
    })
  }

  if (ends.length === 0) {
    add('error', {
      code: 'END_NODE_MISSING',
      severity: 'error',
      message: 'Workflow must contain an End node.',
    })
  }

  for (const edge of workflow.edges) {
    if (edgeIds.has(edge.id)) {
      add('error', {
        code: 'DUPLICATE_EDGE_ID',
        severity: 'error',
        message: `Duplicate edge ID: ${edge.id}`,
        edgeId: edge.id,
      })
    }

    edgeIds.add(edge.id)

    if (!nodeMap.has(edge.source)) {
      add('error', {
        code: 'EDGE_SOURCE_MISSING',
        severity: 'error',
        message: `Edge ${edge.id} references a missing source node.`,
        edgeId: edge.id,
      })
    }

    if (!nodeMap.has(edge.target)) {
      add('error', {
        code: 'EDGE_TARGET_MISSING',
        severity: 'error',
        message: `Edge ${edge.id} references a missing target node.`,
        edgeId: edge.id,
      })
    }

    if (edge.source === edge.target) {
      add('warning', {
        code: 'SELF_REFERENCING_EDGE',
        severity: 'warning',
        message: `Edge ${edge.id} connects a node to itself.`,
        edgeId: edge.id,
      })
    }
  }

  for (const node of workflow.nodes) {
    if (node.type === 'start' || node.type === 'end') continue

    const hasIncoming = workflow.edges.some(
      (edge) => edge.target === node.id,
    )

    const hasOutgoing = workflow.edges.some(
      (edge) => edge.source === node.id,
    )

    if (!hasIncoming && !hasOutgoing) {
      add('warning', {
        code: 'ISOLATED_NODE',
        severity: 'warning',
        message: `Node ${node.id} is not connected.`,
        nodeId: node.id,
      })
    }
  }

  if (workflow.nodes.length === 0) {
    add('error', {
      code: 'EMPTY_WORKFLOW',
      severity: 'error',
      message: 'Workflow cannot be empty.',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos,
  }
}
