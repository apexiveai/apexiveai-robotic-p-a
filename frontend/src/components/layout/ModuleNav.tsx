
import { NavLink } from 'react-router-dom'
import { navigation } from '../../data/navigation'

export default function ModuleNav() {
  return (
    <nav className="module-nav">
      {navigation.map((section) => (
        <div className="nav-section" key={section.section}>
          <span className="nav-section-label">
            {section.section}
          </span>

          <div className="nav-items">
            {section.items.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
