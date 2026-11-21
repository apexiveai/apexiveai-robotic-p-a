
export type ActivityCategory =
  | 'browser'
  | 'desktop'
  | 'data'
  | 'logic'
  | 'file'
  | 'system'
  | 'ai'

export interface ActivityInputDefinition {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'expression'
  required: boolean
  defaultValue?: string | number | boolean
  description?: string
}

export interface ActivityDefinition {
  type: string
  label: string
  description: string
  category: ActivityCategory
  icon: string
  inputs: ActivityInputDefinition[]
}

export const activityRegistry: ActivityDefinition[] = [
  {
    type: 'start',
    label: 'Start',
    description: 'Workflow entry point',
    category: 'logic',
    icon: 'play',
    inputs: [],
  },
  {
    type: 'end',
    label: 'End',
    description: 'Workflow completion point',
    category: 'logic',
    icon: 'square',
    inputs: [],
  },
  {
    type: 'click',
    label: 'Click',
    description: 'Click an element or screen coordinate',
    category: 'desktop',
    icon: 'mouse-pointer',
    inputs: [
      {
        name: 'target',
        label: 'Target',
        type: 'expression',
        required: true,
      },
      {
        name: 'clickType',
        label: 'Click Type',
        type: 'string',
        required: true,
        defaultValue: 'single',
      },
    ],
  },
  {
    type: 'type',
    label: 'Type Text',
    description: 'Enter text into a target field',
    category: 'desktop',
    icon: 'keyboard',
    inputs: [
      {
        name: 'text',
        label: 'Text',
        type: 'expression',
        required: true,
      },
      {
        name: 'target',
        label: 'Target',
        type: 'expression',
        required: false,
      },
    ],
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for a specified duration',
    category: 'system',
    icon: 'timer',
    inputs: [
      {
        name: 'durationMs',
        label: 'Duration (ms)',
        type: 'number',
        required: true,
        defaultValue: 1000,
      },
    ],
  },
  {
    type: 'if',
    label: 'If',
    description: 'Evaluate a condition',
    category: 'logic',
    icon: 'git-branch',
    inputs: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'expression',
        required: true,
      },
    ],
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Repeat a sequence of activities',
    category: 'logic',
    icon: 'repeat',
    inputs: [
      {
        name: 'iterations',
        label: 'Iterations',
        type: 'number',
        required: true,
        defaultValue: 1,
      },
    ],
  },
  {
    type: 'open-browser',
    label: 'Open Browser',
    description: 'Launch a browser at a specified URL',
    category: 'browser',
    icon: 'globe',
    inputs: [
      {
        name: 'url',
        label: 'URL',
        type: 'expression',
        required: true,
      },
      {
        name: 'browser',
        label: 'Browser',
        type: 'string',
        required: true,
        defaultValue: 'chrome',
      },
    ],
  },
  {
    type: 'read-file',
    label: 'Read File',
    description: 'Read data from a file',
    category: 'file',
    icon: 'file-text',
    inputs: [
      {
        name: 'path',
        label: 'File Path',
        type: 'expression',
        required: true,
      },
    ],
  },
  {
    type: 'write-file',
    label: 'Write File',
    description: 'Write data to a file',
    category: 'file',
    icon: 'file-pen',
    inputs: [
      {
        name: 'path',
        label: 'File Path',
        type: 'expression',
        required: true,
      },
      {
        name: 'content',
        label: 'Content',
        type: 'expression',
        required: true,
      },
    ],
  },
  {
    type: 'log',
    label: 'Log Message',
    description: 'Write a message to the execution log',
    category: 'system',
    icon: 'terminal',
    inputs: [
      {
        name: 'message',
        label: 'Message',
        type: 'expression',
        required: true,
      },
    ],
  },
  {
    type: 'ai-prompt',
    label: 'AI Prompt',
    description: 'Send a prompt to a configured AI provider',
    category: 'ai',
    icon: 'sparkles',
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'expression',
        required: true,
      },
    ],
  },
]

export function getActivityDefinition(
  type: string,
): ActivityDefinition | undefined {
  return activityRegistry.find((activity) => activity.type === type)
}

export function getActivitiesByCategory(
  category: ActivityCategory,
): ActivityDefinition[] {
  return activityRegistry.filter(
    (activity) => activity.category === category,
  )
}
