
import type {
  JsonValue,
  WorkflowDocument,
  WorkflowNode,
} from '../../types/workflow'

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type NodeExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export interface NodeExecutionResult {
  nodeId: string
  status: NodeExecutionStatus
  startedAt?: string
  completedAt?: string
  output?: JsonValue
  error?: string
}

export interface ExecutionLogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
  nodeId?: string
  metadata?: Record<string, JsonValue>
}

export interface ExecutionContext {
  executionId: string
  workflowId: string
  variables: Record<string, JsonValue>
  status: ExecutionStatus
  startedAt?: string
  completedAt?: string
  currentNodeId?: string
  results: NodeExecutionResult[]
  logs: ExecutionLogEntry[]
}

export interface RuntimeCapabilities {
  browserAutomation: boolean
  desktopAutomation: boolean
  fileSystem: boolean
  database: boolean
  aiIntegration: boolean
}

export interface RuntimeExecutionRequest {
  workflow: WorkflowDocument
  inputVariables?: Record<string, JsonValue>
  requestedBy?: string
}

export interface RuntimeExecutionResponse {
  accepted: boolean
  executionId?: string
  status?: ExecutionStatus
  message: string
}

export interface ActivityExecutionRequest {
  executionId: string
  workflowId: string
  node: WorkflowNode
  variables: Record<string, JsonValue>
}

export interface ActivityExecutionResponse {
  success: boolean
  output?: JsonValue
  error?: string
}

export interface RpaRuntimeAdapter {
  readonly runtimeId: string
  readonly platform: 'web' | 'windows' | 'linux' | 'macos'
  readonly capabilities: RuntimeCapabilities

  execute(
    request: RuntimeExecutionRequest,
  ): Promise<RuntimeExecutionResponse>

  pause(executionId: string): Promise<void>

  resume(executionId: string): Promise<void>

  cancel(executionId: string): Promise<void>

  getExecution(
    executionId: string,
  ): Promise<ExecutionContext | null>
}
