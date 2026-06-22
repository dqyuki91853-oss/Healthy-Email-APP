import type { WuyinPrescription } from '../types/tcm'
import type { BodyWeatherSnapshot } from '../types/bodyWeather'

type MoodTag = 'anxiety' | 'low_mood' | 'irritable' | 'fatigue' | 'calm' | 'unknown'

const MOOD_CONTEXT: Record<MoodTag, string> = {
  unknown: '还不确定今天的情绪底色，先用最中性的宫音，慢慢哼一会儿。',
  fatigue: '身体有点像「阴天」，宫音低而稳，帮节奏慢下来。',
  anxiety: '心里有点急，徵音配慢呼吸，像把胸腔的结松开一点。',
  low_mood: '情绪偏沉，商音配长呼气，不追求响，追求稳。',
  irritable: '肩上有劲，角音短哼几轮，像把劲轻轻放下来。',
  calm: '今天情绪平稳，跟着羽音慢慢沉静就好。',
}

/** Weather-specific add-on (appended to mood context) */
function weatherAddon(w: BodyWeatherSnapshot | null, moodTag: MoodTag): string {
  if (!w) return ''
  // rainbow hides the card entirely, no context needed
  if (w.weatherId === 'rainbow') return ''
  if (w.weatherId === 'overcast' && moodTag === 'fatigue') {
    return '外面也阴，里面也慢，宫音正好。'
  }
  if (w.weatherId === 'rainy' && moodTag === 'anxiety') {
    return '下雨天心也闷，徵音帮你透透气。'
  }
  if (w.weatherId === 'foggy' && moodTag === 'unknown') {
    return '雾里看花时，先听听宫音，慢慢的。'
  }
  return ''
}

export function getWuyinContextLine(
  _prescription: WuyinPrescription,
  moodTag: MoodTag,
  weather?: BodyWeatherSnapshot | null,
): string {
  void _prescription;
  const base = MOOD_CONTEXT[moodTag] ?? MOOD_CONTEXT.unknown
  const addon = weatherAddon(weather ?? null, moodTag)
  return addon ? `${base} ${addon}` : base
}
