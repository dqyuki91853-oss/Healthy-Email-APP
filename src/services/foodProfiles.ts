import type { FoodCategory, FollowUpQuestion } from '../types/voice'
import { v4 } from '../engine/uuid'

export interface FoodProfile {
  category: FoodCategory
  label: string
  /** 笼统提及（触发探测） */
  genericPattern: RegExp
  /** 已足够具体（不触发 food_unspecified） */
  specificPattern: RegExp
  /** 复合菜特征 */
  compoundPattern?: RegExp
  detectDetail: string
  /** 该品类优先追问（最多取前 2 条合并展示） */
  followUps: [FollowUpQuestion, FollowUpQuestion?]
}

const sized = /[大中小](?:碗|杯|份|盘)|半份|一两|三两|\d+[个只块杯mlML]/

function q(
  question: string,
  reason: string,
  field: FollowUpQuestion['field'],
  quickOptions: string[],
  priority = 1,
): FollowUpQuestion {
  return { id: v4(), question, reason, field, priority, quickOptions }
}

export const FOOD_PROFILES: FoodProfile[] = [
  {
    category: 'noodle',
    label: '面食',
    genericPattern: /吃了?(?:碗|盘)?面(?!条|包|筋|片)|吃了?面条?$|(?:早|午|晚|中)餐.*吃了?面/,
    specificPattern: /拉面|刀削|米粉|米线|泡面|意面|乌冬|荞麦|手擀面|挂面|刀切面|重庆小面|热干面|牛肉面|炸酱面|兰州/,
    compoundPattern: /红烧牛肉|炸酱|兰州拉面|重庆小面|热干面/,
    detectDetail: '仅说"吃了面/碗面"，未指明面种与份量',
    followUps: [
      q('是什么面？大概多大碗？', '面食需明确种类（拉面/米粉/刀削等）与份量才能估算碳水钠', 'portion', ['拉面-小碗', '拉面-大碗', '刀削面', '米粉', '泡面']),
      q('里面有肉吗？汤喝了吗？', '面类常伴随汤底与肉类，影响嘌呤和钠摄入', 'components', ['有肉，汤全喝', '有肉，没喝汤', '没肉', '素食']),
    ],
  },
  {
    category: 'rice',
    label: '米饭/主食饭',
    genericPattern: /吃了?(?:碗|盘)?饭$|吃了?米饭?$|就吃了?饭/,
    specificPattern: /盖饭|炒饭|煲仔饭|蛋炒饭|扬州炒饭|黄焖鸡米饭|鸡腿饭|牛腩饭|卤肉饭|拌饭|寿司饭|杂粮饭|糙米饭|二分饭|一两饭/,
    detectDetail: '仅说"吃饭"未描述菜品构成与饭量',
    followUps: [
      q('吃的什么菜？搭配什么肉/菜？', '白饭本身信息不足，配菜决定嘌呤、纤维与升糖负荷', 'components', ['一荤一素', '盖饭', '炒饭', '只有青菜', '红烧肉饭']),
      q('大概多少饭？（小碗/中碗/大盘）', '饭量直接影响升糖负荷与热量盈余判断', 'portion', ['小碗', '中碗', '大碗', '半份', '一两饭']),
    ],
  },
  {
    category: 'congee',
    label: '粥类',
    genericPattern: /喝了?粥|吃了?粥|一碗粥/,
    specificPattern: /皮蛋瘦肉粥|海鲜粥|白粥|小米粥|南瓜粥|八宝粥|生滚|及第粥/,
    detectDetail: '未指明粥的种类与配料',
    followUps: [
      q('什么粥？（白粥/皮蛋瘦肉/海鲜粥等）', '粥类配料差异大，海鲜粥嘌呤显著高于白粥', 'components', ['白粥', '皮蛋瘦肉粥', '海鲜粥', '小米粥', '八宝粥']),
      q('大概多大碗？有配咸菜/油条吗？', '配菜影响钠与精制碳水摄入', 'portion', ['小碗', '中碗', '大碗', '配油条', '配咸菜']),
    ],
  },
  {
    category: 'dim_sum',
    label: '饺子/馄饨/云吞',
    genericPattern: /吃了?(?:饺子|水饺|馄饨|云吞|抄手)/,
    specificPattern: /韭菜|猪肉|三鲜|虾仁|牛肉|白菜|玉米|蒸饺|锅贴|\d+个/,
    detectDetail: '未说明馅料种类与数量',
    followUps: [
      q('什么馅？大概多少个？', '馅料决定嘌呤（海鲜/猪肉）与分量', 'components', ['猪肉馅-10个', '韭菜馅-15个', '三鲜馅-12个', '虾仁馅-8个']),
      q('是水煮、蒸还是煎的？', '烹饪方式影响油脂摄入', 'cooking', ['水煮', '蒸', '煎/锅贴', '炸']),
    ],
  },
  {
    category: 'bread_pastry',
    label: '包子/馒头/饼类',
    genericPattern: /吃了?(?:包子|馒头|花卷|烧饼|煎饼|手抓饼|肉夹馍|锅盔)/,
    specificPattern: /猪肉|牛肉|青菜|豆沙|奶黄|三丁|叉烧|菜包|肉包|\d+个/,
    detectDetail: '未说明馅料/夹料与数量',
    followUps: [
      q('什么馅/夹了什么？大概几个？', '肉包与菜包营养差异大，数量影响总量', 'components', ['猪肉包-2个', '菜包-2个', '肉夹馍-1个', '馒头-1个', '手抓饼加蛋']),
      q('是蒸、煎还是烤的？', '油脂含量因烹饪方式差异显著', 'cooking', ['蒸', '煎', '烤', '油炸']),
    ],
  },
  {
    category: 'meat',
    label: '肉类菜品',
    genericPattern: /吃了?(?:点)?肉|点了?肉|吃了?排骨|吃了?鸡(?!蛋)|吃了?猪/,
    specificPattern: /红烧|清炒|炖|烤|炸|蒸|牛肉|猪肉|鸡肉|鸡腿|鸡翅|牛腩|排骨|里脊|回锅|宫保/,
    detectDetail: '肉类未说明部位、烹饪方式与份量',
    followUps: [
      q('什么肉？怎么做的？', '部位与烹饪决定嘌呤、饱和脂肪与血红素铁', 'cooking', ['红烧猪肉', '清炒鸡肉', '炖排骨', '烤鸡翅', '炸鸡']),
      q('大概多少？（一两/一份/半份）', '肉类份量是嘌呤与铁摄入的关键变量', 'portion', ['一两', '二两', '小份', '一份', '半份']),
    ],
  },
  {
    category: 'seafood',
    label: '海鲜',
    genericPattern: /吃了?(?:点)?海鲜|吃了?虾|吃了?蟹|吃了?贝|吃了?鱼(?!香)/,
    specificPattern: /清蒸|红烧|烤|煎|炸|三文鱼|带鱼|鲈鱼|虾仁|生蚝|扇贝|花甲|小龙虾|\d+/,
    detectDetail: '海鲜未指明种类、做法与份量（嘌呤差异极大）',
    followUps: [
      q('具体什么海鲜？怎么做的？', '贝类/虾蟹/鱼类嘌呤差异显著', 'cooking', ['清蒸鱼', '红烧虾', '烤生蚝', '炸带鱼', '白灼虾']),
      q('大概多少？', '海鲜份量直接影响嘌呤摄入评估', 'portion', ['小份', '一份', '半斤', '几只虾', '一条鱼']),
    ],
  },
  {
    category: 'vegetable',
    label: '蔬菜',
    genericPattern: /吃了?(?:点)?(?:青菜|蔬菜|素菜|绿叶菜)/,
    specificPattern: /油菜|小白菜|上海青|菠菜|生菜|白菜|空心菜|西兰花|芹菜|黄瓜|番茄|木耳|香菇|凉拌|清炒/,
    detectDetail: '「青菜/蔬菜」品种不明，中国食物成分表匹配有歧义',
    followUps: [
      q('具体什么蔬菜？', '品种影响纤维、叶酸与铁吸收模式', 'db_match', ['上海青', '小白菜', '油菜', '菠菜', '西兰花', '生菜']),
      q('怎么做的？（清炒/凉拌/水煮）', '烹饪方式决定油脂添加量', 'cooking', ['清炒', '凉拌', '水煮', '蒸', '油炸']),
    ],
  },
  {
    category: 'soup',
    label: '汤/煲/炖品',
    genericPattern: /喝了?汤|吃了?汤|煲|炖(?!肉)/,
    specificPattern: /排骨汤|鸡汤|鱼汤|番茄蛋汤|紫菜汤|冬瓜汤|莲藕|老火|盅|碗|没喝|全喝|一半/,
    detectDetail: '汤品未指明种类与饮用量（钠与嘌呤关键来源）',
    followUps: [
      q('什么汤？', '肉汤与非肉汤营养差异大', 'components', ['排骨汤', '鸡汤', '番茄蛋汤', '蔬菜汤', '鱼汤']),
      q('喝了多少？（全喝/一半/没喝）', '汤底摄入是钠和嘌呤的重要来源', 'components', ['全喝了', '喝了一半', '没喝汤', '只吃了料']),
    ],
  },
  {
    category: 'stir_fry',
    label: '炒菜',
    genericPattern: /炒了?(?:个)?菜|吃了?炒菜|点了?菜(?!谱)/,
    specificPattern: /宫保|鱼香|麻婆|回锅|青椒|土豆丝|番茄炒蛋|蒜蓉|清炒|地三鲜|干煸/,
    detectDetail: '仅说"炒菜"未指明菜名与做法',
    followUps: [
      q('炒的是什么菜？', '菜名决定主要食材与嘌呤/升糖特征', 'components', ['番茄炒蛋', '青椒肉丝', '麻婆豆腐', '清炒时蔬', '土豆丝']),
      q('油多吗？配米饭了吗？', '油脂与主食搭配影响代谢负荷', 'portion', ['油不多', '比较油', '配一碗饭', '配半碗饭', '没配饭']),
    ],
  },
  {
    category: 'hotpot',
    label: '火锅/麻辣烫',
    genericPattern: /火锅|麻辣烫|涮|串串/,
    specificPattern: /牛油|清汤|番茄锅|菌汤|肥牛|羊肉卷|虾滑|毛肚|蘸料|辣|不辣/,
    compoundPattern: /火锅|麻辣烫|串串/,
    detectDetail: '火锅类需拆解锅底、涮品、蘸料与汤底摄入',
    followUps: [
      q('什么锅底？主要涮了什么肉？', '锅底与肉类决定嘌呤、钠与饱和脂肪', 'components', ['清汤-肥牛', '麻辣-羊肉', '番茄锅-海鲜', '素食锅底']),
      q('喝汤了吗？蘸料辣吗？', '火锅汤底嘌呤浓度高，辣油蘸料增加钠脂', 'components', ['汤喝了', '没喝汤', '辣蘸料', '麻酱蘸料']),
    ],
  },
  {
    category: 'beverage',
    label: '饮料',
    genericPattern: /喝了?(?:点|些)?(?:饮料|饮品|东西)|来了一?杯/,
    specificPattern: /可乐|雪碧|汽水|果汁|矿泉水|苏打|无糖|纤维饮料|\d+ml|大杯|中杯|小杯/,
    detectDetail: '饮料种类与杯量不明，无法判断果糖摄入',
    followUps: [
      q('喝的什么？多大杯？', '含糖饮料是果糖与痛风/NAFLD 的重要来源', 'portion', ['可乐-中杯', '可乐-大杯', '无糖可乐', '果汁-一杯', '矿泉水']),
      q('甜度？（全糖/半糖/无糖）', '甜度决定果糖负荷', 'components', ['全糖', '半糖', '少糖', '无糖']),
    ],
  },
  {
    category: 'milk_tea',
    label: '奶茶',
    genericPattern: /奶茶|果茶|柠檬茶/,
    specificPattern: /喜茶|奈雪|霸王茶姬|蜜雪|瑞幸|星巴克|三分糖|五分糖|七分糖|无糖|少冰|去冰|大杯|中杯/,
    detectDetail: '奶茶品牌、甜度与杯量不明',
    followUps: [
      q('什么奶茶/果茶？甜度？', '液态糖是果糖与 NAFLD 风险的核心来源', 'components', ['珍珠奶茶-全糖', '果茶-半糖', '无糖茶', '三分糖']),
      q('多大杯？', '杯量决定果糖总量', 'portion', ['中杯', '大杯', '超大杯', '小杯']),
    ],
  },
  {
    category: 'alcohol',
    label: '酒精',
    genericPattern: /喝了?(?:点|些)?酒|啤酒|白酒|红酒|黄酒|威士忌|鸡尾酒/,
    specificPattern: /一瓶|一杯|一两|二两|罐|毫升|ml|半杯|\d+/,
    detectDetail: '酒类品种与饮用量不明（影响尿酸与情绪）',
    followUps: [
      q('什么酒？大概多少？', '啤酒嘌呤高，白酒热量高，量决定风险', 'portion', ['啤酒1瓶', '啤酒2罐', '白酒一两', '红酒一杯', '没喝多少']),
      q('是佐餐还是空腹喝的？', '空腹饮酒影响血糖波动与情绪稳定性', 'timing', ['佐餐', '空腹', '睡前', '聚会']),
    ],
  },
  {
    category: 'fruit',
    label: '水果',
    genericPattern: /吃了?(?:点)?水果|吃了?(?:一个|些)?苹果|香蕉|橙|葡萄|西瓜|草莓/,
    specificPattern: /一个|半个|\d+个|一斤|半斤|切块|盒装/,
    detectDetail: '水果种类与数量不明（果糖摄入）',
    followUps: [
      q('什么水果？大概多少？', '不同水果果糖含量差异大（葡萄/芒果 vs 莓类）', 'portion', ['苹果1个', '香蕉1根', '葡萄一小串', '西瓜几块', '橙1个']),
      q('是餐前还是餐后吃的？', '时机影响血糖波动模式', 'timing', ['餐前', '餐后', '加餐', '代替正餐']),
    ],
  },
  {
    category: 'snack',
    label: '零食',
    genericPattern: /吃了?(?:点)?零食|宵夜|薯片|饼干|巧克力|坚果|糕点/,
    specificPattern: /一包|半包|几块|几颗|小袋|大袋|\d+/,
    detectDetail: '零食种类与份量不明',
    followUps: [
      q('什么零食？大概多少？', '零食是情绪化进食与添加糖的重要信号', 'portion', ['薯片半包', '饼干几块', '巧克力一条', '坚果一小把', '没吃多少']),
      q('是正餐还是加餐/宵夜？', '时机反映饮食节律与情绪性进食', 'timing', ['正餐', '下午茶', '宵夜', '饿的时候垫肚子']),
    ],
  },
  {
    category: 'dessert',
    label: '甜点',
    genericPattern: /蛋糕|甜点|甜品|布丁|冰淇淋|雪糕|蛋挞|甜甜圈/,
    specificPattern: /一块|一角|一球|杯|个|\d+/,
    detectDetail: '甜点种类与份量不明（添加糖与果糖）',
    followUps: [
      q('什么甜点？大概多大份？', '甜点添加糖是代谢风险的关键来源', 'portion', ['蛋糕一角', '蛋糕一块', '冰淇淋一球', '蛋挞2个', '小份甜品']),
      q('是餐中还是餐后？', '与正餐叠加的升糖负荷', 'timing', ['当正餐', '餐后', '下午茶', '宵夜']),
    ],
  },
  {
    category: 'takeaway',
    label: '外卖/外食',
    genericPattern: /外卖|外食|外面吃|堂食|叫了个|点了个外卖/,
    specificPattern: /麦当劳|肯德基|美团|饿了么|沙县|黄焖鸡|麻辣烫|拉面|寿司|披萨|汉堡|套餐/,
    detectDetail: '外卖/外食未说明具体菜品',
    followUps: [
      q('点的什么？主菜是什么？', '外食钠、油、嘌呤普遍偏高，需明确菜品', 'components', ['黄焖鸡米饭', '麻辣烫', '汉堡套餐', '寿司', '炒菜盒饭']),
      q('大概多大份？汤/饮料配了吗？', '套餐配菜与饮料常被忽略但影响总量', 'portion', ['标准份', '大份', '配可乐', '配汤', '只要主菜']),
    ],
  },
  {
    category: 'generic',
    label: '笼统进食',
    genericPattern: /吃了?(?:点|些)?东西|随便吃了|凑合吃了|垫了下肚子|没吃好/,
    specificPattern: /.{8,}/,
    detectDetail: '整体描述过于笼统，无法识别任何食物条目',
    followUps: [
      q('主要吃了什么？（主食+主菜）', '需至少识别主食与主菜才能做模式分析', 'components', ['面', '饭', '饺子', '外卖', '零食', '水果']),
      q('大概多大份？在哪吃的？', '份量与场景（外卖/食堂/家里）影响估算', 'portion', ['小份', '正常一份', '比较多', '外卖', '食堂', '家里']),
    ],
  },
]

export const COMPOUND_DISH_PATTERN =
  /红烧|牛腩|炸酱|兰州拉面|麻辣烫|火锅|盖饭|炒饭|炒面|煲仔饭|黄焖鸡|麻辣香锅|回锅|宫保|鱼香|麻婆|地三鲜|水煮|干锅|卤味|烧烤|串串/

export const VAGUE_PORTION_PATTERN = /一份|一碟|一碗|差不多|有点|吃了点|挺多|不少|正常|普通|标准|大概|约/
export const COOKING_METHOD_PATTERN = /蒸|煮|炒|炸|烤|红烧|凉拌|炖|煎|卤|白灼|水煮|干煸/
export const COOKING_SENSITIVE_PATTERN = /土豆|马铃薯|茄子|红薯|山药|豆腐|鸡肉|猪肉|鱼|虾|排骨|藕|南瓜/
export const PROTEIN_PATTERN = /牛肉|鸡肉|猪肉|排骨|鱼|虾|蟹|肉|蛋|豆腐|内脏|猪肝|羊肉/
export const SOUP_CONSUMED_PATTERN = /汤喝|喝汤|汤全|没喝汤|汤没|全喝|喝了一半/

export function hasSizedPortion(text: string): boolean {
  return sized.test(text)
}

export function matchFoodProfile(text: string): FoodProfile | undefined {
  for (const profile of FOOD_PROFILES) {
    if (profile.genericPattern.test(text) && !profile.specificPattern.test(text)) {
      return profile
    }
  }
  return undefined
}

export function matchCompoundInText(text: string): string[] {
  const matches = text.match(new RegExp(COMPOUND_DISH_PATTERN.source, 'g'))
  return matches ? [...new Set(matches)] : []
}

export function getProfileFollowUps(category: FoodCategory): FollowUpQuestion[] {
  const profile = FOOD_PROFILES.find((p) => p.category === category)
  return profile ? profile.followUps.filter(Boolean) as FollowUpQuestion[] : []
}
