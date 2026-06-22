/**
 * 五音映射与处方规则骨架 — 详见 docs/wuyin-tone-rules.md
 */
import type { MoodTag } from '../types/mood'
import type { WuyinToneId } from '../types/tcm'

export const WUYIN_DISCLAIMER =
  '传统参考与放松练习，非医疗诊断或音疗治疗；频率为练习用参考音高。'

export interface WuyinToneDef {
  toneId: WuyinToneId
  label: string
  organLabel: string
  emotionLabel: string
  frequencyHz: number
  citationIds: string[]
}

export const WUYIN_TONES: Record<WuyinToneId, WuyinToneDef> = {
  jue: {
    toneId: 'jue',
    label: '角',
    organLabel: '肝',
    emotionLabel: '郁 / 怒',
    frequencyHz: 293.66,
    citationIds: ['TCM-WUYIN-001', 'MUSIC-TH-001'],
  },
  zhi: {
    toneId: 'zhi',
    label: '徵',
    organLabel: '心',
    emotionLabel: '扰 / 急',
    frequencyHz: 329.63,
    citationIds: ['TCM-WUYIN-001', 'MUSIC-TH-001'],
  },
  gong: {
    toneId: 'gong',
    label: '宫',
    organLabel: '脾',
    emotionLabel: '思 / 虑',
    frequencyHz: 261.63,
    citationIds: ['TCM-WUYIN-001'],
  },
  shang: {
    toneId: 'shang',
    label: '商',
    organLabel: '肺',
    emotionLabel: '悲 / 忧',
    frequencyHz: 220.0,
    citationIds: ['TCM-WUYIN-001'],
  },
  yu: {
    toneId: 'yu',
    label: '羽',
    organLabel: '肾',
    emotionLabel: '恐 / 虚',
    frequencyHz: 196.0,
    citationIds: ['TCM-WUYIN-001'],
  },
}

export interface WuyinPrescriptionRule {
  ruleId: string
  moodTag: MoodTag | 'any'
  toneId: WuyinToneId | null
  durationSec: number
  humPattern: string
  instructionText: string
}

export const WUYIN_PRESCRIPTION_RULES: WuyinPrescriptionRule[] = [
  {
    ruleId: 'WY-anxiety-01',
    moodTag: 'anxiety',
    toneId: 'zhi',
    durationSec: 90,
    humPattern: 'inhale-hum-exhale-4-6-6',
    instructionText: '找到「徵」音，轻轻哼，感觉胸腔慢慢松开。',
  },
  {
    ruleId: 'WY-low-01',
    moodTag: 'low_mood',
    toneId: 'shang',
    durationSec: 90,
    humPattern: 'long-exhale-hum',
    instructionText: '用「商」音配长呼气，不追求响，追求稳。',
  },
  {
    ruleId: 'WY-irritable-01',
    moodTag: 'irritable',
    toneId: 'jue',
    durationSec: 75,
    humPattern: 'short-hum-6-rounds',
    instructionText: '「角」音短一点、慢一下，像把肩上的劲放下来。',
  },
  {
    ruleId: 'WY-fatigue-01',
    moodTag: 'fatigue',
    toneId: 'gong',
    durationSec: 90,
    humPattern: 'low-sustained-hum',
    instructionText: '「宫」音低而稳，适合今天有点累的身体。',
  },
  {
    ruleId: 'WY-unknown-01',
    moodTag: 'unknown',
    toneId: 'gong',
    durationSec: 60,
    humPattern: 'low-sustained-hum',
    instructionText: '不确定时，用最中性的「宫」音慢慢哼一会儿。',
  },
  {
    ruleId: 'WY-calm-01',
    moodTag: 'calm',
    toneId: 'yu',
    durationSec: 75,
    humPattern: 'long-exhale-hum',
    instructionText: '「羽」音低而柔，像水落静潭，帮身心慢慢沉静。',
  },
]

export const WUYIN_AUDIO_DEFAULTS = {
  waveform: 'sine' as const,
  fadeInMs: 800,
  fadeOutMs: 1200,
  volume: 0.15,
}
