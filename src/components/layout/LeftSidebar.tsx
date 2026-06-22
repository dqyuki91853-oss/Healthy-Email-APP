import { CalendarDietRail } from '../home/CalendarDietRail'

export function LeftSidebar() {
  return (
    <aside className="app-sidebar flex w-full flex-col p-4">
      <div className="app-sidebar__panel flex h-full min-h-0 flex-col rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_8px_40px rgba(44,44,44,0.06)]">
        <CalendarDietRail className="h-full min-h-0" />
      </div>
    </aside>
  )
}
