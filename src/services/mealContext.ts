import type { FollowUpQuestion, MealSlot, VoiceExtraction } from '../types/voice'
import { v4 } from '../engine/uuid'

export interface MealExtractContext {
  recordDate: string
  mealSlot: MealSlot
  /** 同一 recordDate 内已有记录（不含当前草稿） */
  dayLogs?: VoiceExtraction[]
}

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
  unknown: '本餐',
}

/** 从口述推断餐次 */
export function inferMealSlotFromTranscript(text: string): MealSlot | null {
  if (/早餐|早饭|早上吃|清晨|上午吃/.test(text)) return 'breakfast'
  if (/午餐|午饭|中午吃|午间/.test(text)) return 'lunch'
  if (/晚餐|晚饭|晚上吃|夜里吃|宵夜|夜宵/.test(text)) return 'dinner'
  if (/加餐|零食|下午茶|点心|宵夜|夜宵|垫肚子/.test(text)) return 'snack'
  return null
}

/** 当日已记录饮食摘要，供 LLM 与追问去重 */
export function buildDayDietSummary(dayLogs: VoiceExtraction[]): string {
  if (!dayLogs.length) return ''
  return dayLogs
    .map((log) => {
      const slot = log.mealSlot ? SLOT_LABELS[log.mealSlot] : '未标注餐次'
      const foods = log.foods.map((f) => f.name).join('、') || log.transcript.slice(0, 40)
      return `${slot}：${foods}`
    })
    .join('；')
}

/** 从当日已有记录推断「已知事实」，避免重复追问 */
export function getKnownFactsFromDayLogs(dayLogs: VoiceExtraction[]): Set<string> {
  const corpus = dayLogs.map((l) => `${l.transcript} ${l.foods.map((f) => f.name).join(' ')}`).join(' ')
  const facts = new Set<string>()
  if (/拉面|刀削|米粉|米线|泡面|意面|挂面|刀切面|重庆小面|热干面/.test(corpus)) facts.add('noodle_type')
  if (/牛肉|鸡肉|猪肉|排骨|鱼|虾|海鲜|肉|蛋|豆腐/.test(corpus)) facts.add('has_protein')
  if (/汤全|全喝|喝了一半|没喝汤|汤没/.test(corpus)) facts.add('soup_consumed')
  if (/小碗|中碗|大碗|小份|大份|半份|一两|二两|\d+个/.test(corpus)) facts.add('portion')
  if (/全糖|半糖|无糖|三分糖|少糖/.test(corpus)) facts.add('sweetness')
  if (/蒸|煮|炒|炸|烤|红烧|凉拌|炖|煎/.test(corpus)) facts.add('cooking')
  if (/油条|豆浆|粥|面包|包子/.test(corpus) && /蛋|奶|豆浆|豆腐|肉包/.test(corpus)) facts.add('breakfast_protein')
  return facts
}

const RESOLVED_BY_FACT: Array<{ fact: string; questionPatterns: RegExp[] }> = [
  { fact: 'noodle_type', questionPatterns: [/什么面/, /面种/, /哪种面/] },
  { fact: 'has_protein', questionPatterns: [/有肉/, /海鲜/, /蛋白质/] },
  { fact: 'soup_consumed', questionPatterns: [/汤喝/, /汤底/, /喝汤/] },
  { fact: 'portion', questionPatterns: [/多大份/, /多少饭/, /多大碗/, /多少个/] },
  { fact: 'sweetness', questionPatterns: [/甜度/, /含糖/, /全糖/] },
  { fact: 'cooking', questionPatterns: [/怎么做/, /怎么做的/, /烹饪/] },
  { fact: 'breakfast_protein', questionPatterns: [/蛋白质/, /蛋|奶|豆浆/] },
]

export function filterAlreadyKnownQuestions(
  questions: FollowUpQuestion[],
  knownFacts: Set<string>,
): FollowUpQuestion[] {
  return questions.filter((q) => {
    for (const { fact, questionPatterns } of RESOLVED_BY_FACT) {
      if (knownFacts.has(fact) && questionPatterns.some((re) => re.test(q.question))) {
        return false
      }
    }
    return true
  })
}

/** 餐次衍生追问：同一套探测器，按餐次调整侧重点 */
export function buildMealSlotFollowUps(
  mealSlot: MealSlot,
  transcript: string,
  knownFacts: Set<string>,
): FollowUpQuestion[] {
  const extra: FollowUpQuestion[] = []
  const t = transcript

  if (mealSlot === 'breakfast') {
    const carbOnly = /油条|面包|粥|包子|煎饼|烧饼|面条|豆浆/.test(t) && !/蛋|奶|豆浆|豆腐|肉|虾|鱼|鸡肉|猪肉/.test(t)
    if (carbOnly && !knownFacts.has('breakfast_protein')) {
      extra.push({
        id: v4(),
        question: '早餐有搭配蛋白质吗？（鸡蛋/牛奶/豆浆/肉包）',
        reason: '早餐段：低蛋白高碳水模式与脑雾、午后血糖波动相关',
        field: 'components',
        priority: 2,
        quickOptions: ['有鸡蛋', '有牛奶', '有豆浆', '只有碳水', '没吃早餐'],
      })
    }
    if (/咖啡|茶|奶茶/.test(t) && !/无糖|奶|豆浆/.test(t)) {
      extra.push({
        id: v4(),
        question: '咖啡/茶是空腹喝还是餐后喝？',
        reason: '早餐段：空腹咖啡因影响铁吸收与胃不适',
        field: 'timing',
        priority: 3,
        quickOptions: ['餐后', '空腹', '配早餐一起'],
      })
    }
  }

  if (mealSlot === 'lunch') {
    if (/外卖|盒饭|食堂/.test(t) && !/菜|肉|鱼/.test(t)) {
      extra.push({
        id: v4(),
        question: '外卖/盒饭主菜是什么？配菜有哪些？',
        reason: '午餐段：外食钠油普遍偏高，需明确主菜构成',
        field: 'components',
        priority: 2,
        quickOptions: ['一荤一素', '盖饭', '麻辣烫', '轻食沙拉', '炸鸡汉堡'],
      })
    }
  }

  if (mealSlot === 'dinner') {
    if (VAGUE.test(t) || /较多|挺多|差不多/.test(t)) {
      extra.push({
        id: v4(),
        question: '晚餐大概吃了多少？比午餐多还是少？',
        reason: '晚餐段：热量占比过高与情绪化进食、体重趋势相关',
        field: 'portion',
        priority: 2,
        quickOptions: ['比午餐少', '和午餐差不多', '比午餐多', '主要吃了主食', '宵夜也吃了'],
      })
    }
    if (/零食|甜品|蛋糕|冰淇淋/.test(t)) {
      extra.push({
        id: v4(),
        question: '是餐后甜品还是当正餐？',
        reason: '晚餐段：高糖高脂零食叠加升糖负荷',
        field: 'timing',
        priority: 3,
        quickOptions: ['餐后甜品', '当正餐', '宵夜加餐'],
      })
    }
  }

  if (mealSlot === 'snack') {
    extra.push({
      id: v4(),
      question: '什么零食？大概多少？',
      reason: '加餐段：零食种类与份量是情绪化进食监测核心',
      field: 'portion',
      priority: 1,
      quickOptions: ['薯片半包', '饼干几块', '坚果一小把', '水果', '奶茶一杯'],
    })
    if (!/饿|压力|无聊|习惯|情绪|开心|难过/.test(t)) {
      extra.push({
        id: v4(),
        question: '是因为饿、压力还是习惯想吃？',
        reason: '加餐段：进食动机区分生理饥饿与情绪性进食',
        field: 'emotion',
        priority: 2,
        quickOptions: ['确实饿了', '压力大', '无聊习惯', '社交聚会', '就是想吃'],
      })
    }
  }

  if (mealSlot === 'unknown' && /吃了点|随便|凑合|不知道/.test(t)) {
    extra.push({
      id: v4(),
      question: '更接近哪一顿？主要吃了什么？',
      reason: '未标注餐次时先锚定进食场景，再拆解食物',
      field: 'timing',
      priority: 1,
      quickOptions: ['早餐', '午餐', '晚餐', '加餐'],
    })
  }

  return extra
}

const VAGUE = /一份|一碟|差不多|有点|吃了点/

/** 餐次 + 当日记录 衍生增强追问管线 */
export function enhanceFollowUpsForMeal(
  baseQuestions: FollowUpQuestion[],
  ctx: MealExtractContext,
  transcript: string,
): { questions: FollowUpQuestion[]; hint?: string } {
  const dayLogs = ctx.dayLogs ?? []
  const knownFacts = getKnownFactsFromDayLogs(dayLogs)
  const slot = ctx.mealSlot === 'unknown' ? inferMealSlotFromTranscript(transcript) ?? 'unknown' : ctx.mealSlot

  let questions = filterAlreadyKnownQuestions(baseQuestions, knownFacts)
  const slotExtras = buildMealSlotFollowUps(slot, transcript, knownFacts)
  for (const sq of slotExtras) {
    if (!questions.some((q) => q.field === sq.field && q.question.slice(0, 6) === sq.question.slice(0, 6))) {
      questions.push(sq)
    }
  }

  if (slot !== 'unknown' && dayLogs.length > 0) {
    const sameSlot = dayLogs.filter((l) => (l.mealSlot ?? 'unknown') === slot)
    if (sameSlot.length > 0) {
      const summary = sameSlot
        .map((l) => l.foods.map((f) => f.name).join('、') || l.transcript.slice(0, 24))
        .join('；')
      questions.unshift({
        id: v4(),
        question: `今日${SLOT_LABELS[slot]}已有记录（${summary}），本次是替换还是额外补充？`,
        reason: '同一餐次多条记录需确认，避免重复统计',
        field: 'timing',
        priority: 10,
        priorityLevel: 'P1',
        quickOptions: ['替换之前记录', '额外加一条', '是两顿分开的', '之前记错了'],
      })
    }
  }

  questions = questions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 4)

  const daySummary = buildDayDietSummary(dayLogs)
  let hint: string | undefined
  if (daySummary) {
    hint = `今日已记录：${daySummary}。以下追问仅针对本餐尚未明确的信息。`
  }
  if (slot !== 'unknown') {
    const slotHint = `当前按「${SLOT_LABELS[slot]}」场景优化追问。`
    hint = hint ? `${slotHint} ${hint}` : slotHint
  }

  return { questions, hint }
}

export function buildLlmMealContextBlock(ctx: MealExtractContext, transcript: string): string {
  const daySummary = buildDayDietSummary(ctx.dayLogs ?? [])
  const slot = ctx.mealSlot === 'unknown' ? inferMealSlotFromTranscript(transcript) : ctx.mealSlot
  const parts = [`记录日期：${ctx.recordDate}`]
  if (slot && slot !== 'unknown') parts.push(`餐次：${SLOT_LABELS[slot]}`)
  if (daySummary) parts.push(`当日已有饮食记录：${daySummary}`)
  parts.push('请结合餐次场景生成追问；当日已明确的信息勿重复追问。')
  return parts.join('\n')
}
