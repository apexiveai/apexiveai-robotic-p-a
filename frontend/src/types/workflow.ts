
export type JsonPrimitive = string | number | boolean | null

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }

export type WorkflowVariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'

export interface WorkflowVariable {
  id: string
  name: string
  type: WorkflowVariableType
  value: JsonValue
  description?: string
}

export interface WorkflowNodePosition {
  x: number
  y: number
}

export interface WorkflowNode {
  id: string
  type: string
  position: WorkflowNodePosition
  data: Record<string, JsonValue>
  disabled?: boolean
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  label?: string
  type?: string
  animated?: boolean
  data?: Record<string, JsonValue>
}

export interface WorkflowSettings {
  executionMode: 'sequential' | 'parallel'
  timeoutMs: number
  retryCount: number
  continueOnError: boolean
}

export interface WorkflowMetadata {
  name: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface WorkflowDocument {
  schemaVersion: '1.0.0'
  id: string
  metadata: WorkflowMetadata
  settings: WorkflowSettings
  variables: WorkflowVariable[]
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface WorkflowValidationIssue {
  code: string
  severity: ValidationSeverity
  message: string
  nodeId?: string
  edgeId?: string
}

export interface WorkflowValidationResult {
  valid: boolean
  errors: WorkflowValidationIssue[]
  warnings: WorkflowValidationIssue[]
  infos: WorkflowValidationIssue[]
}
