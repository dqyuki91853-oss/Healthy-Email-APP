import { NavLink } from 'react-router-dom'
import { Home, Mic, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { to: '/', label: '首页', icon: Home },
  { to: '/voice-log', label: '记录', icon: Mic },
  { to: '/dashboard', label: '数据', icon: BarChart2 },
  { to: '/settings', label: '设置', icon: Settings },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"
      style={{ boxShadow: 'var(--shadow-float)' }}
    >
      <div className="flex h-16 items-center justify-around safe-bottom">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
                isActive
                  ? 'text-[var(--color-teal)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
