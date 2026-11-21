
import type { WorkflowDocument } from '../../types/workflow'
import { validateWorkflow } from './validateWorkflow'

const STORAGE_PREFIX = 'apexiveai-rpa:workflow:'
const INDEX_KEY = 'apexiveai-rpa:workflow-index'

export interface WorkflowStorageResult<T> {
  success: boolean
  data?: T
  error?: string
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function saveWorkflow(
  workflow: WorkflowDocument,
): WorkflowStorageResult<WorkflowDocument> {
  const storage = getStorage()

  if (!storage) {
    return {
      success: false,
      error: 'Browser storage is unavailable.',
    }
  }

  const validation = validateWorkflow(workflow)

  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors
        .map((issue) => issue.message)
        .join(' '),
    }
  }

  try {
    const updatedWorkflow: WorkflowDocument = {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    storage.setItem(
      `${STORAGE_PREFIX}${updatedWorkflow.id}`,
      JSON.stringify(updatedWorkflow),
    )

    const existingIndex = getWorkflowIndex()
    const nextIndex = Array.from(
      new Set([...existingIndex, updatedWorkflow.id]),
    )

    storage.setItem(INDEX_KEY, JSON.stringify(nextIndex))

    return {
      success: true,
      data: updatedWorkflow,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Unable to save workflow.',
    }
  }
}

export function loadWorkflow(
  workflowId: string,
): WorkflowStorageResult<WorkflowDocument> {
  const storage = getStorage()

  if (!storage) {
    return {
      success: false,
      error: 'Browser storage is unavailable.',
    }
  }

  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${workflowId}`)

    if (!raw) {
      return {
        success: false,
        error: 'Workflow not found.',
      }
    }

    const parsed: unknown = JSON.parse(raw)

    if (!isRecord(parsed)) {
      return {
        success: false,
        error: 'Invalid workflow document.',
      }
    }

    const validation = validateWorkflow(
      parsed as unknown as WorkflowDocument,
    )

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors
          .map((issue) => issue.message)
          .join(' '),
      }
    }

    return {
      success: true,
      data: parsed as unknown as WorkflowDocument,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Unable to load workflow.',
    }
  }
}

export function getWorkflowIndex(): string[] {
  const storage = getStorage()
  if (!storage) return []

  try {
    const raw = storage.getItem(INDEX_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is string => typeof item === 'string',
    )
  } catch {
    return []
  }
}

export function listWorkflows(): WorkflowDocument[] {
  const index = getWorkflowIndex()

  return index
    .map((id) => loadWorkflow(id))
    .filter(
      (
        result,
      ): result is WorkflowStorageResult<WorkflowDocument> & {
        data: WorkflowDocument
      } => result.success && Boolean(result.data),
    )
    .map((result) => result.data)
}

export function deleteWorkflow(
  workflowId: string,
): WorkflowStorageResult<null> {
  const storage = getStorage()

  if (!storage) {
    return {
      success: false,
      error: 'Browser storage is unavailable.',
    }
  }

  try {
    storage.removeItem(`${STORAGE_PREFIX}${workflowId}`)

    const nextIndex = getWorkflowIndex().filter(
      (id) => id !== workflowId,
    )

    storage.setItem(INDEX_KEY, JSON.stringify(nextIndex))

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Unable to delete workflow.',
    }
  }
}

export function exportWorkflowJson(
  workflow: WorkflowDocument,
): string {
  return JSON.stringify(workflow, null, 2)
}

export function parseWorkflowJson(
  json: string,
): WorkflowStorageResult<WorkflowDocument> {
  try {
    const parsed: unknown = JSON.parse(json)

    if (!isRecord(parsed)) {
      return {
        success: false,
        error: 'JSON root must be an object.',
      }
    }

    if (parsed.schemaVersion !== '1.0.0') {
      return {
        success: false,
        error: 'Unsupported workflow schema version.',
      }
    }

    const workflow = parsed as unknown as WorkflowDocument
    const validation = validateWorkflow(workflow)

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors
          .map((issue) => issue.message)
          .join(' '),
      }
    }

    return {
      success: true,
      data: workflow,
    }
  } catch {
    return {
      success: false,
      error: 'Invalid JSON file.',
    }
  }
}

export function downloadWorkflowJson(
  workflow: WorkflowDocument,
): WorkflowStorageResult<null> {
  if (typeof document === 'undefined') {
    return {
      success: false,
      error: 'File download is unavailable.',
    }
  }

  try {
    const blob = new Blob(
      [exportWorkflowJson(workflow)],
      { type: 'application/json' },
    )

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `${workflow.metadata.name
      .trim()
      .replace(/[^a-z0-9-_]/gi, '-') || 'workflow'}.json`

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    URL.revokeObjectURL(url)

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Unable to export workflow.',
    }
  }
}
