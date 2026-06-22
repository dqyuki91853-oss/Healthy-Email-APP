import type { CaseFile, CaseFileStatus } from '../../types/caseFile'
import { CaseFileCard } from './CaseFileCard'

interface Props {
  cases: CaseFile[]
  insufficientData?: boolean
  daysAvailable?: number
  minDaysRequired?: number
  onStatusChange?: (id: string, status: CaseFileStatus) => void
}

export function CaseFileGallery({
  cases,
  insufficientData,
  daysAvailable = 0,
  minDaysRequired = 14,
  onStatusChange,
}: Props) {
  if (cases.length === 0) {
    return (
      <div className="weather-chronicle weather-chronicle-card flex flex-col items-center px-6 py-12 text-center">
        <span className="text-3xl" aria-hidden>
          🔍
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[var(--weather-text)]">
          {insufficientData ? '数据还在积累中…' : '还没有案卷'}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--weather-text-soft)]">
          {insufficientData
            ? `当 App 收集到足够多的健康数据后，它会自动发现关于你身体的规律。通常在 ${minDaysRequired}–21 天后出现第一批发现。`
            : '继续佩戴 Watch、记录饮食，新的个人模式会自动出现在这里。'}
        </p>
        {insufficientData && (
          <p className="mt-4 text-xs text-[var(--weather-text-soft)]">
            当前有效天数：{daysAvailable} / {minDaysRequired}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cases.map((c) => (
        <CaseFileCard key={c.id} caseFile={c} onStatusChange={onStatusChange} />
      ))}
    </div>
  )
}
