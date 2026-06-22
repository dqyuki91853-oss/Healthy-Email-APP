import { NavLink } from 'react-router-dom'
import { Home, Mic, BarChart2, Settings, Gem, Flower2 } from 'lucide-react'

const TABS = [
  { to: '/', label: '首页', icon: Home },
  { to: '/voice-log', label: '记录', icon: Mic },
  { to: '/collection', label: '珍藏', icon: Gem },
  { to: '/seasons', label: '四季', icon: Flower2 },
  { to: '/dashboard', label: '数据', icon: BarChart2 },
  { to: '/settings', label: '设置', icon: Settings },
]

export function TopNav() {
  return (
    <nav className="topnav-pill mb-5 hidden w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/90 bg-white/95 px-3 py-2 shadow-[0_8px_32px_rgba(44,44,44,0.06)] lg:flex">
      <span className="mr-2 shrink-0 pl-2 text-sm font-semibold text-[var(--color-text)]">
        健康来信
      </span>
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `topnav-pill__tab flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? 'bg-[var(--color-text)] font-medium text-white'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
            }`
          }
        >
          <Icon size={15} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
