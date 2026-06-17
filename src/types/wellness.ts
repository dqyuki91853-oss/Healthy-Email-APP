import type { BodyWeatherSnapshot } from './bodyWeather'
import type { MoodInferenceResult } from './mood'
import type { PersonalCircadianPlan, WuyinPrescription, WuyinListeningWindow } from './tcm'

export interface WellnessSnapshot {
  date: string
  bodyWeather: BodyWeatherSnapshot
  mood: MoodInferenceResult
  wuyin: WuyinPrescription | null
  circadian: PersonalCircadianPlan
  listeningWindow: WuyinListeningWindow | null
}
