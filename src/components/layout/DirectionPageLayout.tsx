import type { ReactNode } from 'react'
import { PageHeader } from './PageHeader'
import { Card } from '../ui/Card'

interface Props {
  title: string
  subtitle?: string
  score?: { value: number; level: string; label: string } | null
  children: ReactNode
}

export function DirectionPageLayout({ title, subtitle, score, children }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      {score && (
        <Card variant="cream">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-teal)]">{score.value}</p>
              <p className="text-xs text-[var(--color-muted)]">/ 100</p>
            </div>
            <div>
              <p className="font-medium">{score.label}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                状态：{score.level === 'green' ? '正常' : score.level === 'yellow' ? '关注' : score.level === 'orange' ? '预警' : '高风险'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {children}
    </div>
  )
}
