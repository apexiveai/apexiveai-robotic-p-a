
import {
  Search,
  Bell,
  ChevronDown,
  Command,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

export default function Topbar() {
  const { organizationName, activeWorkspace, setWorkspace } =
    useAppStore()

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo">A</div>
        <div>
          <div className="brand-name">ApexiveAI</div>
          <div className="brand-product">ROBOTIC PROCESS AUTOMATION</div>
        </div>
      </div>

      <div className="topbar-center">
        <button
          className={`workspace-button ${activeWorkspace === 'web' ? 'selected' : ''}`}
          onClick={() => setWorkspace('web')}
        >
          Web Studio
        </button>

        <button
          className={`workspace-button ${activeWorkspace === 'desktop' ? 'selected' : ''}`}
          onClick={() => setWorkspace('desktop')}
        >
          Desktop Studio
        </button>
      </div>

      <div className="topbar-actions">
        <button className="search-button">
          <Search size={16} />
          <span>Search anything...</span>
          <kbd><Command size={11} /> K</kbd>
        </button>

        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="organization">
          <div className="organization-avatar">A</div>
          <div className="organization-info">
            <strong>{organizationName}</strong>
            <span>Enterprise Workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  )
}
