export type ReliabilityLevel = 'reliable' | 'trend_only' | 'unreliable'

export type EvidenceLevel = 'strong' | 'moderate' | 'heuristic'

export type AlertLevel = 'green' | 'yellow' | 'orange' | 'red'

export type WalkingSteadiness = 'normal' | 'low' | 'very_low'

export interface DailyWatchRow {
  date: string
  dailySteps: number | null
  activeEnergyKcal: number | null
  exerciseMinutes: number | null
  restingHr: number | null
  hrvSdnn: number | null
  hrvReadings: number[]
  spo2Readings: number[]
  spo2DesatEvents: number | null
  respiratoryRateSleep: number | null
  walkingAsymmetryPct: number | null
  walkingSteadiness: WalkingSteadiness | null
  wristTempRaw: number | null
  sleepHours: number | null
  deepSleepMin: number | null
  remSleepMin: number | null
  coreSleepMin: number | null
  inBedMin: number | null
  awakeEpisodes: number | null
  vo2max: number | null
  cardioRecovery1min: number | null
  daylightMinutes: number | null
  environmentalNoiseDb: number | null
}

export interface PersonalBaseline {
  metric: string
  mean: number
  sd: number
  ewma: number
  nSamples: number
  maturityDays: number
}

export interface UserProfile {
  age?: number
  sex?: 'male' | 'female' | 'other'
  heightCm?: number
  bodyMassKg?: number
  waistCm?: number
  isVegetarian?: boolean
  isLongDistanceRunner?: boolean
}

export interface HealthImportMeta {
  importedAt: string
  source: 'apple_health_xml' | 'apple_health_zip' | 'csv'
  recordCount: number
  dateRange: { start: string; end: string }
}
