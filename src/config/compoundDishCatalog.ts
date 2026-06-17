import type { FollowUpQuestion, PortionOption, SubFoodItem } from '../types/voice'
import { v4 } from '../engine/uuid'

/** 复合菜可选子项分组 — 对齐常见中式外食/食堂场景 */
export interface CompoundPickGroup {
  label: string
  items: SubFoodItem[]
}

export interface CompoundDishCatalogEntry {
  id: string
  label: string
  patterns: RegExp[]
  pickGroups: CompoundPickGroup[]
  /** 复合菜专属第二问（锅底/汤/蘸料等），避免与拆解重复 */
  secondaryQuestion?: Omit<FollowUpQuestion, 'id'>
  /** 复合菜份量：按选品数量/饱腹感，而非小中大碗 */
  portionQuestion?: {
    question: string
    reason: string
    options: PortionOption[]
  }
}

function item(name: string, amountG: number, confidence: SubFoodItem['confidence'] = 'low'): SubFoodItem {
  return { name, amountG, confidence }
}

export const COMPOUND_DISH_CATALOG: CompoundDishCatalogEntry[] = [
  {
    id: 'malatang',
    label: '麻辣烫/关东煮/串串',
    patterns: [/麻辣烫/, /关东煮/, /串串香/, /串串$/],
    pickGroups: [
      {
        label: '锅底/汤底',
        items: [
          item('清汤', 300, 'medium'),
          item('番茄汤', 300, 'medium'),
          item('菌汤', 300, 'medium'),
          item('麻辣红汤', 300, 'medium'),
          item('骨汤', 300, 'medium'),
        ],
      },
      {
        label: '肉类/内脏',
        items: [
          item('牛肉卷', 80),
          item('午餐肉', 60),
          item('鸭血', 50),
          item('毛肚', 50),
          item('黄喉', 40),
          item('培根', 40),
        ],
      },
      {
        label: '丸滑/豆制品',
        items: [
          item('牛肉丸', 40),
          item('鱼豆腐', 40),
          item('撒尿牛丸', 40),
          item('千张/豆皮', 50),
          item('冻豆腐', 50),
          item('响铃卷', 30),
        ],
      },
      {
        label: '蔬菜',
        items: [
          item('生菜', 50),
          item('娃娃菜', 60),
          item('金针菇', 40),
          item('土豆片', 60),
          item('藕片', 50),
          item('菠菜', 40),
          item('油麦菜', 50),
        ],
      },
      {
        label: '主食/粉面',
        items: [
          item('粉丝', 80),
          item('宽粉', 80),
          item('方便面', 100),
          item('油条', 40),
          item('玉米段', 80),
        ],
      },
    ],
    secondaryQuestion: {
      question: '汤底喝了多少？蘸料用了什么？',
      reason: '麻辣烫的钠、嘌呤主要来自汤底与麻酱/香油蘸料',
      field: 'soup',
      priority: 8,
      priorityLevel: 'P2',
      followUpType: 'detail',
      quickOptions: ['汤全喝', '汤喝一半', '几乎没喝汤', '麻酱蘸料', '香油+小米辣', '无蘸料'],
    },
    portionQuestion: {
      question: '大概选了多少样涮品？吃到几成饱？',
      reason: '麻辣烫份量取决于选品数量与饱腹感，比「小中大碗」更准确',
      options: [
        { label: '5样以内 · 小饥', value: 'light_5', emoji: '🥢' },
        { label: '6–10样 · 七八分饱', value: 'medium_10', emoji: '🍲' },
        { label: '11–15样 · 很饱', value: 'heavy_15', emoji: '🍲🍲' },
        { label: '15样以上 · 吃撑', value: 'stuffed_15+', emoji: '🍲🍲🍲' },
      ],
    },
  },
  {
    id: 'hotpot',
    label: '火锅/涮肉',
    patterns: [/火锅/, /涮肉/, /铜锅/, /潮汕牛肉火锅/],
    pickGroups: [
      {
        label: '锅底',
        items: [
          item('清汤', 400, 'medium'),
          item('番茄', 400, 'medium'),
          item('菌汤', 400, 'medium'),
          item('麻辣', 400, 'medium'),
          item('鸳鸯锅', 400, 'medium'),
        ],
      },
      {
        label: '肉类',
        items: [
          item('肥牛', 100),
          item('羊肉卷', 100),
          item('毛肚', 80),
          item('虾滑', 80),
          item('午餐肉', 60),
          item('鸭血', 50),
        ],
      },
      {
        label: '海鲜',
        items: [item('虾', 80), item('贝类', 80), item('鱼片', 80), item('鱿鱼', 60)],
      },
      {
        label: '蔬菜/菌菇',
        items: [
          item('娃娃菜', 80),
          item('金针菇', 60),
          item('土豆', 80),
          item('藕片', 60),
          item('豆腐', 80),
          item('宽粉', 80),
        ],
      },
    ],
    secondaryQuestion: {
      question: '蘸料怎么调的？油碟还是麻酱？',
      reason: '火锅蘸料的油脂与钠往往被低估',
      field: 'components',
      priority: 7,
      priorityLevel: 'P2',
      followUpType: 'detail',
      quickOptions: ['香油蒜泥', '麻酱', '酱油醋', '干碟', '多种混合'],
    },
    portionQuestion: {
      question: '大概涮了多少盘肉/多少样菜？',
      reason: '火锅热量与嘌呤与涮品总量强相关',
      options: [
        { label: '1–2盘肉 · 偏素', value: 'light', emoji: '🥬' },
        { label: '3–4盘肉 · 正常', value: 'normal', emoji: '🥩' },
        { label: '5盘以上 · 肉为主', value: 'heavy', emoji: '🥩🥩' },
        { label: '主要吃菜/豆制品', value: 'veg_focus', emoji: '🥬🥬' },
      ],
    },
  },
  {
    id: 'noodle',
    label: '面类',
    patterns: [/面$|牛肉面|拉面|拌面|汤面|米线|米粉|酸辣粉|螺蛳粉|刀削|重庆小面|热干面|炸酱面/],
    pickGroups: [
      {
        label: '面种',
        items: [
          item('拉面', 250, 'medium'),
          item('刀削面', 250, 'medium'),
          item('米粉/米线', 250, 'medium'),
          item('挂面/细面', 200, 'medium'),
          item('泡面', 200, 'medium'),
        ],
      },
      {
        label: '浇头/配料',
        items: [
          item('牛肉', 80),
          item('排骨', 80),
          item('鸡蛋', 50),
          item('午餐肉', 50),
          item('蔬菜', 50),
          item('无肉/纯素', 0, 'medium'),
        ],
      },
    ],
    secondaryQuestion: {
      question: '汤底/面汤喝了多少？',
      reason: '面汤是钠与嘌呤的重要来源',
      field: 'soup',
      priority: 7,
      priorityLevel: 'P2',
      followUpType: 'detail',
      quickOptions: ['全喝', '喝一半', '几乎没喝', '拌面无汤'],
    },
    portionQuestion: {
      question: '面碗大概多大？',
      reason: '面类碳水与钠估算依赖碗型',
      options: [
        { label: '小碗（约200g面）', value: 'small', emoji: '🥣', approxGrams: 200 },
        { label: '中碗（约300g面）', value: 'medium', emoji: '🍜', approxGrams: 300 },
        { label: '大碗（约400g+）', value: 'large', emoji: '🍜🍜', approxGrams: 400 },
      ],
    },
  },
  {
    id: 'rice_bowl',
    label: '盖浇饭/炒饭',
    patterns: [/盖饭|烩饭|炒饭|拌饭|煲仔饭|.+饭$/],
    pickGroups: [
      {
        label: '主食',
        items: [
          item('白米饭', 200, 'medium'),
          item('杂粮饭', 180, 'medium'),
          item('炒饭', 350, 'medium'),
        ],
      },
      {
        label: '主菜/浇头',
        items: [
          item('鸡肉', 100),
          item('猪肉/排骨', 100),
          item('牛肉', 100),
          item('鱼/虾', 80),
          item('鸡蛋', 50),
          item('纯素浇头', 80, 'medium'),
        ],
      },
      {
        label: '配菜',
        items: [item('时蔬', 80), item('腌菜/咸菜', 20), item('卤蛋', 50), item('无配菜', 0, 'medium')],
      },
    ],
    portionQuestion: {
      question: '饭量大概多少？',
      reason: '盖饭升糖负荷与饭量直接相关',
      options: [
        { label: '小份/半份饭', value: 'small', emoji: '🍚', approxGrams: 120 },
        { label: '正常一份', value: 'medium', emoji: '✊', approxGrams: 200 },
        { label: '大份/加饭', value: 'large', emoji: '🍚🍚', approxGrams: 300 },
      ],
    },
  },
  {
    id: 'dumpling',
    label: '饺子/馄饨/包子',
    patterns: [/包子|饺子|馄饨|抄手|烧卖|小笼包|生煎/],
    pickGroups: [
      {
        label: '品种',
        items: [
          item('猪肉馅', 60, 'medium'),
          item('韭菜馅', 60, 'medium'),
          item('三鲜/虾仁', 60, 'medium'),
          item('牛肉馅', 60, 'medium'),
          item('素馅', 60, 'medium'),
        ],
      },
      {
        label: '数量（约）',
        items: [
          item('5个以内', 0, 'medium'),
          item('6–10个', 0, 'medium'),
          item('11–15个', 0, 'medium'),
          item('15个以上', 0, 'medium'),
        ],
      },
    ],
    secondaryQuestion: {
      question: '怎么做的？有配蘸料吗？',
      reason: '煎/炸比水煮油脂高很多',
      field: 'cooking',
      priority: 6,
      priorityLevel: 'P3',
      followUpType: 'detail',
      quickOptions: ['水煮/蒸', '煎/锅贴', '炸', '配醋/辣椒油', '无蘸料'],
    },
  },
  {
    id: 'bento',
    label: '便当/盒饭/外卖套餐',
    patterns: [/便当|盒饭|套餐|黄焖鸡|盖浇/],
    pickGroups: [
      {
        label: '主菜',
        items: [
          item('炸鸡/炸物', 120),
          item('红烧/炖煮肉类', 100),
          item('炒菜', 100),
          item('麻辣烫/冒菜', 200),
          item('轻食沙拉', 150, 'medium'),
        ],
      },
      {
        label: '主食',
        items: [item('米饭', 200, 'medium'), item('面条', 250, 'medium'), item('馒头/饼', 100, 'medium')],
      },
      {
        label: '配菜/汤',
        items: [item('蔬菜', 80), item('咸菜/腌菜', 20), item('例汤', 150), item('饮料', 300)],
      },
    ],
    portionQuestion: {
      question: '这份外卖/盒饭整体份量？',
      reason: '外食套餐整体份量差异大',
      options: [
        { label: '小份/半份', value: 'small', emoji: '🥡' },
        { label: '标准一份', value: 'medium', emoji: '🥡🥡' },
        { label: '大份/加量', value: 'large', emoji: '🥡🥡🥡' },
      ],
    },
  },
]

export function matchCompoundCatalog(foodName: string, transcript: string): CompoundDishCatalogEntry | undefined {
  const text = `${foodName} ${transcript}`
  return COMPOUND_DISH_CATALOG.find((entry) => entry.patterns.some((p) => p.test(text)))
}

export function catalogToFlatSubItems(entry: CompoundDishCatalogEntry): SubFoodItem[] {
  return entry.pickGroups.flatMap((g) => g.items)
}

export function buildCatalogDecomposeQuestion(
  foodName: string,
  entry: CompoundDishCatalogEntry,
  priority: number,
  priorityLevel: FollowUpQuestion['priorityLevel'],
): FollowUpQuestion {
  return {
    id: v4(),
    question: `「${foodName}」里实际选了哪些？按分类勾选（可多选）`,
    reason: `${entry.label}需拆解具体选品，才能估算嘌呤、钠与升糖负荷`,
    field: 'components',
    priority,
    priorityLevel,
    followUpType: 'decompose',
    targetFood: foodName,
    compoundSubItems: catalogToFlatSubItems(entry),
    compoundPickGroups: entry.pickGroups,
    compoundCategory: entry.id,
    multiSelect: true,
    quickOptions: entry.pickGroups.map((g) => g.label),
  }
}

export function buildCatalogPortionQuestion(
  foodName: string,
  entry: CompoundDishCatalogEntry,
  priority: number,
  priorityLevel: FollowUpQuestion['priorityLevel'],
): FollowUpQuestion | null {
  if (!entry.portionQuestion) return null
  const { question, reason, options } = entry.portionQuestion
  return {
    id: v4(),
    question: `「${foodName}」${question}`,
    reason,
    field: 'portion',
    priority,
    priorityLevel,
    followUpType: 'portion',
    targetFood: foodName,
    portionOptions: options,
    quickOptions: options.map((o) => o.label),
  }
}

export function buildCatalogSecondaryQuestion(
  foodName: string,
  entry: CompoundDishCatalogEntry,
): FollowUpQuestion | null {
  if (!entry.secondaryQuestion) return null
  return {
    ...entry.secondaryQuestion,
    id: v4(),
    targetFood: foodName,
    question: entry.secondaryQuestion.question,
  }
}
