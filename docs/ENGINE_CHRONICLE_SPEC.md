# 编年史家引擎规格书（E-Spec）

> **状态**：Plan + 类型已落地（`src/types/*`）；引擎实现待按 Phase 执行。  
> **SSOT 配套**：[PRODUCT_CHRONICLE_PLAN.md](./PRODUCT_CHRONICLE_PLAN.md)、[immutable-roaming-yeti.md](./immutable-roaming-yeti.md)

---

## 1. WellnessSnapshot 扩展契约

编排入口：[`buildWellnessSnapshot()`](../src/engine/wellnessSnapshot.ts)

```typescript
// src/types/wellness.ts（已实现）
export interface WellnessSnapshot {
  date: string
  bodyWeather: BodyWeatherSnapshot
  mood: MoodInferenceResult
  wuyin: WuyinPrescription | null
  circadian: PersonalCircadianPlan
  listeningWindow: WuyinListeningWindow | null
  innerClimate: InnerClimateSnapshot | null   // E1
  dailyBrief: DailyWeatherBrief | null      // E2
  caseFiles: CaseFile[]                       // E3
  bodySeason: BodySeasonSnapshot | null       // E4
}
```

| 字段 | 引擎 | 可为 null 条件 |
|------|------|----------------|
| `innerClimate` | `innerClimate.ts` | 当日无 watch 行 |
| `dailyBrief` | `dailyBrief.ts` | 同上 |
| `caseFiles` | `patternDiscovery.ts` | 永不为 undefined；数据不足时 `[]` |
| `bodySeason` | `bodySeason.ts` | 基线 `<14` 天 |

**编排顺序**（`wellnessSnapshot.ts` 内）：

```
signals → bodyWeather → mood → wuyin → circadian → listeningWindow
       → innerClimate(signals, diet, glucose?)
       → dailyBrief(bodyWeather, innerClimate, mood, wuyin, circadian, signals)
       → bodySeason(rows, baselines, prevSeasonId)
       → patternDiscovery(rows, voiceLogs, glucose?, existingCases)
```

---

## 2. 四个引擎模块

### E1 · `innerClimate.ts` + `types/innerClimate.ts`

**职责**：把饮食、活动、（可选）血糖合成「内部气候」三态，**不上 mmol/L 或步数**。

#### 类型（已实现）

见 [`src/types/innerClimate.ts`](../src/types/innerClimate.ts)：`InnerClimateState` = `steady` | `ripple` | `afterglow`

#### 输入

| 参数 | 类型 | 说明 |
|------|------|------|
| `signals` | `WellnessSignals` | 当日 HRV/睡眠/步数相对基线 |
| `voiceLogs` | `VoiceExtraction[]` | 当日 ±12h 饮食口述 |
| `targetDate` | `string` | YYYY-MM-DD |
| `glucoseReadings` | `GlucoseReading[]?` | v2；无则 `glucoseInformed: false` |

#### 输出

`InnerClimateSnapshot | null`

#### 算法概要（v1，无血糖）

1. **饮食负荷**：当日 `voiceLogs` 中 `mealType` ∈ {dinner, late_snack} 且 `portion` ≥ medium → +1 ripple 分
2. **活动起伏**：`stepsRatio > 1.3` 且 `hrvRatio < 0.9` → +1 ripple 分
3. **余波**：昨日 `exerciseMinutes ≥ 45` 且今日 `hrvRatio < 0.85` → `afterglow`
4. **映射**：
   - 0 分 → `steady` / 「稳」
   - 1–2 分 → `ripple` / 「微澜」
   - 余波规则命中 → `afterglow` / 「余波」
5. **hint 文案**：规则表驱动（如 ripple + 有晚餐 → 「午后消化可能占一点注意力」）
6. **confidence**：缺饮食且无步数 → `low`；双信号 → `medium`；三信号 → `high`

#### 算法概要（v2，有血糖）

- 餐后 2h 内峰值相对个人中位数 > +20% → 强制 `ripple` 或 `afterglow`
- `glucoseInformed: true`

#### 边界

- 禁止输出血糖数值
- 与 `bodyWeather` 独立：天气看恢复，气候看「体内波动」

---

### E2 · `dailyBrief.ts` + `types/dailyBrief.ts`

**职责**：今日能量档、恢复概率隐喻、适宜 chip、趋势句、FF-7 决策句。

#### 类型（已实现）

见 [`src/types/dailyBrief.ts`](../src/types/dailyBrief.ts)：`DailyWeatherBrief`、`DecisionHints`、`SuitabilityChip`

#### 输入

| 参数 | 类型 |
|------|------|
| `bodyWeather` | `BodyWeatherSnapshot` |
| `innerClimate` | `InnerClimateSnapshot \| null` |
| `mood` | `MoodInferenceResult` |
| `wuyin` | `WuyinPrescription \| null` |
| `circadian` | `PersonalCircadianPlan` |
| `signals` | `WellnessSignals` |
| `rows` | `DailyWatchRow[]`（算 3 日趋势） |

#### 输出

`DailyWeatherBrief | null`

#### 算法概要

**能量档 `energyLevel`**

| 条件 | energyLevel | energyLabel |
|------|-------------|-------------|
| `hrvRatio ≥ 0.95` 且 `sleepHours ≥ 7` | high | 充沛 |
| `hrvRatio < 0.85` 或 `sleepHours < 6` | low | 偏缓 |
| 其他 | steady | 平稳 |

**恢复概率 `recoveryProbability`**

- 基础 = clamp(`hrvRatio ?? 0.85`, 0.35, 0.95)
- `bodyWeather.weatherId === 'rainy'` → −0.15
- `innerClimate.state === 'afterglow'` → −0.10
- 显示为「恢复 XX%」

**适宜 chip `suitability`（≤3）**

1. `wuyin.primaryTone` 存在 → `{ id: 'wuyin', label: '适合跟哼X音' }`
2. `circadian` 下一收工窗 ≤2h → `{ id: 'circadian_gate', label: '适合收工' }`
3. `energyLevel !== low` 且步数基线成熟 → `{ id: 'walk', label: '适合散步' }`
4. `sleepHours < 6.5` 或 `weatherId ∈ {rainy, overcast}` → `{ id: 'early_sleep', label: '适合早睡' }`
5. `innerClimate.state === 'ripple'` → `{ id: 'light_meal', label: '晚餐清淡些' }`

按优先级取前 3。

**趋势 `trendHint`**

- 近 3 日 `hrvRatio` EWMA 斜率 < −0.05 → 「明后天可能进入小雨段」
- 斜率 > +0.05 → 「恢复力在往上走」
- 否则 → 「接下来几天大概维持现状」

**决策句 `decisionHints`（FF-7）**

| 维度 | 规则 |
|------|------|
| exercise | `recoveryProbability < 0.5` → rest；`< 0.7` → light；else go |
| treat | `innerClimate.ripple` 且无血糖 → ok；有血糖且午高峰 → caution |
| sleep | `sleepHours < 6.5` 或 连续 2 日短睡 → early |

#### 边界

- 首页不展示 HRV/RHR 原值
- `decisionHints` 并入 `dailyBrief`，不单独引擎文件

---

### E3 · `patternDiscovery.ts` + `types/caseFile.ts`

**职责**：从个人时序发现 N=1 模式，输出案卷；**每周新生成 ≤2 条**。

#### 类型（已实现）

见 [`src/types/caseFile.ts`](../src/types/caseFile.ts)：`CaseFile`、`PatternDiscoveryResult`

#### 输入

| 参数 | 类型 | 说明 |
|------|------|------|
| `rows` | `DailyWatchRow[]` | ≥14 天有效 |
| `voiceLogs` | `VoiceExtraction[]` | 晚餐时间推断 |
| `existingCases` | `CaseFile[]` | localStorage 合并 |
| `targetDate` | `string` | 运行日 |
| `glucoseReadings` | `GlucoseReading[]?` | 后续规则 |

#### 输出

`PatternDiscoveryResult`

#### 算法概要

**数据门槛**

- `daysAvailable < 14` → `insufficientData: true`，`newCases: []`

**规则 R1 · 周日 HRV 偏低**（`weekday_pattern`）

- 按 weekday 分组 HRV；Sunday mean vs 其他 mean
- 差值 > 0.15 × 全局 SD 且 n≥6 → 生成案卷
- confidence：n≥10 → high；else medium

**规则 R2 · 睡眠–HRV 正相关**（`sleep_hrv_correlation`）

- 配对样本 n≥14，Pearson r > 0.45 → 案卷
- evidence：「r≈0.52，n=28 天」

**规则 R3 · 晚餐偏晚–睡眠偏短**（`late_dinner_sleep`）

- voiceLog 晚餐 > 20:30 的日子 vs 其他；sleepHours 均值差 > 0.5h
- n≥8 → medium confidence

**去重与限额**

- 同 `kind` + 相似 title 已 open → 不重复生成
- 本周（ISO week）已新增 ≥2 → 停止
- 新案卷 `status: 'open'`，`displayNumber` 递增

**持久化**

- `src/lib/caseFileStore.ts`：merge `existingCases`，保留 verified/dismissed

#### 边界

- 文案含「个体差异，非诊断」
- 案卷 **不 push**（仅 in-app）

---

### E4 · `bodySeason.ts` + `types/bodySeason.ts`

**职责**：个人生理四季（非公历），检测基线漂移与季节更替。

#### 类型（已实现）

见 [`src/types/bodySeason.ts`](../src/types/bodySeason.ts)：`BodySeasonSnapshot`、`BodySeasonHistoryEntry`

#### 输入

| 参数 | 类型 |
|------|------|
| `rows` | `DailyWatchRow[]` |
| `baselines` | `PersonalBaseline[]` |
| `prevSeasonId` | `BodySeasonId \| null`（localStorage） |
| `targetDate` | `string` |

#### 输出

`BodySeasonSnapshot | null`

#### 算法概要

**漂移分数 `driftScore`（0–1）**

- 对 `hrvSdnn`、`sleepHours`、`dailySteps`、`restingHr` 计算 14 日 EWMA vs 42 日 baseline mean
- 每指标 z-score 绝对值加权平均 → driftScore

**四季映射（个人生理，非公历）**

| seasonId | 条件（14 日 EWMA vs 基线） | 隐喻 |
|----------|---------------------------|------|
| spring | HRV↑ 且 睡眠↑ | 恢复力回升，像解冻的河 |
| summer | 步数/运动↑ 且 HRV 稳定 | 活跃峰，像日照原野 |
| autumn | 各指标接近基线，波动小 | 稳定期，像午后落叶 |
| winter | RHR↑ 或 HRV↓ 或 睡眠↓ | 储备消耗，需要缓冲 |

取得分最高季；tie → 保持 `prevSeasonId`。

**`justChanged`**

- `seasonId !== prevSeasonId` 且 `prevSeasonId != null` → true
- 调用方 `saveSeasonId(seasonId)` 持久化

**建议 `suggestions`**

- 每季固定 3 条模板 + 注入当前 `wuyin.primaryTone` / circadian 收工窗

**confidence**

- `baselineMaturityDays < 14` → null 或 low + 降级文案
- `≥42` → high

#### 边界

- 非医疗季节诊断
- Modal 已读标记：`chroniclePrefs.seasonModalSeen`

---

## 3. Phase 3 / 4 / 5 / 7 子步骤拆分

> 对照 [immutable-roaming-yeti.md](./immutable-roaming-yeti.md) UI Phase 编号。

### Phase 3 · 身体档案馆（FF-3）

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| **3-E1** | 引擎 | `types/caseFile.ts`（✅） |
| **3-E2** | 引擎 | `engine/patternDiscovery.ts` + 单测 fixture |
| **3-E3** | 引擎 | `lib/caseFileStore.ts` 读写 merge |
| **3-E4** | 引擎 | `wellnessSnapshot` 接入 `caseFiles` |
| **3-UI1** | UI | `CaseFileCard.tsx`、`CaseFileGallery.tsx` |
| **3-UI2** | UI | `ChroniclePage.tsx` + `/chronicle` 路由 |
| **3-UI3** | UI | `LeftSidebar` / `BottomNav` 入口 |
| **3-UI4** | UI | 首页案卷折叠条（取代原 WeeklyActivity 右栏） |

**验收**：≥14 天数据出现 R1/R2/R3 案卷；空状态友好；状态 verified/dismissed 持久化。

---

### Phase 4 · 四季编年（FF-4）

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| **4-E1** | 引擎 | `types/bodySeason.ts`（✅） |
| **4-E2** | 引擎 | `engine/bodySeason.ts` + 单测 |
| **4-E3** | 引擎 | `lib/chroniclePrefs.ts`（seasonId、Modal 已读） |
| **4-E4** | 引擎 | `wellnessSnapshot` 接入 `bodySeason` |
| **4-UI1** | UI | `SeasonHeroCard.tsx`、`SeasonTimeline.tsx` |
| **4-UI2** | UI | `SeasonChangeModal.tsx`（justChanged 触发） |
| **4-UI3** | UI | `SeasonsPage.tsx` + `/seasons` 路由 |
| **4-UI4** | UI | `WeatherHeroCard` 季节更替 badge（依赖 Phase 1 UI） |

**验收**：seasonId 正确；更替 Modal 仅弹一次；`/seasons` 时间线可读。

---

### Phase 5 · 往来书信（FF-5）

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| **5-E1** | 引擎 | `types/bodyReply.ts`（轻量，非四主引擎） |
| **5-E2** | 引擎 | `lib/bodyReplyStore.ts` CRUD + `formatReplyHintForLetter()` |
| **5-E3** | 引擎 | `weeklyLetter.ts` prompt 注入上封回信摘要 |
| **5-UI1** | UI | `LetterReplyInput.tsx`（≤500 字） |
| **5-UI2** | UI | `LetterHistory.tsx` |
| **5-UI3** | UI | `LetterRevealOverlay` / `LetterReaderSheet` 回信入口 |

**验收**：回信存取；下周来信引用；规则回退路径可用。

---

### Phase 7 · 晨推 + 决策助手（FF-6 + FF-7）

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| **7-E1** | 引擎 | `types/innerClimate.ts`、`types/dailyBrief.ts`（✅） |
| **7-E2** | 引擎 | `engine/innerClimate.ts`、`engine/dailyBrief.ts` |
| **7-E3** | 引擎 | `wellnessSnapshot` 接入 `innerClimate`、`dailyBrief` |
| **7-E4** | 引擎 | `services/chronicleNotifications.ts`（读 dailyBrief + bodyWeather） |
| **7-UI1** | UI | `WeatherHeroCard` 嵌入 decisionHints chip（FF-7） |
| **7-UI2** | UI | `SettingsPage` 晨推开关 + 时间（复用 W3 框架） |
| **7-UI3** | UI | Tauri 8:00 推送文案：「今早身体雾，适宜散步+宫音」 |

**说明**：E1/E2 也是 **Phase 1 WeatherHeroCard 的前置**；Phase 7 完成推送与决策消费链。

**验收**：无 dailyBrief 时不推送；推送不恐吓；chip 可跳转 dojo/practice。

---

## 4. 文件清单（修订）

### 新增 · 引擎（4）

| 文件 | 模块 | Phase |
|------|------|-------|
| `src/engine/innerClimate.ts` | E1 | 1 / 7-E2 |
| `src/engine/dailyBrief.ts` | E2 | 1 / 7-E2 |
| `src/engine/patternDiscovery.ts` | E3 | 3-E2 |
| `src/engine/bodySeason.ts` | E4 | 4-E2 |

### 新增 · 类型（4，✅ 已创建）

| 文件 | 模块 |
|------|------|
| `src/types/innerClimate.ts` | E1 |
| `src/types/dailyBrief.ts` | E2 |
| `src/types/caseFile.ts` | E3 |
| `src/types/bodySeason.ts` | E4 |

### 新增 · 支撑 lib / services

| 文件 | Phase |
|------|-------|
| `src/lib/caseFileStore.ts` | 3-E3 |
| `src/lib/chroniclePrefs.ts` | 4-E3 |
| `src/lib/bodyReplyStore.ts` | 5-E2 |
| `src/types/bodyReply.ts` | 5-E1 |
| `src/services/chronicleNotifications.ts` | 7-E4 |

### 修改

| 文件 | 变更 |
|------|------|
| `src/types/wellness.ts` | ✅ 扩展 `WellnessSnapshot` |
| `src/engine/wellnessSnapshot.ts` | 接入四引擎（当前 stub null/[]） |
| `src/services/weeklyLetter.ts` | Phase 5-E3 |

### 纠正（相对旧 yeti 文档）

- ❌ 「引擎层 0 改动 / 已完备」→ **四模块待实现**
- ❌ 首页 WeeklyActivity panel → **已移除**；右栏留给案卷折叠条
- ❌ 「所有 types 已完备」→ **四类型新建 + wellness 扩展**

---

## 5. 依赖 DAG

```
types (4) ─────────────────────────────────────────┐
                                                    ▼
innerClimate ──► dailyBrief ──► WeatherHeroCard / 晨推(7)
       │                │
       │                └──► decisionHints (FF-7)
       │
bodyWeather / mood / wuyin / circadian (已有)

patternDiscovery ──► caseFiles ──► /chronicle + 首页条(3)
bodySeason ──► /seasons + Modal(4)
bodyReplyStore ──► weeklyLetter(5)
```

Phase 1 UI 依赖 **7-E2**（或并行标记为 1-E* 与 7-E2 同一实现）。
