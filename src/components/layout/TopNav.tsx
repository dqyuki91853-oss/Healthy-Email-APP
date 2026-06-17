import { NavLink } from 'react-router-dom'
import { Home, Mic, BarChart2, Settings } from 'lucide-react'

const TABS = [
  { to: '/', label: '首页', icon: Home },
  { to: '/voice-log', label: '记录', icon: Mic },
  { to: '/dashboard', label: '数据', icon: BarChart2 },
  { to: '/settings', label: '设置', icon: Settings },
]

export function TopNav() {
  return (
    <nav className="mb-6 hidden items-center gap-8 lg:flex">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `relative flex items-center gap-1.5 pb-1 text-sm transition-colors ${
              isActive
                ? 'font-semibold text-[var(--color-teal)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={16} />
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--color-teal)]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
