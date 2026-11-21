
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Bot, MousePointer2, Type, Clock, GitBranch, Square } from 'lucide-react'

const icons: Record<string, typeof Bot> = {
  start: Bot,
  click: MousePointer2,
  type: Type,
  wait: Clock,
  condition: GitBranch,
  end: Square,
}

export interface ActivityNodeData {
  label: string
  category: string
}

export default function ActivityNode({
  data,
  selected,
}: NodeProps & { data: ActivityNodeData }) {
  const Icon = icons[data.category] || Bot

  return (
    <div className={`workflow-node ${selected ? 'node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className={`node-icon node-${data.category}`}>
        <Icon size={17} />
      </div>

      <div className="node-content">
        <strong>{data.label}</strong>
        <span>{data.category.toUpperCase()}</span>
      </div>

      <div className="node-menu">•••</div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
