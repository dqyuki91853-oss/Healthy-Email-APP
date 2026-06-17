export type WuyinToneId = 'jue' | 'zhi' | 'gong' | 'shang' | 'yu'

export interface WuyinPrescription {
  toneId: WuyinToneId
  label: string
  frequencyHz: number
  durationSec: number
  humPattern: string
  instructionText: string
  disclaimer: string
  matchedRuleId: string
  citationIds: string[]
}

export type CircadianPhaseLabel = 'before_gate' | 'wind_down' | 'sleep_window' | 'late'

export interface PersonalCircadianPlan {
  personalSleepOnset: string
  personalSleepGate: string
  confidence: 'high' | 'medium' | 'low'
  activeWindowId: string | null
  suggestionText: string
  matchedRuleIds: string[]
  /** T1: minutes until personalSleepGate */
  minutesUntilGate: number
  /** T1: current phase relative to personal windows */
  phaseLabel: CircadianPhaseLabel
  /** T1: human-readable personalization hint */
  personalizationHint: string
}

export interface MeridianWindow {
  windowId: string
  label: string
  hourStart: number
  hourEnd: number
  meridianLabel: string
  modernProxy: string
  suggestionText: string
  citationIds: string[]
}
