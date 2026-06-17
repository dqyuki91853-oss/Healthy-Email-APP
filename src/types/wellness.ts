import type { BodyWeatherSnapshot } from './bodyWeather'
import type { MoodInferenceResult } from './mood'
import type { PersonalCircadianPlan, WuyinPrescription } from './tcm'

export interface WellnessSnapshot {
  date: string
  bodyWeather: BodyWeatherSnapshot
  mood: MoodInferenceResult
  wuyin: WuyinPrescription | null
  circadian: PersonalCircadianPlan
}
