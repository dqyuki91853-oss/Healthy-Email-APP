# 功能改进方案 — 天气 / 追问 / 来信

> **读者**：Claude Code  
> **项目**：`CC project/subhealth-monitor`  
> **路线图**：[CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md) Phase 1、Phase 3  
> **前置**：`DESIGN_OVERHAUL_V2.md`、`WELLNESS_RESEARCH_AND_DESIGN.md`

---

## 0. 总览

| # | 改进项 | 用户痛点 | 当前状态 | 优先级 |
|---|--------|----------|----------|--------|
| 1 | 身体天气视觉与动画 | 天气区偏静态、不够「私人天气图」感 | 已有 `BodyWeatherScene` SVG + 基础动画，装饰 opacity 20% | P1 |
| 2 | 饮食追问更智能、不重复 | 同一天/跨餐次仍重复问面种、分量等 | 有部分 dedup（`previousQuestionKeys`、当日 `knownFacts`），缺口明显 | P0 |
| 3 | 来信不自动刷新 | 切页回首页又 loading/重生成 | `WeeklyLetter` 仅依赖 `regenerationKey`，但**缓存未写入**、store 仍自动 bump version | P0 |

**建议实施顺序**：3 → 2 → 1（先修数据/行为 bug，再做体验增强）。

---

## 1. 改进一：身体天气 — 更丰富的视觉与动画

### 1.1 现状

| 文件 | 已有能力 |
|------|----------|
| `BodyWeatherCard.tsx` | 左 Stamp + 文案；背景 `BodyWeatherScene decorative opacity-20` |
| `BodyWeatherScene.tsx` | 6 种天气 SVG；晴/云/雨/雾/彩虹动画；`prefers-reduced-motion` |
| `WeatherStamp.tsx` | 静态印章 |

**不足**：
- 装饰层 opacity 0.2，用户几乎看不清动画
- 卡片高度随内容，场景被压扁
- Hero / Modal 未联动天气氛围
- 无「首次进入今日天气」轻量动效

### 1.2 设计目标

用户第一眼感受：**「今天我的身体是一幅会呼吸的小天气」**，仍不展示 HRV 等数值。

### 1.3 UI 方案（推荐：方案 A，见 §1.6 可选方案）

#### 1.3.1 BodyWeatherCard 2.0

```
┌─ BodyWeatherCard（min-height 160px）────────────────────────────┐
│  [BodyWeatherScene 全宽背景层 opacity 35–45%，非 decorative 矮条] │
│  ┌─ 前景 content z-10 ─────────────────────────────────────────┐ │
│  │ [WeatherStamp]  今日身体天气                                 │ │
│  │                 今天你的身体是{label}                        │ │
│  │                 {metaphor} 14px                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

- `min-height: 160px`；场景 `absolute inset-0`，前景 `relative z-10`
- 背景场景 opacity：**0.38**（可配置 CSS 变量 `--weather-scene-opacity`）
- 卡片底部 optional：**极淡地平线** gradient（`linear-gradient` 透明 → cream）

#### 1.3.2 EnvelopeStage 天气联动

- 当 `wellness.bodyWeather.weatherId === 'rainy'`：`EnvelopeStage` 渐变偏冷灰蓝 tint
- `sunny` / `rainbow`：偏 gold/teal tint
- 仅 **CSS 变量切换**，不改布局

#### 1.3.3 NewLetterModal

- 背景 `BodyWeatherScene` 全屏 blur 层（opacity 15%）
- 邮票 `WeatherStamp` 入场：`scale 0.8→1` + `rotate -12→-8`（300ms）

#### 1.3.4 动画增强清单

| weatherId | 新增/强化 |
|-----------|-----------|
| sunny | 光晕 pulse 已有；加 **1–2 个慢速粒子**（CSS circle opacity fade） |
| partly_cloudy | 云 drift 已有；太阳 **peek animation** 偶发被云遮住 |
| rainy | 5 层雨已有；加 **地面细线涟漪**（SVG path opacity pulse） |
| foggy | 多层雾已有；加 **整体 scene 慢速 vertical drift** |
| rainbow | 弧 fade 已有；加 **双弧 shimmer**（stroke-dashoffset） |
| overcast | 目前静态；加 **极慢 cloud drift**（与 partly 类似，更 muted） |

**无障碍**：所有新动画包在 `@media (prefers-reduced-motion: reduce)` 内 disable。

#### 1.3.5 可选：独立「天气详情」轻页（Phase 2）

- 点击 BodyWeatherCard → 全屏 overlay（非新路由）
- 大号 `BodyWeatherScene` h-64 + 一句 letterOpener + 关闭按钮
- **仍无数值**

### 1.4 工程任务

| 任务 | 文件 |
|------|------|
| 重构卡片布局 | `BodyWeatherCard.tsx` |
| 增强 SVG/动画 | `BodyWeatherScene.tsx` |
| Hero tint | `EnvelopeStage.tsx` + `index.css` 变量 |
| Modal 氛围 | `NewLetterModal.tsx` |
| 可选 overlay | 新建 `BodyWeatherOverlay.tsx` |

### 1.5 验收

- [ ] 六种天气动画在卡片上**肉眼可辨**（非 reduced-motion）
- [ ] 切换日期/刷新 wellness 时天气 **crossfade** 仍流畅
- [ ] 仍无 HRV/RHR 数字
- [ ] Lighthouse / 性能：SVG 单卡片 CPU 可接受（避免 >100 同时动画 DOM）

### 1.6 已确认：方案 A1

卡片内 medium 场景（opacity ~38%）+ Hero 色调联动；不做 A2 极简 / A3 全屏（A3 overlay 降为 P2 可选）。

---

## 2. 改进二：饮食追问 — 更智能、不重复提问

### 2.1 现状与问题根因

| 机制 | 位置 | 作用 | 缺口 |
|------|------|------|------|
| `previousQuestionKeys` | `VoiceRecorder` 追问提交后 | 同一条录音**第二轮** dedup | 未持久化；新开一条录音丢失 |
| `getKnownFactsFromDayLogs` | `mealContext.ts` | 当日已有记录 → 过滤问句 regex | 事实集粗糙；仅部分 pattern |
| `shouldSkipPortionFollowUp` | `dietHistory.ts` | 同食物名 ≥3 次跳过分量 | **精确匹配** foodName；「牛肉面」≠「红烧牛肉面」 |
| `filterAlreadyKnownQuestions` | `mealContext.ts` | 过滤 LLM/决策层问题 | 未覆盖 decision 层 gap.field dedup |
| LLM followUp | `llm.ts` | 可能重复生成相似题 | prompt 有去重提示但无结构化 memory |

**典型重复场景**：
1. 午餐记录了「牛肉面」，晚餐又说「面」→ 再问「什么面？」
2. 追问一轮后用户跳过，下次录同类食物仍问
3. 当日已有 `dayLogs` 含分量，新 preview 仍出分量题
4. `dedupeKey` 用 `gap.field`，但 gap 上 **field 可能 undefined**，导致 key 碰撞或失效

### 2.2 设计目标（已按用户确认收窄）

- **同一条饮食录音的追问流程内**（preview 多轮）：不重复同一 **aspect**（分量/拆解/汤底/甜度…）
- **典型修复**：第一轮问了「吃了多少」，第二轮不再问「多少克/多大碗/确认分量」
- **次要**：当日 `dayLogs` 已知事实、`dietHistory` 习惯学习（已有，补强即可）

### 2.3 核心：Aspect 归一 + 多轮 Key 稳定

新建 `src/lib/followUpAspect.ts`：

```ts
/** 将 field / 题干映射到稳定 aspect */
type FollowUpAspect = 'portion' | 'components' | 'cooking' | 'soup' | 'sugar' | 'timing' | 'db_match' | 'other'

function normalizeAspect(q: FollowUpQuestion): FollowUpAspect {
  // field 优先
  if (q.field === 'portion') return 'portion'
  // 题干 fallback：/多少|几克|分量|多大|几碗/ → portion
  if (/多少|几克|分量|多大|几碗|毫升|几两/.test(q.question)) return 'portion'
  ...
}

function buildStableKey(q: FollowUpQuestion): string {
  const foodKey = normalizeFoodKey(q.targetFood ?? '')
  return `${q.followUpType ?? 'general'}-${foodKey}-${normalizeAspect(q)}`
}
```

**VoiceRecorder.handleFollowUpSubmit** 改为：

```ts
const previousKeys = preview.followUpQuestions.map(buildStableKey)
// 合并已问过的 rounds
const allKeys = [...(preview.followupMeta?.askedStableKeys ?? []), ...previousKeys]
await runExtraction(preview.transcript, supplemental, allKeys)
```

**preview.followupMeta** 扩展：

```ts
askedStableKeys?: string[]  // 累计所有轮次
```

### 2.4 数据模型（P0 必需 vs P2 可选）

#### P0（用户确认范围）— 同条录音多轮

见 §2.3；在 `buildThreeLayerFollowUps` 入口：

```ts
const prevSet = new Set(previousQuestionKeys ?? [])
return merged.filter(q => !prevSet.has(buildStableKey(q)))
```

#### P2（可选）— `FollowUpMemory` 跨会话

若后续要做跨日 dedup，再建 `followUpMemory.ts`；P0 不实现。

**P0 决策流**：

```
extractFromTranscript()
  ↓
applyHistoryDefaults(foods)          // 已有
  ↓
runFuzzyDetection → buildFollowUpDecision
  ↓
filterAlreadyKnownQuestions(         // 已有：当日 knownFacts
  questions, getKnownFactsFromDayLogs(dayLogs))
  ↓
merge LLM followUps
  ↓
dedupe by buildStableKey + previousQuestionKeys / askedStableKeys  // NEW
  ↓
shouldAskFollowUp (daily limit / fatigue)
```

### 2.5 具体规则

| 规则 ID | 条件 | 动作 |
|---------|------|------|
| ROUND-01 | `buildStableKey(q)` ∈ previousQuestionKeys | 丢弃 |
| ROUND-02 | 题干语义：已问 portion，新题 match `/几克\|多少\|分量/` | 丢弃 |
| ROUND-03 | 已问 components，新题 match `/什么面\|有哪些/` 同 food | 丢弃 |
| DAY-01 | 当日 dayLogs 已有 portion fact | 跳过分量（已有 `filterAlreadyKnownQuestions`） |
| HIST-01 | dietHistory ≥ learnThreshold | 跳过分量（扩展 fuzzy foodKey） |
| LLM-01 | prompt 注入「本轮已问：{askedStableKeys}」 | 减少 LLM 重复 |

### 2.6 多轮状态累积时机（P0）

| 事件 | 写入 |
|------|------|
| 每轮追问出题后 | 追加 `askedStableKeys` |
| 用户提交追问答案 | 保留 keys，进入下一轮 extract |
| 用户跳过追问 | 同样累积 keys（跳过 ≠ 未问过） |
| 保存 voiceLog 成功 | 清空 preview（keys 随 preview 销毁） |

P2 若做跨会话 memory，再增加 localStorage 持久化。

### 2.7 工程任务

| 任务 | 文件 |
|------|------|
| Aspect 归一 + stable key | 新建 `followUpAspect.ts` |
| 多轮 key 累计 | `VoiceRecorder.tsx`、`types/voice.ts` followupMeta |
| 决策/LLM dedup | `followUpDecision.ts`、`llm.ts` |
| 当日 knownFacts（已有） | `mealContext.ts` |
| 测试 | 新建 `followUpAspect.test.ts`（同条录音 2 轮不重复分量） |

### 2.8 验收

- [ ] 同条录音：第一轮答「分量」后，第二轮**不出现**「多少克/多大碗/确认分量」
- [ ] `askedStableKeys` 在 skip/submit 后均累积
- [ ] 单元测试：2 轮 extract 模拟，assert 第二轮 questions 无 portion aspect

### 2.9 P2 可选（未确认，暂不实施）

- 跨会话 memory 保留 **7 天** 还是 **30 天**
- 跳过后冷却：**60min** 还是 **当日不再问**

---

## 3. 改进三：健康来信 — 禁止自动刷新

### 3.1 现状与问题根因

| 现象 | 原因 |
|------|------|
| 离开首页再回来出现 loading | `WeeklyLetter` **mount 时** `useEffect([regenerationKey])` 调 `loadLetter()`；组件 unmount/remount 即重跑 |
| 每次 load 可能重新生成 | `setCachedLetter` **未实现**（`weeklyLetter.ts` L55 注释）；`getCachedLetter()` 常 miss |
| 新增饮食后来信变了 | `addVoiceLog` / `deleteVoiceLog` / `importWatchData` 调用 `regenerateWeeklyLetter()` → `weeklyLetterVersion++` |
| cacheKey 未校验 | `buildCacheKey()` 被调用但未与 cached.cacheKey 比较 |

### 3.2 设计目标（已确认）

- **每周一**（本地时区 00:00 起新的一周）：允许**自动**生成/刷新一次来信
- **同一周内**：切页、新增饮食、import 数据 → **来信不变**
- **任意时刻**：用户点击「重新生成」→ 强制刷新并更新 cache
- remount 不 flash loading（store + localStorage）

允许自动更新的场景：
1. 首次从未生成过来信
2. **进入新自然周（周一）**且 cache 属于上周
3. 用户点击「重新生成」

**禁止**自动更新：
- 同周内路由往返
- addVoiceLog / deleteVoiceLog / importWatchData（不 bump version）

### 3.3 方案：三层缓存 + 单一刷新入口

#### 3.3.1 完善 `weeklyLetter.ts` 缓存

```ts
export function setCachedLetter(cacheKey: string, data: WeeklyLetterData): void
export function getCachedLetter(): { cacheKey: string; data: WeeklyLetterData } | null
```

- 生成成功后 **必须** `setCachedLetter`
- `loadLetter` 逻辑：
  1. `key = buildCacheKey(...)`
  2. `cached = getCachedLetter()`
  3. 若 `cached && cached.cacheKey === key && cached.data.letter` → **直接展示**
  4. 若 `shouldAutoRefreshForNewWeek(cached?.generatedAt)` → 自动生成（新的一周）
  5. 否则若 `!cached?.data.letter` → 首次生成
  6. **同周且已有 cache** → 绝不自动再生

#### 3.3.2 组件内状态提升（推荐）

**问题**：`WeeklyLetter` 内部 `useState(letterData)` 在 unmount 时丢失 → remount 又 loading。

**方案 A（推荐）**：Zustand 存展示态

```ts
// useAppStore
weeklyLetter: WeeklyLetterData | null
weeklyLetterCacheKey: string | null
weeklyLetterLoading: boolean
weeklyLetterStale: boolean  // 数据已变但用户未点重新生成
```

- `WeeklyLetter` 纯展示 + 调 store actions
- 路由切换 **不丢** letter 内容
- mount 时：若 store 已有 letter → **不 loading**

**方案 B**：仅依赖 localStorage（实现 setCachedLetter + 同步读）

- 较简单但首次 read 仍可能 flash loading

#### 3.3.3 移除自动 bump `weeklyLetterVersion`

| 位置 | 现行为 | 改为 |
|------|--------|------|
| `addVoiceLog` | `regenerateWeeklyLetter()` | **删除**；可选 `setWeeklyLetterStale(true)` |
| `deleteVoiceLog` | 同上 | 同上 |
| `importWatchData` | 同上 | 同上；或 import 完成后 toast「数据已更新，可重新生成来信」 |
| `regenerateWeeklyLetter` | version++ | 显式：`clearCache` + `generateWeeklyLetter` + `setCachedLetter` |

#### 3.3.4 「重新生成」按钮 UX

- 点击 → loading → 新生成 → 更新 cache + store
- 若 `weeklyLetterStale === true`，footer 显示 subtle hint：「数据已有更新，点击重新生成可刷新来信」
- **不**自动弹 NewLetterModal（除非用户从未读过且手动生成后）

#### 3.3.5 NewLetterModal 触发

- 仅当：**手动重新生成成功** 且 用户未读 → 弹 Modal
- 删除：`weeklyLetterVersion` 变化即弹窗的逻辑（或改为仅在 `manualRegenerateId` 变化时弹）

### 3.4 工程任务

| 任务 | 文件 |
|------|------|
| 实现 setCachedLetter + key 校验 | `weeklyLetter.ts` |
| Store 来信状态 | `useAppStore.ts` |
| 重构 WeeklyLetter | `WeeklyLetter.tsx` |
| 移除 auto regenerate | `useAppStore.ts` `addVoiceLog` 等 |
| HomePage Modal 逻辑 | `HomePage.tsx` |
| 可选 stale 提示 | `WeeklyLetter.tsx` footer |

### 3.5 验收

- [ ] 跨周后首次进入首页：自动刷新来信（周一逻辑）
- [ ] 同周内首页 → 数据页 → 回首页：**来信文字完全一致**，无 loading skeleton
- [ ] 新增一条饮食记录：来信**不变**；footer 可选出现 stale 提示
- [ ] 点击「重新生成」：才更新内容
- [ ] 刷新浏览器：localStorage cache 恢复来信
- [ ] `regenerationKey` / `weeklyLetterVersion` 不再因普通数据操作递增

### 3.6 已确认

- 导入 Health ZIP：**不**自动刷新来信；toast 提示可手动重新生成
- stale 提示：**footer 小字**（非 banner）

---

## 4. 实施阶段（Claude Code）

| Phase | 内容 | 预估 |
|-------|------|------|
| **P0-a** | 来信 cache + 周一 auto + store 持久 + 移除同周 auto regenerate | 2–3h |
| **P0-b** | followUpAspect + 多轮 stable key + 测试 | 2–3h |
| **P1** | BodyWeather A1 视觉动画 + Hero/Modal 联动 | 3–4h |
| **P2** | 跨会话 followUpMemory（可选） | 2h |

每 Phase 结束：`npm test && npm run build`

---

## 5. 已确认决策（2026-06-16）

| 决策点 | 用户选择 | 实施含义 |
|--------|----------|----------|
| **A 天气视觉** | **A1** | 卡片内 medium 场景动画（opacity ~38%）+ Hero 色调联动；不抢来信风头 |
| **B 追问不重复** | **同条录音多轮** | 核心：**第一轮问了分量，第二轮不再问克数/分量/同一 aspect**；重点修 `previousQuestionKeys` + aspect 归一 + LLM 合并 dedup，**非**跨日长记忆（跨日仍靠 `dietHistory` ≥3 次） |
| **C 来信刷新** | **每周一自动 + 其余手动** | 每个自然周（周一 00:00 本地时区）允许自动生成一次；同周内切页/加饮食**不**自动刷新；其余时间仅「重新生成」按钮 |

---

## 5.1 决策点 B 细化（用户原话）

> 不重复指的是提问一样的问题，例如第一轮提问了分量，第二轮又提问多少克。

**必须保证**：
1. 同一 `VoiceExtraction` 预览流程内，多轮 `runExtraction(..., previousQuestionKeys)` **aspect 级 dedup**
2. 「分量 / 多少 / 几克 / 多大碗」归并为同一 aspect：`portion`
3. LLM 返回的 followUp 与 decision 层合并后，**按 stable key 再滤一遍**
4. UI 上第二轮不应出现语义重复题（即使 id 不同）

**不强制**（可作为 P2）：跨日 7 天 memory 库。

---

## 5.2 决策点 C 细化：每周一自动刷新

```ts
// weeklyLetter.ts
function shouldAutoRefreshForNewWeek(): boolean {
  const lastGen = getCachedLetter()?.generatedAt
  if (!lastGen) return true // 首次
  const last = startOfWeek(parseISO(lastGen), { weekStartsOn: 1 }) // 周一
  const now = startOfWeek(new Date(), { weekStartsOn: 1 })
  return now > last // 已进入新的一周
}
```

- App 启动 / 进入首页：若 `shouldAutoRefreshForNewWeek()` → 静默生成（可短 loading）
- 同周内：`loadLetter` 只读 cache/store，**不**因路由 remount 再生
- 用户随时可点「重新生成」覆盖当周 cache
- `addVoiceLog` / `importWatchData`：**不** bump version（除非跨周）

---

## 6. 执行指令

见 [CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md) Phase 1（来信+追问）、Phase 3（天气）。

---

## 7. 相关文件索引

| 领域 | 文件 |
|------|------|
| 天气 UI | `BodyWeatherCard.tsx`, `BodyWeatherScene.tsx`, `WeatherStamp.tsx` |
| 追问 | `followUpDecision.ts`, `mealContext.ts`, `dietHistory.ts`, `VoiceRecorder.tsx`, `llm.ts` |
| 来信 | `WeeklyLetter.tsx`, `weeklyLetter.ts`, `useAppStore.ts`, `HomePage.tsx` |

---

*功能改进方案 · 2026-06-16*
