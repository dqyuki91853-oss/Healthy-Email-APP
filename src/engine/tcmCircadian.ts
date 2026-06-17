import {
  TCM_CIRCADIAN_DEFAULTS,
  TCM_HIGHLIGHT_WINDOWS,
  TCM_MERIDIAN_SCHEDULE,
} from '../config/tcmMeridianSchedule'
import type { DailyWatchRow } from '../types/health'
import type { PersonalCircadianPlan } from '../types/tcm'

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function estimateSleepOnset(rows: DailyWatchRow[]): {
  onset: string
  confidence: 'high' | 'medium' | 'low'
  ruleIds: string[]
} {
  const recent = rows.filter((r) => r.sleepHours != null && r.sleepHours > 0).slice(-14)

  if (recent.length === 0) {
    return {
      onset: TCM_CIRCADIAN_DEFAULTS.FALLBACK_SLEEP_ONSET,
      confidence: 'low',
      ruleIds: ['TCM-sleep-onset-fallback'],
    }
  }

  const avgSleep = recent.reduce((s, r) => s + (r.sleepHours ?? 0), 0) / recent.length
  const baseMinutes = parseTimeToMinutes(TCM_CIRCADIAN_DEFAULTS.FALLBACK_SLEEP_ONSET)

  // 睡眠偏少 → 建议略早准备休息（代理 personal onset，非真实 segment）
  const adjusted = avgSleep < 6.5 ? baseMinutes - 30 : avgSleep >= 7.5 ? baseMinutes + 15 : baseMinutes

  return {
    onset: minutesToTime(adjusted),
    confidence: recent.length >= 7 ? 'medium' : 'low',
    ruleIds: ['TCM-sleep-onset-01', 'TCM-sleep-gate-01'],
  }
}

function activeWindowId(now: Date): string | null {
  const hour = now.getHours()
  for (const w of TCM_MERIDIAN_SCHEDULE) {
    if (w.hourStart <= w.hourEnd) {
      if (hour >= w.hourStart && hour < w.hourEnd) return w.windowId
    } else {
      if (hour >= w.hourStart || hour < w.hourEnd) return w.windowId
    }
  }
  return null
}

export function computePersonalCircadian(
  rows: DailyWatchRow[],
  now = new Date(),
): PersonalCircadianPlan {
  const { onset, confidence, ruleIds } = estimateSleepOnset(rows)
  const onsetMin = parseTimeToMinutes(onset)
  const gateMin = onsetMin - TCM_CIRCADIAN_DEFAULTS.SLEEP_GATE_OFFSET_MIN
  const personalSleepGate = minutesToTime(gateMin)

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const lastNight = rows[rows.length - 1]
  const active = activeWindowId(now)
  const highlight = TCM_HIGHLIGHT_WINDOWS.includes(active as (typeof TCM_HIGHLIGHT_WINDOWS)[number])
    ? active
    : null

  // ── Phased suggestion ──
  let suggestionText = '根据你最近的睡眠节奏，这是今天的休息参考窗口。'
  let phaseLabel: PersonalCircadianPlan['phaseLabel']
  const minutesUntilGate = gateMin - nowMinutes

  if (minutesUntilGate > 60) {
    phaseLabel = 'before_gate'
  } else if (minutesUntilGate > 0) {
    phaseLabel = 'wind_down'
  } else if (nowMinutes < onsetMin + 60) {
    phaseLabel = 'sleep_window'
  } else {
    phaseLabel = 'late'
  }

  switch (phaseLabel) {
    case 'before_gate':
      suggestionText = `还有约 ${Math.round(minutesUntilGate / 60)} 小时 ${Math.round(minutesUntilGate % 60)} 分，今晚可以在 ${personalSleepGate} 左右开始收工。`
      break
    case 'wind_down':
      suggestionText = `现在是「收工段」（亥时参考），少屏幕、少进食正好。`
      break
    case 'sleep_window':
      suggestionText = `参考入睡窗口是 ${onset} 前后，尽量靠近你的个人节奏。`
      break
    case 'late':
      suggestionText = `已经过了参考入睡时间；若还醒着，dim 屏幕、做两次慢呼吸也好。`
      break
  }

  // Override with highlight-based text if more specific
  const windDown = TCM_MERIDIAN_SCHEDULE.find((w) => w.windowId === 'W-亥')
  if (highlight === 'W-子' && phaseLabel === 'sleep_window') {
    suggestionText = `尽量在 ${onset} 前后进入睡眠，这是你的个人参考窗口（传统文化中的「子时」休息参考）。`
  } else if (highlight === 'W-亥' && windDown && (phaseLabel === 'wind_down' || phaseLabel === 'before_gate')) {
    suggestionText = windDown.suggestionText
  }

  // Last night override
  if (nowMinutes > onsetMin + 30 && (lastNight?.sleepHours ?? 8) < 6.5) {
    suggestionText =
      '昨晚休息得不太够，今晚可以试着在「准备休息」窗口里少屏幕、早点放松。'
  } else if ((lastNight?.sleepHours ?? 0) >= 7) {
    suggestionText = '昨晚休息得不错，今天保持温和的节奏就好。'
  }

  // ── Personalization hint ──
  const recent = rows.filter((r) => r.sleepHours != null && r.sleepHours > 0).slice(-14)
  const avgSleep = recent.length > 0
    ? (recent.reduce((s, r) => s + (r.sleepHours ?? 0), 0) / recent.length).toFixed(1)
    : null
  let personalizationHint = ''
  if (confidence === 'low') {
    personalizationHint = '数据尚少，参考一般成人作息推算'
  } else if (avgSleep) {
    personalizationHint = `近 14 天平均睡 ${avgSleep}h，据此调整个人窗口`
  }

  return {
    personalSleepOnset: onset,
    personalSleepGate,
    confidence,
    activeWindowId: highlight,
    suggestionText,
    matchedRuleIds: ruleIds,
    minutesUntilGate,
    phaseLabel,
    personalizationHint,
  }
}
