
import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import ModuleNav from './ModuleNav'

export default function AppShell() {
  return (
    <div className="application">
      <Topbar />
      <ModuleNav />

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>© 2026 ApexiveAI. All rights reserved.</span>
        <span>RPA Platform · Development Edition</span>
      </footer>
    </div>
  )
}
