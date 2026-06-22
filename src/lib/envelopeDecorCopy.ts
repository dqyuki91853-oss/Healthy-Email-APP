import type { BodyWeatherId } from '../types/bodyWeather'

export interface EnvelopeDecorCopy {
  /** 信纸露出的一行主文案 */
  paperLine: string
  /** 信纸副句 */
  paperSub: string
  /** 方体信袋内点缀短句 */
  bodyTagline: string
  /** 装饰关键词 — 驱动果蔬花造型 */
  botanicalKeywords: string[]
}

const WEATHER_KEYWORDS: Record<
  BodyWeatherId,
  { flora: string[]; produce: string[]; mood: string }
> = {
  sunny: {
    flora: ['向日', '金盏'],
    produce: ['鲜橙', '蜜桃'],
    mood: '晴光正好，果香轻启',
  },
  partly_cloudy: {
    flora: ['晨雾', '牵牛'],
    produce: ['野莓', '青梨'],
    mood: '薄云作笺，花意初开',
  },
  overcast: {
    flora: ['紫云', '铃兰'],
    produce: ['葡萄', '秋栗'],
    mood: '阴天也温柔，静候花信',
  },
  rainy: {
    flora: ['浅荷', '紫藤'],
    produce: ['青梅', '薄荷'],
    mood: '雨润新绿，信里带凉',
  },
  foggy: {
    flora: ['雾兰', '白茶'],
    produce: ['柚子', '山药'],
    mood: '雾中采字，慢拆花笺',
  },
  rainbow: {
    flora: ['虹色', '波斯菊'],
    produce: ['浆果', '蜜瓜'],
    mood: '雨后七色，鲜果作印',
  },
}

/**
 * 由身体天气关键词合成信封果蔬花文案与装饰词。
 */
export function buildEnvelopeDecorCopy(
  weatherId?: BodyWeatherId | null,
  weatherLabel?: string,
): EnvelopeDecorCopy {
  const id = weatherId ?? 'partly_cloudy'
  const pack = WEATHER_KEYWORDS[id]
  const label = weatherLabel?.trim()

  const botanicalKeywords = [
    ...pack.flora,
    ...pack.produce,
    '花信',
    '静养',
  ]

  const paperLine = label
    ? `${pack.mood}——今日身体是${label}。`
    : `${pack.mood}，轻启这封花信。`

  const paperSub = `采 ${pack.produce[0]} 与 ${pack.flora[0]} 的色，写给本周的你。`

  const bodyTagline = `${pack.produce.join(' · ')} · ${pack.flora.join(' · ')}`

  return {
    paperLine,
    paperSub,
    bodyTagline,
    botanicalKeywords,
  }
}
