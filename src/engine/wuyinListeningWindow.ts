import { WUYIN_TONES } from '../config/wuyinToneMap'
import type {
  PersonalCircadianPlan,
  WuyinListeningWindow,
  WuyinPrescription,
  WuyinToneId,
} from '../types/tcm'

/** 收工窗口提前量（分钟）— 产品确认 */
export const WUYIN_GATE_LEAD_MIN = 15

/** 收工前试听暖场区间（分钟） */
export const WUYIN_WARMUP_BEFORE_GATE_MIN = 90

const SECONDARY_MERIDIAN: Array<{
  hourStart: number
  hourEnd: number
  windowId: string
  toneId: WuyinToneId
  cultureLine: string
}> = [
  { hourStart: 5, hourEnd: 7, windowId: 'W-卯', toneId: 'jue', cultureLine: '卯时 · 角音舒展' },
  { hourStart: 11, hourEnd: 13, windowId: 'W-午', toneId: 'zhi', cultureLine: '午时 · 徵音调息' },
  { hourStart: 17, hourEnd: 19, windowId: 'W-酉', toneId: 'shang', cultureLine: '酉时 · 商音释压' },
  { hourStart: 21, hourEnd: 23, windowId: 'W-亥', toneId: 'yu', cultureLine: '亥时 · 羽音入静' },
]

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function activeSecondaryMeridian(hour: number) {
  return SECONDARY_MERIDIAN.find((w) => {
    if (w.hourStart <= w.hourEnd) {
      return hour >= w.hourStart && hour < w.hourEnd
    }
    return hour >= w.hourStart || hour < w.hourEnd
  })
}

export function computeWuyinListeningWindow(
  circadian: PersonalCircadianPlan,
  wuyin: WuyinPrescription | null,
  options?: { now?: Date; practicedToday?: boolean },
): WuyinListeningWindow | null {
  if (!wuyin) return null

  const now = options?.now ?? new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const gateMin = parseTimeToMinutes(circadian.personalSleepGate)
  const onsetMin = parseTimeToMinutes(circadian.personalSleepOnset)
  const windowStartMin = gateMin - WUYIN_GATE_LEAD_MIN
  const windowEndMin = onsetMin

  const windowStart = minutesToTime(windowStartMin)
  const windowEnd = minutesToTime(windowEndMin)
  const toneHint = wuyin.toneId
  const toneLabel = WUYIN_TONES[toneHint].label

  const inPrimaryWindow = nowMin >= windowStartMin && nowMin < windowEndMin
  const inWarmup =
    circadian.phaseLabel === 'before_gate' &&
    circadian.minutesUntilGate > 0 &&
    circadian.minutesUntilGate <= WUYIN_WARMUP_BEFORE_GATE_MIN

  const practicedToday = options?.practicedToday ?? false
  const completedInWindow = practicedToday && (inPrimaryWindow || nowMin >= windowStartMin)

  const minutesUntilOpen = nowMin < windowStartMin ? windowStartMin - nowMin : 0
  const minutesUntilClose = inPrimaryWindow ? Math.max(0, windowEndMin - nowMin) : 0

  let tier: WuyinListeningWindow['tier'] = 'closed'
  let suggestedMode: WuyinListeningWindow['suggestedMode'] = 'either'
  let meridianWindowId: string | null = circadian.activeWindowId
  let meridianToneHint: WuyinToneId | undefined
  let reasonText = '今日五音处方已备好，按你的节奏来就好。'

  if (circadian.phaseLabel === 'late') {
    tier = 'closed'
    reasonText = '已过参考入睡时间；若还醒着，两次慢呼吸或极轻的自然音即可。'
  } else if (completedInWindow) {
    tier = 'primary'
    suggestedMode = 'hum'
    reasonText = '今日收工练习已完成，可以安心收工了。'
  } else if (inPrimaryWindow) {
    tier = 'primary'
    if (nowMin < gateMin) {
      suggestedMode = 'listen'
      reasonText = `收工窗口已开启（${windowStart}–${windowEnd}），可先听处方三轨暖场，准备跟哼 ${toneLabel}音。`
    } else if (circadian.phaseLabel === 'sleep_window') {
      suggestedMode = 'listen'
      reasonText = `入静段（${windowEnd} 前后），低音量自然音或一次短哼 ${toneLabel}音 即可。`
    } else {
      suggestedMode = 'hum'
      reasonText = `现在是收工跟哼窗口（${windowStart}–${windowEnd}），建议 3 分钟 ${toneLabel}音 跟哼练习。`
    }
  } else if (inWarmup) {
    tier = 'secondary'
    suggestedMode = 'listen'
    reasonText = `距收工窗口约 ${Math.floor(circadian.minutesUntilGate / 60)} 小时 ${circadian.minutesUntilGate % 60} 分，可先试听 ${toneLabel}音 处方。`
  } else if (nowMin < windowStartMin) {
    const secondary = activeSecondaryMeridian(now.getHours())
    tier = 'secondary'
    suggestedMode = 'listen'
    if (secondary) {
      meridianWindowId = secondary.windowId
      meridianToneHint = secondary.toneId
      reasonText = `${secondary.cultureLine}；今日处方为 ${toneLabel}音，可先轻听。`
    } else {
      reasonText = `今晚 ${windowStart} 开启收工聆听窗口，届时适合 ${toneLabel}音 跟哼。`
    }
  } else {
    tier = 'closed'
    reasonText = '收工聆听窗口已结束，明天再续。'
  }

  return {
    tier,
    suggestedMode,
    windowStart,
    windowEnd,
    phaseLabel: circadian.phaseLabel,
    meridianWindowId,
    toneHint,
    meridianToneHint,
    reasonText,
    minutesUntilOpen,
    minutesUntilClose,
    completedInWindow,
  }
}
