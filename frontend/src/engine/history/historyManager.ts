
export interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export interface HistoryManager<T> {
  getState(): HistoryState<T>
  push(next: T): void
  undo(): T
  redo(): T
  reset(next: T): void
  canUndo(): boolean
  canRedo(): boolean
  clear(): void
}

export function createHistoryManager<T>(
  initialValue: T,
  maxHistory = 50,
): HistoryManager<T> {
  let state: HistoryState<T> = {
    past: [],
    present: initialValue,
    future: [],
  }

  const limit = Math.max(1, maxHistory)

  return {
    getState() {
      return {
        past: [...state.past],
        present: state.present,
        future: [...state.future],
      }
    },

    push(next) {
      state = {
        past: [...state.past, state.present].slice(-limit),
        present: next,
        future: [],
      }
    },

    undo() {
      if (state.past.length === 0) return state.present

      const previous = state.past[state.past.length - 1]

      state = {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      }

      return state.present
    },

    redo() {
      if (state.future.length === 0) return state.present

      const next = state.future[0]

      state = {
        past: [...state.past, state.present].slice(-limit),
        present: next,
        future: state.future.slice(1),
      }

      return state.present
    },

    reset(next) {
      state = {
        past: [],
        present: next,
        future: [],
      }
    },

    canUndo() {
      return state.past.length > 0
    },

    canRedo() {
      return state.future.length > 0
    },

    clear() {
      state = {
        past: [],
        present: state.present,
        future: [],
      }
    },
  }
}
