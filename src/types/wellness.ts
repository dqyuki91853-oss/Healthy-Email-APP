import type { BodySeasonSnapshot } from './bodySeason'
import type { BodyWeatherSnapshot } from './bodyWeather'
import type { CaseFile } from './caseFile'
import type { DailyWeatherBrief } from './dailyBrief'
import type { InnerClimateSnapshot } from './innerClimate'
import type { MoodInferenceResult } from './mood'
import type { PersonalCircadianPlan, WuyinPrescription, WuyinListeningWindow } from './tcm'

export interface WellnessSnapshot {
  date: string
  bodyWeather: BodyWeatherSnapshot
  mood: MoodInferenceResult
  wuyin: WuyinPrescription | null
  circadian: PersonalCircadianPlan
  listeningWindow: WuyinListeningWindow | null
  /** E1：饮食+活动+血压 → 稳/起伏/余波 */
  innerClimate: InnerClimateSnapshot | null
  /** E1：今日能量、适宜 chip、趋势、FF-7 决策句 */
  dailyBrief: DailyWeatherBrief | null
  /** E2：案卷列表（含历史；UI 首页只取最新 1 条 open） */
  caseFiles: CaseFile[]
  /** E3：个人生理季 */
  bodySeason: BodySeasonSnapshot | null
}
