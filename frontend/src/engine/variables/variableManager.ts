
import type {
  JsonValue,
  WorkflowVariable,
  WorkflowVariableType,
} from '../../types/workflow'

function createVariableId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `var-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function inferVariableType(
  value: JsonValue,
): WorkflowVariableType {
  if (Array.isArray(value)) return 'array'

  if (value === null) return 'object'

  if (typeof value === 'object') return 'object'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'

  return 'string'
}

export function createVariable(
  name: string,
  type: WorkflowVariableType,
  value: JsonValue,
  description = '',
): WorkflowVariable {
  return {
    id: createVariableId(),
    name: name.trim(),
    type,
    value,
    description,
  }
}

export function validateVariableValue(
  type: WorkflowVariableType,
  value: JsonValue,
): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string'

    case 'number':
      return typeof value === 'number' && Number.isFinite(value)

    case 'boolean':
      return typeof value === 'boolean'

    case 'object':
      return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      )

    case 'array':
      return Array.isArray(value)

    default:
      return false
  }
}

export function addVariable(
  variables: WorkflowVariable[],
  variable: WorkflowVariable,
): WorkflowVariable[] {
  const duplicate = variables.some(
    (item) => item.name.toLowerCase() === variable.name.toLowerCase(),
  )

  if (duplicate) {
    throw new Error(`Variable "${variable.name}" already exists.`)
  }

  if (!validateVariableValue(variable.type, variable.value)) {
    throw new Error('Variable value does not match its declared type.')
  }

  return [...variables, variable]
}

export function updateVariable(
  variables: WorkflowVariable[],
  variableId: string,
  updates: Partial<Omit<WorkflowVariable, 'id'>>,
): WorkflowVariable[] {
  const current = variables.find((item) => item.id === variableId)

  if (!current) {
    throw new Error('Variable not found.')
  }

  const next = {
    ...current,
    ...updates,
  }

  const duplicate = variables.some(
    (item) =>
      item.id !== variableId &&
      item.name.toLowerCase() === next.name.toLowerCase(),
  )

  if (duplicate) {
    throw new Error(`Variable "${next.name}" already exists.`)
  }

  if (!next.name.trim()) {
    throw new Error('Variable name is required.')
  }

  if (!validateVariableValue(next.type, next.value)) {
    throw new Error('Variable value does not match its declared type.')
  }

  return variables.map((item) =>
    item.id === variableId ? next : item,
  )
}

export function removeVariable(
  variables: WorkflowVariable[],
  variableId: string,
): WorkflowVariable[] {
  return variables.filter((item) => item.id !== variableId)
}

export function getVariable(
  variables: WorkflowVariable[],
  name: string,
): WorkflowVariable | undefined {
  return variables.find(
    (item) => item.name === name,
  )
}
