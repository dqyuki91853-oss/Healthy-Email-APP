import { Outlet, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { LeftSidebar } from './LeftSidebar'
import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'
import { DojoListeningToastHost } from '../home/DojoListeningToastHost'
import { WuyinNotificationBridge } from '../app/WuyinNotificationBridge'
import { ChronicleNotificationBridge } from '../app/ChronicleNotificationBridge'

export function AppLayout() {
  const navigate = useNavigate()

  return (
    <div className="app-layout flex min-h-screen bg-[var(--color-bg)]">
      <WuyinNotificationBridge />
      <ChronicleNotificationBridge />
      <DojoListeningToastHost />

      {/* ── 20/80 布局：左侧日历+饮食 (20%) / 右侧主内容 (80%) ── */}
      <div className="hidden lg:flex lg:w-[20%] lg:shrink-0">
        <LeftSidebar />
      </div>

      {/* ── Main Content Area (80%) ── */}
      <div className="app-shell flex flex-1 flex-col lg:w-[80%] lg:flex-none">
        <div className="hidden px-6 pt-5 lg:block">
          <TopNav />
        </div>

        <main className="app-main-scroll flex-1 overflow-auto px-4 pb-24 pt-4 lg:px-6 lg:pb-8 lg:pt-2">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <BottomNav />

      {/* ── Mobile FAB ── */}
      <button
        type="button"
        onClick={() => navigate('/voice-log')}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-teal)] text-white shadow-[var(--shadow-float)] transition-colors hover:bg-[var(--color-coral)] lg:hidden"
        aria-label="添加饮食记录"
      >
        <Plus size={22} />
      </button>
    </div>
  )
}
