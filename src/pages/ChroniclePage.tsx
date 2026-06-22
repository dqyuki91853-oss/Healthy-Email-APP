import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { CaseFileGallery } from '../components/chronicle/CaseFileGallery'
import { updateCaseFileStatus } from '../lib/caseFileStore'
import type { CaseFileStatus } from '../types/caseFile'

export function ChroniclePage() {
  const wellness = useAppStore((s) => s.wellness)
  const watchRows = useAppStore((s) => s.watchRows)
  const refreshAlerts = useAppStore((s) => s.refreshAlerts)

  const cases = wellness?.caseFiles ?? []
  const insufficientData = watchRows.length < 14

  const sortedCases = useMemo(
    () => [...cases].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt)),
    [cases],
  )

  const handleStatusChange = (id: string, status: CaseFileStatus) => {
    updateCaseFileStatus(id, status)
    refreshAlerts()
  }

  return (
    <div className="weather-chronicle page-enter mx-auto max-w-2xl">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--weather-rain)]">
          个人案卷
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--weather-text)]">身体档案馆</h1>
        <p className="mt-2 text-sm text-[var(--weather-text-soft)]">
          我们发现了一些关于你的有趣模式——每一条都是只属于你的 N=1 小发现。
        </p>
      </header>

      <CaseFileGallery
        cases={sortedCases}
        insufficientData={insufficientData && sortedCases.length === 0}
        daysAvailable={watchRows.length}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
