
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  FolderOpen,
} from 'lucide-react'

import { useLocation } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import { allModules } from '../../data/navigation'

const descriptions: Record<string, string> = {
  '/activities': 'Browse and manage reusable automation activities.',
  '/projects': 'Organize automation projects and development workspaces.',
  '/processes': 'Manage published automation processes.',
  '/jobs': 'Track automation execution jobs and their outcomes.',
  '/robots': 'Register, configure and manage automation robots.',
  '/machines': 'Manage the machines that execute your automations.',
  '/queues': 'Manage transaction queues and processing priorities.',
  '/assets': 'Securely manage credentials and automation configuration.',
  '/packages': 'Manage versioned automation packages.',
  '/triggers': 'Configure schedules and event-based automation triggers.',
  '/monitoring': 'Monitor automation infrastructure and execution activity.',
  '/logs': 'Review execution logs and diagnostic events.',
  '/analytics': 'Analyze automation performance and business outcomes.',
  '/ai-automation': 'Manage AI-powered intelligent automation capabilities.',
  '/organizations': 'Manage enterprise organizations and workspaces.',
  '/users': 'Manage users, teams, permissions and access roles.',
  '/integrations': 'Connect external applications and enterprise services.',
  '/licensing': 'Manage product licenses, subscriptions and activations.',
  '/settings': 'Configure your enterprise RPA workspace.',
}

export default function ModulePage() {
  const location = useLocation()

  const current = allModules.find(
    (module) => module.path === location.pathname
  )

  const title = current?.label ?? 'Workspace'

  const description =
    descriptions[location.pathname] ??
    'Manage your automation workspace.'

  return (
    <div className="page">
      <PageHeader
        eyebrow="APEXIVEAI RPA / ENTERPRISE"
        title={title}
        description={description}
        action={
          <button
            className="primary-button"
            onClick={() => alert('Backend integration is pending.')}
          >
            <Plus size={17} />
            Create New
          </button>
        }
      />

      <section className="panel module-toolbar">
        <div className="module-search">
          <Search size={17} />
          <input
            placeholder={`Search ${title.toLowerCase()}...`}
          />
        </div>

        <button className="secondary-button">
          <Filter size={16} />
          Filters
        </button>
      </section>

      <section className="panel module-empty">
        <div className="empty-icon">
          <FolderOpen size={32} />
        </div>

        <h3>{title} Workspace</h3>

        <p>
          Your {title.toLowerCase()} workspace is ready.
          Backend integration and data management will be
          implemented in the next development phase.
        </p>

        <button
          className="secondary-button"
          onClick={() => window.location.reload()}
        >
          Refresh Workspace
          <ArrowUpRight size={15} />
        </button>
      </section>
    </div>
  )
}
