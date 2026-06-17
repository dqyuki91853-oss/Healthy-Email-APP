import type { WuyinPrescription } from '../types/tcm'

const OPEN_LOFI = '/audio/wuyin/open-lofi'

export interface WuyinAudioTrack {
  id: string
  toneId: string
  label: string
  /** Human-readable description for the carousel card */
  description: string
  /** Mood tag — maps to MoodInference.gentleNote */
  moodTag: string
  /** Expected duration in seconds (metadata; mp3 may differ slightly) */
  durationSec: number
  /** Category for carousel grouping */
  category: 'ambient' | 'melody' | 'nature'
  /** Local mp3 path when bundled (OpenLo-Fi CC0) */
  src?: string
  license?: 'CC0'
  /** Frequency in Hz for hum reference / synth fallback */
  frequencyHz: number
  /** Synth fallback only */
  waveform?: OscillatorType
  harmonics?: number[]
  modulation?: {
    type: 'tremolo' | 'vibrato' | 'none'
    rateHz: number
    depth: number
  }
  reverbMix?: number
}

/**
 * Curated audio library — OpenLo-Fi CC0 mp3 when present, Web Audio synth fallback.
 */
export const WUYIN_AUDIO_LIBRARY: WuyinAudioTrack[] = [
  // ── 宫 (Gong) — 土, 稳定安神 ──
  {
    id: 'gong-ambient',
    toneId: 'gong',
    label: '大地之息',
    description: '晨雾 Lofi，像远处山谷缓缓苏醒',
    moodTag: 'anxiety',
    durationSec: 180,
    category: 'ambient',
    src: `${OPEN_LOFI}/teacup-morning-fog.mp3`,
    license: 'CC0',
    frequencyHz: 261.63,
  },
  {
    id: 'gong-melody',
    toneId: 'gong',
    label: '归园田居',
    description: '清晨键盘旋律，回到安心的土壤',
    moodTag: 'fatigue',
    durationSec: 120,
    category: 'melody',
    src: `${OPEN_LOFI}/dust-on-the-morning-keys.mp3`,
    license: 'CC0',
    frequencyHz: 261.63,
  },
  {
    id: 'gong-nature',
    toneId: 'gong',
    label: '溪边足音',
    description: '绿野薄雾，混合水声与脚步的白噪音感',
    moodTag: 'low_mood',
    durationSec: 240,
    category: 'nature',
    src: `${OPEN_LOFI}/mist-over-green-fields.mp3`,
    license: 'CC0',
    frequencyHz: 261.63,
  },

  // ── 商 (Shang) — 金, 清肃收敛 ──
  {
    id: 'shang-ambient',
    toneId: 'shang',
    label: '青铜余韵',
    description: '日出前钟声，适合静坐收心',
    moodTag: 'irritable',
    durationSec: 150,
    category: 'ambient',
    src: `${OPEN_LOFI}/bells-before-sunrise.mp3`,
    license: 'CC0',
    frequencyHz: 293.66,
  },
  {
    id: 'shang-melody',
    toneId: 'shang',
    label: '秋水长天',
    description: '安静书堆里的清亮旋律',
    moodTag: 'calm',
    durationSec: 120,
    category: 'melody',
    src: `${OPEN_LOFI}/stacks-of-quiet-books.mp3`,
    license: 'CC0',
    frequencyHz: 293.66,
  },
  {
    id: 'shang-nature',
    toneId: 'shang',
    label: '雨后石径',
    description: '人行道水洼，清肃而通透',
    moodTag: 'irritable',
    durationSec: 180,
    category: 'nature',
    src: `${OPEN_LOFI}/sidewalk-puddles.mp3`,
    license: 'CC0',
    frequencyHz: 293.66,
  },

  // ── 角 (Jue) — 木, 舒展条达 ──
  {
    id: 'jue-ambient',
    toneId: 'jue',
    label: '新芽破土',
    description: '阵雨间隙的生机，清晨鸟鸣与微风',
    moodTag: 'low_mood',
    durationSec: 180,
    category: 'ambient',
    src: `${OPEN_LOFI}/bloom-between-showers.mp3`,
    license: 'CC0',
    frequencyHz: 329.63,
  },
  {
    id: 'jue-melody',
    toneId: 'jue',
    label: '春风拂柳',
    description: '春园循环乐句，帮助舒展思绪',
    moodTag: 'fatigue',
    durationSec: 120,
    category: 'melody',
    src: `${OPEN_LOFI}/spring-garden-loops.mp3`,
    license: 'CC0',
    frequencyHz: 329.63,
  },
  {
    id: 'jue-nature',
    toneId: 'jue',
    label: '飞花轻扬',
    description: '花瓣随风，轻快的自然律动',
    moodTag: 'low_mood',
    durationSec: 200,
    category: 'nature',
    src: `${OPEN_LOFI}/petals-in-the-breeze.mp3`,
    license: 'CC0',
    frequencyHz: 329.63,
  },

  // ── 徵 (Zhi) — 火, 通明升散 ──
  {
    id: 'zhi-ambient',
    toneId: 'zhi',
    label: '篝火噼啪',
    description: '壁炉循环白噪音，温暖放松',
    moodTag: 'anxiety',
    durationSec: 200,
    category: 'ambient',
    src: `${OPEN_LOFI}/fireplace-loop.mp3`,
    license: 'CC0',
    frequencyHz: 392.0,
  },
  {
    id: 'zhi-melody',
    toneId: 'zhi',
    label: '夏日午后',
    description: '金色午后 Groove，阳光透过树叶',
    moodTag: 'irritable',
    durationSec: 120,
    category: 'melody',
    src: `${OPEN_LOFI}/golden-afternoon-groove.mp3`,
    license: 'CC0',
    frequencyHz: 392.0,
  },
  {
    id: 'zhi-nature',
    toneId: 'zhi',
    label: '琥珀窗光',
    description: '窗玻璃上的暖色光斑，通明而不刺目',
    moodTag: 'anxiety',
    durationSec: 180,
    category: 'nature',
    src: `${OPEN_LOFI}/amber-windowpane.mp3`,
    license: 'CC0',
    frequencyHz: 392.0,
  },

  // ── 羽 (Yu) — 水, 沉静收藏 ──
  {
    id: 'yu-ambient',
    toneId: 'yu',
    label: '深海静域',
    description: '水下梦境环境，帮助睡前静心',
    moodTag: 'irritable',
    durationSec: 240,
    category: 'ambient',
    src: `${OPEN_LOFI}/underwater-dreamscape.mp3`,
    license: 'CC0',
    frequencyHz: 440.0,
  },
  {
    id: 'yu-melody',
    toneId: 'yu',
    label: '月下涟漪',
    description: '卫星摇篮曲，A 调幽静旋律',
    moodTag: 'calm',
    durationSec: 120,
    category: 'melody',
    src: `${OPEN_LOFI}/satellite-lullaby.mp3`,
    license: 'CC0',
    frequencyHz: 440.0,
  },
  {
    id: 'yu-nature',
    toneId: 'yu',
    label: '潮池暮色',
    description: '黄昏潮池，低频水声缓缓退去',
    moodTag: 'calm',
    durationSec: 240,
    category: 'nature',
    src: `${OPEN_LOFI}/tide-pools-at-twilight.mp3`,
    license: 'CC0',
    frequencyHz: 440.0,
  },
]

/**
 * Recommend 3 tracks matching the given prescription tone + mood.
 * Falls back to the first 3 tracks if no match.
 */
export function recommendWuyinAudio(
  prescription: WuyinPrescription,
  moodTag?: string,
): WuyinAudioTrack[] {
  const sameTone = WUYIN_AUDIO_LIBRARY.filter((t) => t.toneId === prescription.toneId)

  const moodMatch = moodTag ? sameTone.filter((t) => t.moodTag === moodTag) : []
  const rest = sameTone.filter((t) => !moodMatch.includes(t))

  const picks = [...moodMatch, ...rest].slice(0, 3)

  if (picks.length >= 3) return picks

  const filler = WUYIN_AUDIO_LIBRARY.filter((t) => !picks.includes(t)).slice(0, 3 - picks.length)
  return [...picks, ...filler]
}
