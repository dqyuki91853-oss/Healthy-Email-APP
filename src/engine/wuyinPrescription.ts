import {
  WUYIN_DISCLAIMER,
  WUYIN_PRESCRIPTION_RULES,
  WUYIN_TONES,
} from '../config/wuyinToneMap'
import type { BodyWeatherSnapshot } from '../types/bodyWeather'
import type { MoodInferenceResult, MoodTag } from '../types/mood'
import type { WuyinPrescription } from '../types/tcm'

export function computeWuyinPrescription(
  mood: MoodInferenceResult,
  bodyWeather?: BodyWeatherSnapshot | null,
): WuyinPrescription | null {
  let moodTag: MoodTag = mood.dominant

  if (mood.source === 'voice' && mood.dominant === 'calm') {
    return null
  }

  const rule =
    WUYIN_PRESCRIPTION_RULES.find((r) => r.moodTag === moodTag) ??
    WUYIN_PRESCRIPTION_RULES.find((r) => r.moodTag === 'unknown')

  if (!rule || rule.toneId == null || rule.durationSec === 0) {
    return null
  }

  const tone = WUYIN_TONES[rule.toneId]
  let durationSec = rule.durationSec
  let instructionText = rule.instructionText

  if (bodyWeather?.weatherId === 'rainy' && moodTag === 'anxiety') {
    durationSec += 15
    instructionText = `${instructionText} 今天像下雨天，我们撑伞慢慢哼。`
  }

  if (bodyWeather?.weatherId === 'rainbow' && moodTag === 'fatigue') {
    return null
  }

  return {
    toneId: rule.toneId,
    label: `${tone.label}音 · ${tone.organLabel}`,
    frequencyHz: tone.frequencyHz,
    durationSec,
    humPattern: rule.humPattern,
    instructionText,
    disclaimer: WUYIN_DISCLAIMER,
    matchedRuleId: rule.ruleId,
    citationIds: tone.citationIds,
  }
}
