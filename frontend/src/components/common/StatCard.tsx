
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string
  change: string
  icon: LucideIcon
  positive?: boolean
}

export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
  positive = true,
}: Props) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">
          <Icon size={19} />
        </div>
      </div>

      <div className="stat-value">{value}</div>

      <div className={`stat-change ${positive ? 'positive' : 'negative'}`}>
        {change}
      </div>
    </div>
  )
}
