
import {
  LayoutDashboard,
  Workflow,
  Blocks,
  FolderKanban,
  PlayCircle,
  BriefcaseBusiness,
  Bot,
  Monitor,
  ListTodo,
  Database,
  Package,
  Clock3,
  Activity,
  FileText,
  ChartNoAxesCombined,
  BrainCircuit,
  Building2,
  Users,
  Cable,
  KeyRound,
  Settings,
} from 'lucide-react'

export const navigation = [
  {
    section: 'WORKSPACE',
    items: [
      { label: 'Overview', path: '/', icon: LayoutDashboard },
      { label: 'Process Designer', path: '/designer', icon: Workflow },
      { label: 'Activities', path: '/activities', icon: Blocks },
      { label: 'Projects', path: '/projects', icon: FolderKanban },
    ],
  },
  {
    section: 'AUTOMATION',
    items: [
      { label: 'Processes', path: '/processes', icon: PlayCircle },
      { label: 'Jobs', path: '/jobs', icon: BriefcaseBusiness },
      { label: 'Robots', path: '/robots', icon: Bot },
      { label: 'Machines', path: '/machines', icon: Monitor },
      { label: 'Queues', path: '/queues', icon: ListTodo },
      { label: 'Assets', path: '/assets', icon: Database },
      { label: 'Packages', path: '/packages', icon: Package },
      { label: 'Triggers', path: '/triggers', icon: Clock3 },
    ],
  },
  {
    section: 'INTELLIGENCE',
    items: [
      { label: 'Monitoring', path: '/monitoring', icon: Activity },
      { label: 'Logs', path: '/logs', icon: FileText },
      { label: 'Analytics', path: '/analytics', icon: ChartNoAxesCombined },
      { label: 'AI Automation', path: '/ai-automation', icon: BrainCircuit },
    ],
  },
  {
    section: 'ADMINISTRATION',
    items: [
      { label: 'Organizations', path: '/organizations', icon: Building2 },
      { label: 'Users & Roles', path: '/users', icon: Users },
      { label: 'Integrations', path: '/integrations', icon: Cable },
      { label: 'Licensing', path: '/licensing', icon: KeyRound },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

export const allModules = navigation.flatMap(
  (section) => section.items
)
