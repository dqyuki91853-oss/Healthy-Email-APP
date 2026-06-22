/** 22 项 Watch 指标分域展示（Phase 8 · 高级附录） */
export type WatchMetricDomain = 'sleep' | 'heart' | 'metabolic' | 'mental' | 'women'

export const WATCH_METRIC_DOMAINS: Record<WatchMetricDomain, string[]> = {
  sleep: [
    'sleepHours',
    'deepSleepMin',
    'remSleepMin',
    'coreSleepMin',
    'inBedMin',
    'awakeEpisodes',
    'respiratoryRate',
  ],
  heart: [
    'restingHr',
    'hrvSdnn',
    'hrvReadings',
    'spo2',
    'spo2DesatEvents',
    'cardioRecovery',
  ],
  metabolic: [
    'dailySteps',
    'activeEnergyKcal',
    'exerciseMinutes',
    'vo2max',
    'daylight',
    'walkingAsymmetry',
    'walkingSteadiness',
    'environmentalNoise',
  ],
  mental: ['hrvSdnn', 'sleepHours', 'awakeEpisodes'],
  women: ['wristTemp', 'hrvSdnn', 'spo2DesatEvents'],
}

export const DOMAIN_APPENDIX_TITLES: Record<WatchMetricDomain, string> = {
  sleep: '睡眠域 · Watch 附录',
  heart: '心脏域 · Watch 附录',
  metabolic: '活动与代谢域 · Watch 附录',
  mental: '与情绪相关的身体读数',
  women: '女性健康域 · Watch 附录',
}

/** 全部分域并集应覆盖 WATCH_METRIC_INDEX 的 22 项 */
export function allDomainMetricKeys(): string[] {
  const keys = new Set<string>()
  for (const list of Object.values(WATCH_METRIC_DOMAINS)) {
    for (const k of list) keys.add(k)
  }
  return [...keys]
}
