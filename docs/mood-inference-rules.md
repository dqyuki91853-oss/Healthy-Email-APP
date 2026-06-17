# 情绪推断 — 规则表（骨架）

> **用途**：在**无语音情绪输入**或语音缺失时，用 Apple Watch + 睡眠 + 饮食模式**辅助**推断主导情绪，供五音处方与来信语气使用。  
> **非诊断**：输出为 `likely / possible`，前台不得写「你有焦虑症」。  
> **引擎（待建）**：`src/engine/moodInference.ts`  
> **配置（待建）**：`src/config/moodInferenceRules.ts`

---

## 1. 情绪标签枚举

| moodTag | 用户可见词（如需） | 五音默认映射 | 说明 |
|---------|-------------------|--------------|------|
| `anxiety` | 心里有点紧 | 徵 zhǐ | 焦虑、紧张、担心 |
| `low_mood` | 有点沉 | 商 shāng | 低落、悲伤 |
| `irritable` | 有点烦 | 角 jué | 易怒、烦躁 |
| `fatigue` | 有点累 | 宫 gōng | 疲惫、思虑多 |
| `fearful` | 不安 | 羽 yǔ | 恐惧、乏力（少用，需高置信） |
| `calm` | 还算平 | — | 不推送五音 |
| `unknown` | — | — | 证据不足 |

---

## 2. 输入源

| 来源 | 字段 | 优先级 |
|------|------|--------|
| 语音 | `voiceLogs[].emotions`（当日/近 3 日） | **最高**，覆盖推断 |
| 生理 | 下列规则表 | 中 |
| 默认 | 无命中 | `unknown` |

### 语音 → moodTag 映射

| voice emotion（现有 llm.ts） | → moodTag |
|------------------------------|-----------|
| 焦虑 | `anxiety` |
| 低落 | `low_mood` |
| 易怒 | `irritable` |
| 平静 | `calm` |

---

## 3. 生理推断规则表

> **前提**：使用 `PersonalBaseline`（42 日）与当日 + 近 2 日 `DailyWatchRow`。  
> **合并策略**：收集所有命中规则 → 按 `weight × confidenceScore` 求和 → 取最高 `moodTag`；若最高分 < 阈值 → `unknown`。

| ruleId | moodTag | 条件（伪代码） | weight | confidence | citationIds | 用户可见表述（骨架） |
|--------|---------|----------------|--------|------------|-------------|----------------------|
| `MOOD-voice-override` | * | 当日 voice 有 emotions | 100 | high | — | 以你今天的记录为准 |
| `MOOD-sleep_anxiety-01` | anxiety | `sleepHours < 6` AND `hrvRatio < 0.85` | 40 | medium | SLEEP-ANX-001 | 睡不够时，身体有时会像心里发紧 |
| `MOOD-sleep_anxiety-02` | anxiety | 连续 2 日 `sleepHours < 6.5` | 35 | medium | SLEEP-ANX-001 | |
| `MOOD-rhr_stress-01` | anxiety | `rhrDelta >= 8` 连续 2 日 | 30 | medium | RHR-SLEEP-001, HRV-STRESS-001 | |
| `MOOD-rhr_irritable-01` | irritable | `rhrDelta >= 5` AND `sleepHours < 7` AND `hrvRatio < 0.90` | 25 | low | TODO | |
| `MOOD-hrv_low_lowmood-01` | low_mood | `hrvRatio < 0.75` AND `dailySteps < baseline×0.6` 连续 2 日 | 25 | low | TODO | 动得少、恢复低，情绪容易往下沉 |
| `MOOD-exercise_fatigue-01` | fatigue | 昨日 `exerciseMinutes >= 60` AND 今日 `hrvRatio < 0.85` | 20 | medium | RECOVERY-HRV-001 | 昨天练得狠，今天多休息 |
| `MOOD-awake_anxiety-01` | anxiety | `awakeEpisodes >= 5` AND `sleepHours < 7` | 20 | low | TODO | 夜里醒得多，白天更容易紧 |
| `MOOD-caffeine_irritable-01` | irritable | 近 3 日 voice 含咖啡因标签 ≥2 且 `rhrDelta >= 5` | 15 | low | TODO | 需饮食标签 |
| `MOOD-alcohol_low-01` | low_mood | 近 3 日 alcohol 记录 + `sleepHours < 6.5` | 15 | low | TODO | |
| `MOOD-calm-01` | calm | `hrvRatio >= 0.95` AND `sleepHours >= 7` AND 无 negative voice | 30 | medium | — | |
| `MOOD-default-01` | unknown | else | 0 | low | — | |

### 辅助信号（待接入）

| 信号 | 来源 | 用途 |
|------|------|------|
| `negativeEmotionDays` | 已有 `directionScorer` | 近 7 日语音负向情绪天数 |
| `hrvIntradayCv` | `computeDerived` | 波动大 → anxiety possible |
| `respiratoryRateSleep` | AW | 升高 → anxiety possible（TODO 文献） |

---

## 4. 输出结构

```ts
interface MoodInferenceResult {
  date: string
  dominant: MoodTag
  confidence: 'high' | 'medium' | 'low'
  source: 'voice' | 'inferred' | 'mixed' | 'unknown'
  matchedRuleIds: string[]
  /** 前台可用的一句人话，禁止诊断术语 */
  gentleNote?: string
  /** advancedMode only */
  scores?: Partial<Record<MoodTag, number>>
}
```

### gentleNote 模板（示例）

| dominant | gentleNote |
|----------|------------|
| anxiety | 身体今天有点像「心里下着小雨」，不一定是坏事，慢一点的节奏也可以。 |
| low_mood | 这几天节奏重了一点，允许自己轻一点。 |
| irritable | 睡眠和心跳都在提醒你：今天适合少较劲。 |
| fatigue | 昨天很努力，今天值得多休息一会儿。 |
| calm | 今天状态比较稳，很好。 |
| unknown | — |

---

## 5. 与五音 / 天气 / 来信联动

```
moodInference.dominant + bodyWeather.weatherId
        ↓
wuyinPrescription（见 docs/wuyin-tone-rules.md）
        ↓
weeklyLetter 语气 + 可选 WuyinSession 入口
```

| 组合 | 行为（骨架） |
|------|--------------|
| `rainy` + `anxiety` | 来信 opener 用天气句 + 推荐徵音 90s |
| `rainbow` + `fatigue` | 来信表扬恢复 + 不推荐强音疗 |
| voice 有 `焦虑` | 跳过 MOOD-* 生理规则，直接徵音 |

---

## 6. 待办

- [ ] 补全 SLEEP-ANX / RHR 相关文献 VERIFIED
- [ ] 定 `dominant` 最低得分阈值（建议 ≥35 才非 unknown）
- [ ] 与 `EMOTION_KEYWORDS` 扩展（悲伤、疲惫、恐惧）对齐
- [ ] 单元测试：纯睡眠剥夺样本、纯 voice 覆盖、冲突样本
