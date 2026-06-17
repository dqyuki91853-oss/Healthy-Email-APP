import type { SubFoodItem } from '../types/voice'

export type CompoundCategory =
  | 'noodle'
  | 'rice_bowl'
  | 'dumpling'
  | 'hotpot'
  | 'sandwich'
  | 'stir_fry'
  | 'salad'
  | 'soup'
  | 'bento'

export interface CompoundTemplate {
  category: CompoundCategory
  label: string
  pattern: RegExp
  defaultSubItems: SubFoodItem[]
  followUpFields: string[]
}

export const COMPOUND_TEMPLATES: CompoundTemplate[] = [
  {
    category: 'noodle',
    label: '面类',
    pattern: /面$|牛肉面|拉面|拌面|汤面|米线|米粉|酸辣粉|螺蛳粉|刀削|挂面/,
    defaultSubItems: [
      { name: '面条（熟）', amountG: 250, confidence: 'medium' },
      { name: '浇头肉类', amountG: 80, confidence: 'low' },
      { name: '蔬菜', amountG: 50, confidence: 'low' },
      { name: '汤底/酱料', amountG: 200, confidence: 'low' },
    ],
    followUpFields: ['碗大小', '牛肉量', '是否喝汤', '烹饪方式'],
  },
  {
    category: 'rice_bowl',
    label: '盖浇饭/炒饭',
    pattern: /盖饭|烩饭|炒饭|拌饭|焗饭|煲仔饭|.+饭$/,
    defaultSubItems: [
      { name: '米饭', amountG: 200, confidence: 'medium' },
      { name: '浇头/配料', amountG: 120, confidence: 'low' },
      { name: '酱汁/油', amountG: 15, confidence: 'low' },
    ],
    followUpFields: ['饭量', '浇头种类'],
  },
  {
    category: 'dumpling',
    label: '包子/饺子',
    pattern: /包子|饺子|馄饨|抄手|烧卖|小笼包|生煎/,
    defaultSubItems: [
      { name: '面皮', amountG: 40, confidence: 'medium' },
      { name: '馅料', amountG: 60, confidence: 'low' },
    ],
    followUpFields: ['馅料种类', '个数', '大小'],
  },
  {
    category: 'hotpot',
    label: '火锅',
    pattern: /火锅|涮肉|麻辣烫|串串|关东煮/,
    defaultSubItems: [
      { name: '锅底', amountG: 0, confidence: 'low' },
      { name: '涮品（肉/菜）', amountG: 300, confidence: 'low' },
      { name: '蘸料', amountG: 20, confidence: 'low' },
    ],
    followUpFields: ['锅底类型', '涮品', '蘸料', '饱腹程度'],
  },
  {
    category: 'sandwich',
    label: '三明治/汉堡',
    pattern: /三明治|汉堡|热狗|肉夹馍|卷饼/,
    defaultSubItems: [
      { name: '面包/饼皮', amountG: 80, confidence: 'medium' },
      { name: '肉类', amountG: 80, confidence: 'low' },
      { name: '蔬菜', amountG: 30, confidence: 'low' },
      { name: '酱料', amountG: 15, confidence: 'low' },
    ],
    followUpFields: ['肉类', '酱料'],
  },
  {
    category: 'stir_fry',
    label: '炒菜',
    pattern: /炒|烧|炖|焖/,
    defaultSubItems: [
      { name: '主料1', amountG: 100, confidence: 'low' },
      { name: '主料2/配菜', amountG: 80, confidence: 'low' },
      { name: '酱汁/油', amountG: 15, confidence: 'low' },
    ],
    followUpFields: ['烹饪方式', '用油量'],
  },
  {
    category: 'salad',
    label: '沙拉/轻食',
    pattern: /沙拉|轻食/,
    defaultSubItems: [
      { name: '基底蔬菜', amountG: 150, confidence: 'medium' },
      { name: '蛋白质', amountG: 80, confidence: 'low' },
      { name: '酱料', amountG: 20, confidence: 'low' },
    ],
    followUpFields: ['酱料类型'],
  },
  {
    category: 'soup',
    label: '汤羹/粥',
    pattern: /汤$|羹$|粥$/,
    defaultSubItems: [
      { name: '汤底', amountG: 250, confidence: 'low' },
      { name: '主料', amountG: 80, confidence: 'low' },
    ],
    followUpFields: ['喝了几碗', '是否肉汤'],
  },
  {
    category: 'bento',
    label: '便当/盒饭',
    pattern: /便当|盒饭|套餐/,
    defaultSubItems: [
      { name: '米饭', amountG: 180, confidence: 'medium' },
      { name: '配菜组合', amountG: 200, confidence: 'low' },
    ],
    followUpFields: ['主菜', '配菜'],
  },
]

export function matchCompoundTemplate(foodName: string, transcript: string): CompoundTemplate | undefined {
  const text = `${foodName} ${transcript}`
  return COMPOUND_TEMPLATES.find((t) => t.pattern.test(text))
}
