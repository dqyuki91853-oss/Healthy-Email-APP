import type { BodyWeatherId } from '../types/bodyWeather'
import type { BodySeasonId } from '../types/bodySeason'

export type TeaNature = 'warm' | 'cool' | 'neutral'

export const TEA_NATURE_LABEL: Record<TeaNature, string> = {
  warm: '温性',
  cool: '凉性',
  neutral: '中性',
}

export interface TeaRecommendation {
  name: string
  whisper: string
  /** emoji for the tea */
  leaf: string
  nature: TeaNature
}

type TeaMap = Partial<Record<BodySeasonId, TeaRecommendation>>

/**
 * 身体茶语 — 天气 × 季节 → 一盏茶 + 一句话。
 * 不是养生，只是温度。
 */
const TEA_GUIDE: Record<BodyWeatherId, TeaMap> = {
  sunny: {
    spring: { name: '茉莉银针', whisper: '晴光好，宜淡不宜浓', leaf: '🍃', nature: 'cool' },
    summer: { name: '冷泡桂花乌龙', whisper: '夏天需要凉意——从茶开始', leaf: '🌿', nature: 'cool' },
    autumn: { name: '陈皮白茶', whisper: '秋日暖光，橘香绕杯', leaf: '🍊', nature: 'warm' },
    winter: { name: '红枣桂圆茶', whisper: '冬天要暖，从手心开始', leaf: '🫘', nature: 'warm' },
  },
  partly_cloudy: {
    spring: { name: '碧螺春', whisper: '薄云做盖，慢慢饮', leaf: '🍃', nature: 'cool' },
    summer: { name: '柠檬薄荷水', whisper: '多云天，清爽一下午', leaf: '🍋', nature: 'cool' },
    autumn: { name: '铁观音', whisper: '半晴半阴，茶要稳', leaf: '🍂', nature: 'neutral' },
    winter: { name: '普洱熟茶', whisper: '厚一点，暖一点', leaf: '🟤', nature: 'warm' },
  },
  overcast: {
    spring: { name: '龙井', whisper: '阴天也有嫩绿在杯中', leaf: '🍃', nature: 'cool' },
    summer: { name: '大麦茶', whisper: '麦香踏实，像阴天的安全感', leaf: '🌾', nature: 'cool' },
    autumn: { name: '正山小种', whisper: '烟熏暖意，撑开阴沉', leaf: '🍂', nature: 'warm' },
    winter: { name: '姜丝红茶', whisper: '阴冷的冬天，姜暖一盏', leaf: '🫚', nature: 'warm' },
  },
  rainy: {
    spring: { name: '玫瑰普洱', whisper: '雨打窗，花在杯里开', leaf: '🌹', nature: 'warm' },
    summer: { name: '薏米水', whisper: '雨天不闷，淡淡的就很舒服', leaf: '💧', nature: 'cool' },
    autumn: { name: '桂花龙井', whisper: '雨凉了秋天，桂花暖着杯', leaf: '🌸', nature: 'neutral' },
    winter: { name: '黑糖姜母茶', whisper: '外面下雨，里面慢慢煮', leaf: '🧉', nature: 'warm' },
  },
  foggy: {
    spring: { name: '白毫银针', whisper: '雾里看花，清茶一盏', leaf: '🌿', nature: 'cool' },
    summer: { name: '菊花普洱', whisper: '雾蒙蒙，菊香净', leaf: '🌼', nature: 'cool' },
    autumn: { name: '凤凰单丛', whisper: '雾秋正好，蜜兰香', leaf: '🍯', nature: 'neutral' },
    winter: { name: '老白茶', whisper: '雾重天寒，煮一壶老茶', leaf: '🫖', nature: 'warm' },
  },
  rainbow: {
    spring: { name: '玫瑰茄冷萃', whisper: '彩虹天，要一点酸甜', leaf: '🌺', nature: 'cool' },
    summer: { name: '西瓜薄荷水', whisper: '夏天彩虹，喝点甜的', leaf: '🍉', nature: 'cool' },
    autumn: { name: '蜂蜜柚子茶', whisper: '秋虹高挂，甜暖刚好', leaf: '🍯', nature: 'warm' },
    winter: { name: '肉桂苹果茶', whisper: '冬日彩虹，果香四溢', leaf: '🍎', nature: 'warm' },
  },
}

/**
 * 根据身体天气 + 季节推荐一盏茶。
 */
export function recommendTea(
  weatherId?: BodyWeatherId | null,
  seasonId?: BodySeasonId | null,
): TeaRecommendation {
  const weather = weatherId ?? 'partly_cloudy'
  const season = seasonId ?? 'autumn'

  const map = TEA_GUIDE[weather]
  const tea = map?.[season] ?? map?.autumn

  return tea ?? { name: '铁观音', whisper: '稳稳的，就好', leaf: '🍂', nature: 'neutral' }
}

/** 网格列顺序：天气（晴 → 彩虹） */
export const TEA_WEATHER_ORDER: BodyWeatherId[] = [
  'sunny',
  'partly_cloudy',
  'overcast',
  'rainy',
  'foggy',
  'rainbow',
]

/** 网格行顺序：季节（春 → 冬） */
export const TEA_SEASON_ORDER: BodySeasonId[] = ['spring', 'summer', 'autumn', 'winter']

export const TEA_WEATHER_LABEL: Record<BodyWeatherId, string> = {
  sunny: '晴',
  partly_cloudy: '多云',
  overcast: '阴',
  rainy: '雨',
  foggy: '雾',
  rainbow: '彩虹',
}

export const TEA_SEASON_LABEL: Record<BodySeasonId, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

export const TEA_COLLECTION_TOTAL = TEA_WEATHER_ORDER.length * TEA_SEASON_ORDER.length

export function teaKey(weatherId: BodyWeatherId, seasonId: BodySeasonId): string {
  return `${weatherId}_${seasonId}`
}

export function parseTeaKey(key: string): { weatherId: BodyWeatherId; seasonId: BodySeasonId } | null {
  const [weather, season] = key.split('_') as [BodyWeatherId?, BodySeasonId?]
  if (
    !weather ||
    !season ||
    !TEA_WEATHER_ORDER.includes(weather) ||
    !TEA_SEASON_ORDER.includes(season)
  ) {
    return null
  }
  return { weatherId: weather, seasonId: season }
}

export function comboLabel(weatherId: BodyWeatherId, seasonId: BodySeasonId): string {
  return `${TEA_WEATHER_LABEL[weatherId]}·${TEA_SEASON_LABEL[seasonId]}`
}
