
import type { WorkflowDocument } from '../../types/workflow'

export interface WorkflowRevision {
  id: string
  workflowId: string
  revision: number
  createdAt: string
  description: string
  snapshot: WorkflowDocument
}

const REVISION_PREFIX = 'apexiveai-rpa:revisions:'
const MAX_REVISIONS = 30
const MAX_STORAGE_BYTES = 4 * 1024 * 1024

function storage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function revisionKey(workflowId: string): string {
  return `${REVISION_PREFIX}${workflowId}`
}

function makeId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `revision-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

export function listRevisions(
  workflowId: string,
): WorkflowRevision[] {
  const store = storage()
  if (!store) return []

  try {
    const raw = store.getItem(revisionKey(workflowId))
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is WorkflowRevision =>
        typeof item === 'object' &&
        item !== null &&
        'snapshot' in item &&
        'revision' in item,
    )
  } catch {
    return []
  }
}

export function createRevision(
  workflow: WorkflowDocument,
  description = 'Manual revision',
): WorkflowRevision {
  const store = storage()

  if (!store) {
    throw new Error('Browser storage is unavailable.')
  }

  const revisions = listRevisions(workflow.id)

  const revision: WorkflowRevision = {
    id: makeId(),
    workflowId: workflow.id,
    revision:
      revisions.reduce(
        (highest, item) => Math.max(highest, item.revision),
        0,
      ) + 1,
    createdAt: new Date().toISOString(),
    description,
    snapshot: JSON.parse(
      JSON.stringify(workflow),
    ) as WorkflowDocument,
  }

  const next = [
    revision,
    ...revisions,
  ].slice(0, MAX_REVISIONS)

  const serialized = JSON.stringify(next)

  if (
    new Blob([serialized]).size > MAX_STORAGE_BYTES
  ) {
    throw new Error(
      'Revision history exceeds the 4 MB storage limit.',
    )
  }

  try {
    store.setItem(
      revisionKey(workflow.id),
      serialized,
    )
  } catch {
    throw new Error(
      'Unable to store revision. Browser storage may be full.',
    )
  }

  return revision
}

export function restoreRevision(
  workflowId: string,
  revisionId: string,
): WorkflowDocument {
  const revision = listRevisions(workflowId).find(
    (item) => item.id === revisionId,
  )

  if (!revision) {
    throw new Error('Workflow revision not found.')
  }

  return JSON.parse(
    JSON.stringify(revision.snapshot),
  ) as WorkflowDocument
}

export function deleteRevision(
  workflowId: string,
  revisionId: string,
): void {
  const store = storage()

  if (!store) {
    throw new Error('Browser storage is unavailable.')
  }

  const next = listRevisions(workflowId).filter(
    (item) => item.id !== revisionId,
  )

  store.setItem(
    revisionKey(workflowId),
    JSON.stringify(next),
  )
}

export function clearRevisions(
  workflowId: string,
): void {
  storage()?.removeItem(revisionKey(workflowId))
}
