
export interface ModuleItem {
  label: string
  path: string
  description?: string
}

export interface ActivityDefinition {
  id: string
  name: string
  category: string
  description: string
}

export interface WorkflowMetadata {
  id: string
  name: string
  description: string
  status: 'draft' | 'published' | 'archived'
  updatedAt: string
}
