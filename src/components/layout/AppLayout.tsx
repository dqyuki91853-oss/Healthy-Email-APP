import { Outlet, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { LeftSidebar } from './LeftSidebar'
import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop Left Sidebar (280px) ── */}
      <LeftSidebar />

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 flex-col bg-[var(--color-bg)]">
        {/* Desktop TopNav */}
        <div className="px-8 pt-6 lg:block hidden">
          <TopNav />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-0">
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
