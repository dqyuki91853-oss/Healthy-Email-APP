import { Link } from 'react-router-dom'
import { CaseFileGallery } from '../chronicle/CaseFileGallery'
import { updateCaseFileStatus } from '../../lib/caseFileStore'
import type { CaseFile, CaseFileStatus } from '../../types/caseFile'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  cases: CaseFile[]
  daysAvailable: number
}

export function HomeArchivePanel({ cases, daysAvailable }: Props) {
  const refreshAlerts = useAppStore((s) => s.refreshAlerts)
  const preview = cases.slice(0, 2)
  const insufficientData = daysAvailable < 14 && cases.length === 0

  const handleStatusChange = (id: string, status: CaseFileStatus) => {
    updateCaseFileStatus(id, status)
    refreshAlerts()
  }

  return (
    <section className="home-chronicle-panel home-chronicle-panel--archive weather-chronicle" aria-labelledby="home-archive-title">
      <header className="home-chronicle-panel__header">
        <p className="home-chronicle-panel__kicker">个人案卷</p>
        <div className="flex items-start justify-between gap-2">
          <h2 id="home-archive-title" className="home-chronicle-panel__title">
            身体档案馆
          </h2>
          {cases.length > 0 && (
            <Link to="/chronicle-old" className="home-chronicle-panel__link shrink-0">
              全部 →
            </Link>
          )}
        </div>
      </header>

      <div className="home-chronicle-panel__body">
        <CaseFileGallery
          cases={preview}
          insufficientData={insufficientData}
          daysAvailable={daysAvailable}
          onStatusChange={handleStatusChange}
        />
        {cases.length > 2 && (
          <Link to="/chronicle-old" className="home-chronicle-panel__more">
            还有 {cases.length - 2} 条案卷，查看全部
          </Link>
        )}
      </div>
    </section>
  )
}
