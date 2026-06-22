export type BloodPressureSource = 'manual' | 'device' | 'csv'

export interface BloodPressureReading {
  id: string
  /** ISO datetime */
  measuredAt: string
  /** 收缩压 mmHg */
  systolicMmHg: number
  /** 舒张压 mmHg */
  diastolicMmHg: number
  /** 脉搏 bpm（血压仪可选） */
  pulseBpm?: number
  source: BloodPressureSource
  voiceLogId?: string
  note?: string
}

export type FoodFingerprintReaction = 'mild' | 'moderate' | 'strong'

/** 个人 N=1 食物与餐后血压反应（不展示诊断阈值）。 */
export interface FoodFingerprint {
  foodName: string
  sampleCount: number
  /** 收缩压峰值相对个人餐后基线的偏差，如 0.12 = +12% */
  avgPeakDeltaPct: number
  reaction: FoodFingerprintReaction
  lastSeenAt: string
}

export const BP_SYSTOLIC_MIN = 60
export const BP_SYSTOLIC_MAX = 250
export const BP_DIASTOLIC_MIN = 40
export const BP_DIASTOLIC_MAX = 150
export const BP_PULSE_MIN = 30
export const BP_PULSE_MAX = 220
