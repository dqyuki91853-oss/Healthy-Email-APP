import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { EvidenceBadge } from '../components/health/EvidenceBadge'
import { DirectionScoreCard } from '../components/health/DirectionScoreCard'

const LEVEL_LABELS = {
  green: '🟢 绿灯',
  yellow: '🟡 黄灯',
  orange: '🟠 橙灯',
  red: '🔴 红灯',
}

const DIRECTION_LABELS: Record<string, string> = {
  gout: '高尿酸/痛风',
  metabolic: '代谢综合征',
  nafld: '脂肪肝',
  iron_deficiency: '缺铁倾向',
  ibs: '胃肠/不耐受',
  burnout: '职业倦怠',
  mood: '情绪稳定',
  brain_fog: '脑雾',
  women_health: '女性健康',
}

const METRIC_STATUS_LABEL = {
  normal: '🟢 正常',
  yellow: '🟡 关注',
  red: '🔴 建议关注',
  no_data: '⬜ 无数据',
}

export function AlertsPage() {
  const { alerts, acknowledgeAlert, prediction } = useAppStore()
  const metrics = prediction?.metricEvaluations ?? []
  const directions = prediction?.directionScores ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">值得留意的信号</h2>
        <p className="text-sm text-[var(--color-muted)]">
          基于你的 Watch 与饮食记录的个人化提示，像编年里的脚注——供你参考，不是诊断。
        </p>
        {prediction && (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            综合等级：{LEVEL_LABELS[prediction.overallLevel]} · 评估于{' '}
            {new Date(prediction.evaluatedAt).toLocaleString('zh-CN')}
          </p>
        )}
      </div>

      {metrics.length > 0 && (
        <Card>
          <h3 className="mb-3 font-medium">Apple Watch 指标阈值评估</h3>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div
                key={m.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] p-2 text-sm"
              >
                <div>
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-2 text-xs text-[var(--color-muted)]">{METRIC_STATUS_LABEL[m.status]}</span>
                  <p className="text-xs text-[var(--color-muted)]">{m.detail}</p>
                </div>
                <EvidenceBadge level={m.evidence} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {directions.filter((d) => d.level !== 'green').length > 0 && (
        <div>
          <h3 className="mb-3 font-medium">方向性线索</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {directions
              .filter((d) => d.level !== 'green')
              .map((d) => (
                <DirectionScoreCard key={d.direction} score={d} />
              ))}
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--color-muted)]">
            暂无需要留意的信号。导入 Apple Watch 数据并完成每日记录后，会在这里生成温和的个人化提示。
          </p>
        </Card>
      ) : (
        alerts.map((a) => (
          <Card key={a.id} className={a.acknowledged ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span>{LEVEL_LABELS[a.level]}</span>
                  <span className="rounded bg-[var(--color-surface-2)] px-2 py-0.5 text-xs">
                    {DIRECTION_LABELS[a.direction] ?? a.direction}
                  </span>
                  {a.evidenceLevel && <EvidenceBadge level={a.evidenceLevel} />}
                </div>
                <h3 className="font-medium">{a.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{a.message}</p>
                <ul className="mt-2 text-xs text-[var(--color-muted)]">
                  {a.triggeredSignals.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
                {a.recommendations && a.recommendations.length > 0 && (
                  <div className="mt-3 rounded-lg bg-[var(--color-surface-2)] p-2">
                    <p className="mb-1 text-xs font-medium text-[var(--color-accent)]">可操作建议</p>
                    <ul className="text-xs text-[var(--color-muted)]">
                      {a.recommendations.map((r) => (
                        <li key={r}>→ {r}</li>
                      ))}
                    </ul>
                    {a.actionRoute && (
                      <Link to={a.actionRoute} className="mt-2 inline-block text-xs text-[var(--color-accent)]">
                        前往相关页面
                      </Link>
                    )}
                  </div>
                )}
              </div>
              {!a.acknowledged && (
                <button
                  type="button"
                  onClick={() => acknowledgeAlert(a.id)}
                  className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs hover:bg-[var(--color-surface-2)]"
                >
                  已知悉
                </button>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
