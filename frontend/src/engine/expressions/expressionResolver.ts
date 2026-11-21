
import type { JsonValue } from '../../types/workflow'

export interface ExpressionResult {
  success: boolean
  value?: JsonValue
  error?: string
}

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z_$][\w$]*(?:\.[\w$]+)*)\s*\}\}/g

const BLOCKED_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
])

function getPathValue(
  variables: Record<string, JsonValue>,
  path: string,
): ExpressionResult {
  const parts = path.split('.')

  let current: unknown = variables

  for (const part of parts) {
    if (BLOCKED_KEYS.has(part)) {
      return {
        success: false,
        error: `Access to "${part}" is not allowed.`,
      }
    }

    if (
      typeof current !== 'object' ||
      current === null ||
      Array.isArray(current)
    ) {
      return {
        success: false,
        error: `Variable path "${path}" does not exist.`,
      }
    }

    if (!Object.prototype.hasOwnProperty.call(current, part)) {
      return {
        success: false,
        error: `Variable "${path}" was not found.`,
      }
    }

    current = (current as Record<string, unknown>)[part]
  }

  if (
    current === null ||
    typeof current === 'string' ||
    typeof current === 'number' ||
    typeof current === 'boolean' ||
    Array.isArray(current) ||
    typeof current === 'object'
  ) {
    return {
      success: true,
      value: current as JsonValue,
    }
  }

  return {
    success: false,
    error: `Variable "${path}" has an unsupported value.`,
  }
}

function stringifyValue(value: JsonValue): string {
  if (value === null) return 'null'

  if (typeof value === 'string') return value

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  return JSON.stringify(value)
}

export function resolveExpression(
  expression: string,
  variables: Record<string, JsonValue>,
): ExpressionResult {
  const trimmed = expression.trim()

  const exactMatch = trimmed.match(
    /^\{\{\s*([a-zA-Z_$][\w$]*(?:\.[\w$]+)*)\s*\}\}$/,
  )

  if (exactMatch) {
    return getPathValue(variables, exactMatch[1])
  }

  let failed = false
  let failureMessage = ''

  const resolved = expression.replace(
    TOKEN_PATTERN,
    (_match, path: string) => {
      const result = getPathValue(variables, path)

      if (!result.success) {
        failed = true
        failureMessage = result.error || 'Expression resolution failed.'
        return ''
      }

      return stringifyValue(result.value as JsonValue)
    },
  )

  if (failed) {
    return {
      success: false,
      error: failureMessage,
    }
  }

  return {
    success: true,
    value: resolved,
  }
}

export function resolveJsonValue(
  input: JsonValue,
  variables: Record<string, JsonValue>,
): ExpressionResult {
  if (typeof input === 'string') {
    return resolveExpression(input, variables)
  }

  if (Array.isArray(input)) {
    const output: JsonValue[] = []

    for (const item of input) {
      const result = resolveJsonValue(item, variables)

      if (!result.success) return result

      output.push(result.value as JsonValue)
    }

    return {
      success: true,
      value: output,
    }
  }

  if (input !== null && typeof input === 'object') {
    const output: Record<string, JsonValue> = {}

    for (const [key, value] of Object.entries(input)) {
      const result = resolveJsonValue(value, variables)

      if (!result.success) return result

      output[key] = result.value as JsonValue
    }

    return {
      success: true,
      value: output,
    }
  }

  return {
    success: true,
    value: input,
  }
}
