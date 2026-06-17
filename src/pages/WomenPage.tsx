import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { ReliabilityBadge } from '../components/health/ReliabilityBadge'
import { DirectionScoreCard } from '../components/health/DirectionScoreCard'

export function WomenPage() {
  const { watchRows, profile, prediction } = useAppStore()
  const recent = watchRows.slice(-30)
  const tempRows = recent.filter((r) => r.wristTempRaw != null)
  const women = prediction?.directionScores.find((d) => d.direction === 'women_health')

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">女性健康</h2>
      {profile.sex !== 'female' && (
        <p className="text-sm text-[var(--color-muted)]">
          可在设置中标记性别以启用个性化提示。本模块基于手腕温度、HRV 与饮食模式。
        </p>
      )}
      {women && <DirectionScoreCard score={women} />}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex justify-between">
            <h3 className="font-medium">排卵信号监测</h3>
            <ReliabilityBadge level="trend_only" />
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            排卵后温度偏移 ≥0.3°C 持续 ≥3 天（Natural Cycles + AW 验证 2024，中等证据）
          </p>
          <p className="mt-2 text-sm">
            有效手腕温度记录：{tempRows.length} 天 / 近 30 天
          </p>
        </Card>
        <Card>
          <h3 className="mb-2 font-medium">PCOS 管理监测</h3>
          <ul className="space-y-1 text-sm text-[var(--color-muted)]">
            <li>· 排卵检测：手腕温度 + HRV 黄体期模式</li>
            <li>· 胰岛素抵抗：精制碳水/添加糖频率 + 体重趋势</li>
            <li>· 睡眠呼吸暂停筛查：夜间 SpO₂ 波动（风险 5-10×）</li>
            <li>· 压力：HRV 持续偏低 → 交感兴奋</li>
          </ul>
        </Card>
        <Card>
          <h3 className="mb-2 font-medium">痛经预测</h3>
          <p className="text-sm text-[var(--color-muted)]">
            综合周期阶段 × 手腕温度 × HRV × 经前高 GI/高盐/咖啡因饮食，结合历史痛经记录。
          </p>
        </Card>
        <Card>
          <h3 className="mb-2 font-medium">围绝经期预警</h3>
          <p className="text-sm text-[var(--color-muted)]">
            手腕温度趋势 + HRV 变化 + 睡眠碎片化模式联合监测。
          </p>
        </Card>
      </div>
    </div>
  )
}
