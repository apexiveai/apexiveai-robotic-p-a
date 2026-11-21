
export type AutosaveStatus =
  | 'idle'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'error'

export interface AutosaveOptions<T> {
  delayMs?: number
  save: (value: T) => Promise<void> | void
  onStatusChange?: (status: AutosaveStatus) => void
  onError?: (error: Error) => void
}

export interface AutosaveManager<T> {
  schedule(value: T): void
  flush(): Promise<void>
  cancel(): void
  dispose(): void
  getStatus(): AutosaveStatus
}

export function createAutosaveManager<T>(
  options: AutosaveOptions<T>,
): AutosaveManager<T> {
  const delayMs = Math.max(250, options.delayMs ?? 1200)

  let timer: ReturnType<typeof setTimeout> | null = null
  let latestValue: T | undefined
  let hasValue = false
  let status: AutosaveStatus = 'idle'
  let disposed = false
  let saveQueue = Promise.resolve()

  const setStatus = (next: AutosaveStatus) => {
    status = next
    options.onStatusChange?.(next)
  }

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const flush = async () => {
    clearTimer()

    if (disposed || !hasValue) return

    const valueToSave = latestValue as T
    hasValue = false

    setStatus('saving')

    const currentSave = saveQueue.then(async () => {
      await options.save(valueToSave)
    })

    saveQueue = currentSave.catch(() => undefined)

    try {
      await currentSave
      setStatus(hasValue ? 'pending' : 'saved')
    } catch (error) {
      setStatus('error')

      const normalizedError =
        error instanceof Error
          ? error
          : new Error('Autosave failed.')

      options.onError?.(normalizedError)
      throw normalizedError
    }

    if (hasValue && !disposed) {
      await flush()
    }
  }

  return {
    schedule(value) {
      if (disposed) return

      latestValue = value
      hasValue = true

      clearTimer()
      setStatus('pending')

      timer = setTimeout(() => {
        void flush().catch(() => undefined)
      }, delayMs)
    },

    flush,

    cancel() {
      clearTimer()
      hasValue = false
      latestValue = undefined
      setStatus('idle')
    },

    dispose() {
      clearTimer()
      disposed = true
    },

    getStatus() {
      return status
    },
  }
}
