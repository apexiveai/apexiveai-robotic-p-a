
import { create } from 'zustand'

interface AppState {
  activeWorkspace: 'web' | 'desktop'
  organizationName: string
  setWorkspace: (workspace: 'web' | 'desktop') => void
  setOrganization: (name: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeWorkspace: 'web',
  organizationName: 'ApexiveAI Enterprise',

  setWorkspace: (workspace) =>
    set({ activeWorkspace: workspace }),

  setOrganization: (name) =>
    set({ organizationName: name }),
}))
