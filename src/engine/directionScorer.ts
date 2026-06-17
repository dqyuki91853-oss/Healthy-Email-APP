import type { AlertLevel } from '../types/health'
import type { DailyWatchRow, PersonalBaseline, UserProfile } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { DirectionScore } from '../types/prediction'
import {
  avg,
  bmi,
  min,
  recentValues,
  spo2NightAvgSeries,
  trendDelta,
  wristTempAmplitude,
} from '../lib/metricsAggregate'
import { getBaseline } from '../lib/baselines'

export interface DietContext {
  purineSources: number
  fructoseSources: number
  alcoholEvents: number
  highGlMeals: number
  fiberGapDays: number
  lowIronPattern: boolean
  fodmapFrequency: number
  dhaInsufficient: boolean
  emotionalEating: boolean
  caffeineDependency: boolean
  lowProteinBreakfast: number
  fodmapKeywords: string[]
  giSymptoms: string[]
  negativeEmotionDays: number
  avgStress: number | null
}

function scoreToLevel(score: number, high: number, mid: number): AlertLevel {
  if (score >= high) return 'red'
  if (score >= mid) return 'orange'
  if (score > 0) return 'yellow'
  return 'green'
}

function normalizeScore(score: number, max: number): number {
  return Math.min(100, Math.round((score / max) * 100))
}

export function buildDietContext(voiceLogs: VoiceExtraction[]): DietContext {
  const weekAgo = Date.now() - 7 * 86400000
  const recent = voiceLogs.filter((l) => new Date(l.timestamp).getTime() > weekAgo)
  const hasCategory = (log: VoiceExtraction, cats: string[]) =>
    log.foods.some((f) => f.categories.some((c) => cats.includes(c)))

  const fodmapKeywords = ['洋葱', '大蒜', '豆类', '牛奶', '芝士', '苹果', '梨', '蜂蜜', '面条', '面包']
  const giSymptoms = ['腹胀', '腹痛', '腹泻', '便秘', '反酸', '恶心', '不适']
  const negativeEmotions = ['焦虑', '低落', '易怒']

  const fodmapHits = new Set<string>()
  const giHits = new Set<string>()
  let negativeEmotionDays = 0
  let stressSum = 0
  let stressN = 0

  for (const log of recent) {
    const text = `${log.transcript} ${log.symptoms.join(' ')}`
    fodmapKeywords.forEach((k) => {
      if (text.includes(k)) fodmapHits.add(k)
    })
    giSymptoms.forEach((s) => {
      if (text.includes(s) || log.symptoms.some((x) => x.includes(s))) giHits.add(s)
    })
    if (log.emotions.some((e) => negativeEmotions.includes(e))) negativeEmotionDays += 1
    if (log.stressScore != null) {
      stressSum += log.stressScore
      stressN += 1
    }
  }

  return {
    purineSources: recent.filter((l) => hasCategory(l, ['purine', 'red_meat', 'seafood', 'organ', 'beer'])).length,
    fructoseSources: recent.filter((l) => hasCategory(l, ['fructose', 'sugary_drink', 'juice', 'honey'])).length,
    alcoholEvents: recent.filter((l) => hasCategory(l, ['alcohol'])).length,
    highGlMeals: recent.filter((l) => hasCategory(l, ['high_gi', 'refined_carb'])).length,
    fiberGapDays: recent.filter((l) => hasCategory(l, ['low_fiber'])).length,
    lowIronPattern: recent.some((l) => hasCategory(l, ['low_iron'])),
    fodmapFrequency: recent.filter((l) => hasCategory(l, ['high_fodmap'])).length,
    dhaInsufficient: recent.length > 0 && recent.every((l) => !hasCategory(l, ['fish', 'dha'])),
    emotionalEating: recent.some((l) => hasCategory(l, ['emotional_eating', 'late_snack'])),
    caffeineDependency: recent.filter((l) => hasCategory(l, ['caffeine'])).length >= 5,
    lowProteinBreakfast: recent.filter((l) => hasCategory(l, ['low_protein_breakfast'])).length,
    fodmapKeywords: [...fodmapHits],
    giSymptoms: [...giHits],
    negativeEmotionDays,
    avgStress: stressN ? stressSum / stressN : null,
  }
}

export function scoreAllDirections(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  profile: UserProfile,
  diet: DietContext,
): DirectionScore[] {
  const userBmi = bmi(profile.bodyMassKg, profile.heightCm)
  const age = profile.age ?? 45
  const sex = profile.sex ?? 'male'

  const rhr7 = avg(recentValues(rows, (r) => r.restingHr, 30))
  const hrv30 = avg(recentValues(rows, (r) => r.hrvSdnn, 30))
  const hrvMin = min(recentValues(rows, (r) => r.hrvSdnn, 30))
  const steps30 = avg(recentValues(rows, (r) => r.dailySteps, 30))
  const vo2Vals = recentValues(rows, (r) => r.vo2max, 180)
  const vo2Trend = trendDelta(vo2Vals)
  const spo2Min = min(spo2NightAvgSeries(rows, 30))
  const tempAmp = wristTempAmplitude(rows, 90)
  const sleep7 = avg(recentValues(rows, (r) => r.sleepHours, 14))
  const hrvBaseline = getBaseline(baselines, 'hrvSdnn')
  const hrvDropPct =
    hrvBaseline && hrv30 && hrvBaseline.mean > 0
      ? ((hrvBaseline.mean - hrv30) / hrvBaseline.mean) * 100
      : 0

  const scores: DirectionScore[] = []

  // ── 高尿酸/痛风 ──
  {
    let s = 0
    const items: string[] = []
    if (sex === 'male') {
      s += 15
      items.push('男性（基线风险较高）')
    }
    s += Math.max(0, (age - 30) * 0.3)
    if (userBmi != null && userBmi >= 28) {
      s += 20
      items.push(`BMI ${userBmi.toFixed(1)} ≥ 28`)
    } else if (userBmi != null && userBmi >= 25) {
      s += 12
      items.push(`BMI ${userBmi.toFixed(1)} ≥ 25`)
    }
    if (hrvMin != null && hrvMin < 15) {
      s += 15
      items.push(`HRV 最低 ${hrvMin.toFixed(0)}ms < 15`)
    } else if (hrv30 != null && hrv30 < 30) {
      s += 10
      items.push(`HRV 均值 ${hrv30.toFixed(0)}ms 偏低`)
    }
    if (rhr7 != null && rhr7 > 80) {
      s += 10
      items.push(`静息心率 ${rhr7.toFixed(0)} > 80 bpm`)
    }
    if (steps30 != null && steps30 < 3143) {
      s += 10
      items.push(`日均步数 ${Math.round(steps30)} < 3,143`)
    }
    if (diet.purineSources >= 3) {
      s += 15
      items.push('高嘌呤餐周频率 ≥3')
    }
    if (diet.fructoseSources >= 3) {
      s += 12
      items.push('果糖饮料周频率 ≥3')
    }
    if (diet.alcoholEvents >= 2) {
      s += 10
      items.push('酒精摄入频繁')
    }
    if (vo2Trend != null && vo2Trend < -3) {
      s += 10
      items.push(`VO₂ max 下降 ${Math.abs(vo2Trend).toFixed(1)}`)
    }
    scores.push({
      direction: 'gout',
      label: '高尿酸/痛风',
      riskScore: normalizeScore(s, 100),
      maxScore: 100,
      level: s >= 55 ? 'red' : s >= 35 ? 'orange' : s >= 18 ? 'yellow' : 'green',
      riskItems: items,
      recommendation: '减少红肉/海鲜/啤酒/含糖饮料，增加饮水；建议检测血尿酸',
      actionRoute: '/diet',
    })
  }

  // ── 代谢综合征 ──
  {
    let s = 0
    const items: string[] = []
    if (userBmi != null && userBmi >= 28) {
      s += 3
      items.push(`BMI ${userBmi.toFixed(1)} ≥ 28`)
    } else if (userBmi != null && userBmi >= 25) {
      s += 2
      items.push(`BMI ${userBmi.toFixed(1)} ≥ 25`)
    }
    if (rhr7 != null && rhr7 > 80) {
      s += 2
      items.push(`静息心率 ${rhr7.toFixed(0)} > 80`)
    }
    if (hrv30 != null && hrv30 < 30) {
      s += 1
      items.push(`HRV ${hrv30.toFixed(0)}ms < 30`)
    }
    if (vo2Trend != null && vo2Trend < -3) {
      s += 2
      items.push('VO₂ max 显著下降')
    }
    if (steps30 != null && steps30 < 5000) {
      s += 1
      items.push(`日均步数 ${Math.round(steps30)} < 5,000`)
    }
    if (tempAmp != null && tempAmp < 1.8) {
      s += 1
      items.push(`手腕温度幅度 ${tempAmp.toFixed(1)}°C < 1.8°C`)
    }
    if (diet.highGlMeals >= 4) {
      s += 1
      items.push('高 GL 饮食频繁')
    }
    scores.push({
      direction: 'metabolic',
      label: '代谢综合征',
      riskScore: normalizeScore(s, 9),
      maxScore: 100,
      level: scoreToLevel(s, 6, 3),
      riskItems: items,
      recommendation: '建议空腹血糖、血脂检测；控制体重，每周 ≥150 分钟中等强度运动',
      actionRoute: '/metabolic',
    })
  }

  // ── NAFLD ──
  {
    let s = 0
    const items: string[] = []
    if (userBmi != null && userBmi >= 28) {
      s += 30
      items.push(`BMI ${userBmi.toFixed(1)} ≥ 28`)
    } else if (userBmi != null && userBmi >= 25) {
      s += 15
      items.push(`BMI ${userBmi.toFixed(1)} ≥ 25`)
    }
    if (tempAmp != null && tempAmp < 1.0) {
      s += 25
      items.push(`手腕温度幅度 ${tempAmp.toFixed(1)}°C < 1.0°C`)
    } else if (tempAmp != null && tempAmp < 1.8) {
      s += 10
      items.push(`手腕温度幅度 ${tempAmp.toFixed(1)}°C < 1.8°C`)
    }
    if (spo2Min != null && spo2Min < 92) {
      s += 15
      items.push(`SpO₂ 夜间最低 ${spo2Min.toFixed(0)}%`)
    }
    if (diet.fructoseSources >= 3) {
      s += 20
      items.push('高果糖摄入')
    } else if (diet.fructoseSources >= 1) {
      s += 10
      items.push('中等果糖摄入')
    }
    if (vo2Trend != null && vo2Trend < -2) {
      s += 10
      items.push('VO₂ max 下降趋势')
    }
    scores.push({
      direction: 'nafld',
      label: '脂肪肝 (NAFLD)',
      riskScore: s,
      maxScore: 100,
      level: s >= 50 ? 'red' : s >= 20 ? 'orange' : s >= 8 ? 'yellow' : 'green',
      riskItems: items,
      recommendation: '控制果糖/含糖饮料，减重至 BMI<24；建议腹部超声+肝功能',
      actionRoute: '/metabolic',
    })
  }

  // ── 缺铁倾向 ──
  {
    let s = 0
    const items: string[] = []
    if (vo2Trend != null && vo2Trend < -3) {
      s += 25
      items.push(`VO₂ max 显著下降 ${Math.abs(vo2Trend).toFixed(1)}`)
    } else if (vo2Trend != null && vo2Trend < -1.5) {
      s += 12
      items.push('VO₂ max 轻度下降')
    }
    if (spo2Min != null && spo2Min < 94) {
      s += 8
      items.push(`SpO₂ 低值 ${spo2Min.toFixed(0)}%（AW 精度有限）`)
    }
    if (diet.lowIronPattern) {
      s += 12
      items.push('口述铁摄入不足模式')
    }
    scores.push({
      direction: 'iron_deficiency',
      label: '缺铁倾向',
      riskScore: normalizeScore(s, 70),
      maxScore: 100,
      level: s >= 35 ? 'red' : s >= 15 ? 'orange' : s >= 5 ? 'yellow' : 'green',
      riskItems: items,
      recommendation: '建议血常规+铁蛋白；增加红肉/菠菜/豆类摄入',
      actionRoute: '/diet',
    })
  }

  // ── 胃肠/IBS ──
  {
    let s = 0
    const items: string[] = []
    if (diet.fodmapKeywords.length) {
      s += 10
      items.push(`高 FODMAP：${diet.fodmapKeywords.slice(0, 4).join('、')}`)
    }
    if (diet.giSymptoms.length) {
      s += 15 * diet.giSymptoms.length
      items.push(`GI 症状：${diet.giSymptoms.join('、')}`)
    }
    if (diet.fodmapFrequency >= 3) {
      s += 8
      items.push('高 FODMAP 饮食频繁')
    }
    if (hrv30 != null && hrv30 < 20) {
      s += 10
      items.push(`HRV ${hrv30.toFixed(0)}ms 偏低（自主神经）`)
    }
    scores.push({
      direction: 'ibs',
      label: '胃肠/不耐受',
      riskScore: normalizeScore(s, 50),
      maxScore: 100,
      level: s >= 30 ? 'red' : s >= 10 ? 'orange' : s >= 3 ? 'yellow' : 'green',
      riskItems: items,
      recommendation: '尝试低 FODMAP 饮食 2-6 周，记录食物-症状关联',
      actionRoute: '/diet',
    })
  }

  // ── 职业倦怠 ──
  {
    let s = 0
    const items: string[] = []
    if (hrvDropPct >= 15) {
      s += 30
      items.push(`HRV 低于基线 ${hrvDropPct.toFixed(0)}%`)
    } else if (hrvDropPct >= 8) {
      s += 15
      items.push(`HRV 低于基线 ${hrvDropPct.toFixed(0)}%`)
    }
    if (rhr7 != null && rhr7 > 75) {
      s += 15
      items.push('静息心率偏高')
    }
    if (diet.emotionalEating) {
      s += 10
      items.push('情绪化进食')
    }
    if (sleep7 != null && sleep7 < 6) {
      s += 15
      items.push(`平均睡眠 ${sleep7.toFixed(1)}h < 6h`)
    }
    if (diet.caffeineDependency) {
      s += 10
      items.push('咖啡因依赖模式')
    }
    scores.push({
      direction: 'burnout',
      label: '职业倦怠',
      riskScore: normalizeScore(s, 80),
      maxScore: 100,
      level: s >= 50 ? 'red' : s >= 30 ? 'orange' : s >= 15 ? 'yellow' : 'green',
      riskItems: items,
      recommendation: '保证恢复性睡眠，减少连续高负荷；必要时寻求专业支持',
      actionRoute: '/mental',
    })
  }

  // ── 情绪稳定 ──
  {
    let s = 0
    const items: string[] = []
    if (hrv30 != null && hrv30 < 15) {
      s += 30
      items.push(`HRV 极低 ${hrv30.toFixed(0)}ms`)
    } else if (hrv30 != null && hrv30 < 20) {
      s += 20
      items.push(`HRV 低 ${hrv30.toFixed(0)}ms`)
    } else if (hrv30 != null && hrv30 < 30) {
      s += 10
      items.push(`HRV 偏低 ${hrv30.toFixed(0)}ms`)
    }
    if (steps30 != null && steps30 < 3000) {
      s += 20
      items.push(`步数极低 ${Math.round(steps30)}/天`)
    } else if (steps30 != null && steps30 < 5000) {
      s += 8
      items.push('步数偏低')
    }
    if (diet.negativeEmotionDays >= 3) {
      s += 15
      items.push('7日负向情绪频繁')
    }
    if (diet.avgStress != null && diet.avgStress >= 7) {
      s += 12
      items.push(`平均压力 ${diet.avgStress.toFixed(1)}/10`)
    }
    if (diet.highGlMeals >= 2) {
      s += 8
      items.push('高 GI 餐频繁')
    }
    scores.push({
      direction: 'mood',
      label: '情绪稳定',
      riskScore: normalizeScore(s, 85),
      maxScore: 100,
      level: s >= 50 ? 'red' : s >= 25 ? 'orange' : s >= 12 ? 'yellow' : 'green',
      riskItems: items,
      recommendation: '规律运动、社交连接；必要时心理咨询或 PHQ-9/GAD-7 自评',
      actionRoute: '/mental',
    })
  }

  // ── 脑雾 ──
  {
    let s = 0
    const items: string[] = []
    const last = rows[rows.length - 1]
    if (last) {
      const deepPct =
        last.sleepHours && last.deepSleepMin
          ? (last.deepSleepMin / (last.sleepHours * 60)) * 100
          : null
      if (deepPct != null && deepPct < 15) {
        s += 25
        items.push(`深睡比例 ${deepPct.toFixed(0)}% < 15%`)
      }
    }
    if (sleep7 != null && sleep7 < 6) {
      s += 20
      items.push('睡眠不足')
    }
    if (diet.dhaInsufficient) {
      s += 20
      items.push('DHA 摄入不足')
    }
    if (diet.caffeineDependency) {
      s += 10
      items.push('咖啡因依赖')
    }
    scores.push({
      direction: 'brain_fog',
      label: '脑雾',
      riskScore: normalizeScore(s, 75),
      maxScore: 100,
      level: s >= 45 ? 'orange' : s >= 20 ? 'yellow' : 'green',
      riskItems: items,
      recommendation: '改善睡眠与 DHA 摄入；减少高糖餐与过量咖啡因',
      actionRoute: '/mental',
    })
  }

  // ── 女性健康 ──
  {
    let s = 0
    const items: string[] = []
    if (sex === 'female') {
      if (tempAmp != null && tempAmp >= 0.3) {
        s += 15
        items.push(`手腕温度偏移幅度 ${tempAmp.toFixed(2)}°C`)
      }
      if (hrvDropPct >= 15) {
        s += 15
        items.push('HRV 显著低于基线')
      }
      if (sleep7 != null && (sleep7 < 6 || sleep7 > 9)) {
        s += 10
        items.push(`睡眠 ${sleep7.toFixed(1)}h 偏离 7-8h`)
      }
      items.push('周期追踪需结合日历与体温趋势')
    } else {
      items.push('当前档案为非女性，仅展示框架')
    }
    scores.push({
      direction: 'women_health',
      label: '女性健康',
      riskScore: sex === 'female' ? normalizeScore(s, 50) : 0,
      maxScore: 100,
      level: sex === 'female' ? scoreToLevel(s, 30, 15) : 'green',
      riskItems: items,
      recommendation: sex === 'female' ? '追踪周期与手腕温度相对偏移；围绝经期建议妇科评估' : '不适用',
      actionRoute: '/women',
    })
  }

  return scores
}

export function computeOverallLevel(
  directionScores: DirectionScore[],
  metricReds: number,
  metricYellows: number,
): AlertLevel {
  const dirReds = directionScores.filter((d) => d.level === 'red').length
  const dirOranges = directionScores.filter((d) => d.level === 'orange').length
  if (dirReds >= 2 || metricReds >= 2) return 'red'
  if (dirReds >= 1 || dirOranges >= 2 || metricReds >= 1 || metricYellows >= 3) return 'orange'
  if (dirOranges >= 1 || metricYellows >= 1) return 'yellow'
  return 'green'
}
