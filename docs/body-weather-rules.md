# 身体天气 — 规则表（骨架）

> **产品约束**：用户只见天气隐喻（「阴天」），不见 HRV/RHR 数值。  
> **数据约束**：指标均相对 **个人 42 日基线**（`PersonalBaseline`）；Apple Watch HRV 标记为 `trend_only`。  
> **引擎文件（待建）**：`src/engine/bodyWeather.ts`  
> **配置（待建）**：`src/config/bodyWeatherRules.ts`

---

## 1. 天气状态枚举

| weatherId | 用户主文案 | 副文案（可选） | letterOpener 模板 |
|-----------|------------|----------------|-------------------|
| `sunny` | 晴朗无风 | 身心节奏比较稳 | 今天身体像晴朗的早晨，我们可以轻松一点开始。 |
| `partly_cloudy` | 多云 | 有一两处小波动 | 今天身体像多云天，不算坏，记得对自己温柔一点。 |
| `overcast` | 阴天 | 恢复略慢 | 今天身体像阴天，不算异常，只是需要多一点点耐心。 |
| `rainy` | 阴雨 | 休息不足或负荷偏高 | 今天外面下雨，你的身体里也是——我们撑伞慢慢走就好。 |
| `foggy` | 薄雾 | 信号不全或波动大 | 今天像薄雾天，看不太清全貌，先休息、先呼吸就好。 |
| `rainbow` | 雨后彩虹 | 运动恢复中 | 昨天辛苦了一下，今天像雨后的彩虹，正在慢慢放晴。 |

---

## 2. 输入信号定义

| 信号 key | 计算方式 | 缺失处理 |
|----------|----------|----------|
| `hrvRatio` | 当日 `hrvSdnn / baseline.hrvSdnn.mean` | 无 HRV → 不参与 HRV 规则，整体降置信度 |
| `rhrDelta` | 当日 `restingHr - baseline.restingHr.mean` | 无 RHR → 跳过 RHR 规则 |
| `sleepHours` | 当日 `sleepHours` | null → 视为「未知睡眠」 |
| `awakeEpisodes` | 当日 `awakeEpisodes` | null → 忽略 |
| `wristTempDelta` | 当日 `wristTempRaw - baseline.wristTemp.mean`（待增基线） | null → 忽略 |
| `yesterdayExercise` | 昨日 `exerciseMinutes` | null → 忽略 rainbow 规则 |
| `hrvIntradayCv` | 来自 `computeDerived(row).hrvIntradayCv` | 可选，用于 foggy |

### 阈值常量（骨架，待文献校准）

| 常量 | 默认值 | 说明 |
|------|--------|------|
| `HRV_LOW_RATIO` | 0.85 | 低于基线 15% |
| `HRV_VERY_LOW_RATIO` | 0.70 | 低于基线 30% |
| `RHR_ELEVATED_BPM` | +5 | 相对基线 |
| `RHR_HIGH_BPM` | +8 | 相对基线 |
| `SLEEP_SHORT_H` | 6.0 | 短睡眠 |
| `SLEEP_OK_H` | 7.0 | 尚可 |
| `AWAKE_HIGH` | 5 | 夜间清醒次数 |
| `EXERCISE_HIGH_MIN` | 45 | 昨日运动量 |
| `TEMP_ELEVATED_C` | +0.3 | 相对 wrist 基线 |

---

## 3. 规则表（按优先级从高到低匹配）

> **匹配策略**：自上而下，**首条命中且 priority 最高者** 为 `primaryWeather`；若多条同级，取 confidence 最高。  
> **confidence**：`high` / `medium` / `low`；缺关键信号时最高不超过 `medium`。

| ruleId | priority | 条件（伪代码） | → weatherId | confidence | citationIds | 备注 |
|--------|----------|----------------|-------------|------------|-------------|------|
| `BW-rainbow-01` | 10 | `yesterdayExercise >= EXERCISE_HIGH` AND `hrvRatio < HRV_LOW_RATIO` AND `rhrDelta <= RHR_ELEVATED_BPM` | `rainbow` | medium | RECOVERY-HRV-001 | 运动后恢复态，非病理 |
| `BW-rainy-01` | 20 | `sleepHours < SLEEP_SHORT_H` AND (`hrvRatio < HRV_LOW_RATIO` OR `rhrDelta >= RHR_ELEVATED_BPM`) | `rainy` | medium | SLEEP-ANX-001, HRV-STRESS-001 | |
| `BW-rainy-02` | 21 | `sleepHours < SLEEP_OK_H` AND `awakeEpisodes >= AWAKE_HIGH` | `rainy` | medium | TODO | 睡眠碎片化 |
| `BW-overcast-01` | 30 | `hrvRatio < HRV_LOW_RATIO` AND `rhrDelta >= RHR_ELEVATED_BPM` | `overcast` | medium | HRV-STRESS-001, RHR-SLEEP-001 | |
| `BW-overcast-02` | 31 | `hrvRatio < HRV_VERY_LOW_RATIO` | `overcast` | medium | HRV-STRESS-001 | 仅 HRV |
| `BW-foggy-01` | 40 | `hrvSdnn == null` AND `rhrDelta >= RHR_HIGH_BPM` | `foggy` | low | HRV-WEAR-001 | 数据不全 |
| `BW-foggy-02` | 41 | `hrvIntradayCv != null` AND `hrvIntradayCv > TODO_CV` | `foggy` | low | TODO | 波动大 |
| `BW-foggy-03` | 42 | `wristTempDelta >= TEMP_ELEVATED_C` AND `sleepHours < SLEEP_OK_H` | `foggy` | low | TEMP-SLEEP-001 | |
| `BW-partly-01` | 50 | 命中以下**恰好 1 项**：`hrvRatio<HRV_LOW` / `rhrDelta>=RHR_ELEVATED` / `sleepHours<SLEEP_OK` | `partly_cloudy` | medium | — | |
| `BW-sunny-01` | 60 | `hrvRatio >= 0.95` AND `rhrDelta <= 2` AND `sleepHours >= SLEEP_OK_H` | `sunny` | medium | — | 全部信号齐全时 |
| `BW-default-01` | 99 | else | `partly_cloudy` | low | — | 兜底 |

---

## 4. 输出结构（TypeScript 类型见 `src/types/bodyWeather.ts`）

```ts
interface BodyWeatherSnapshot {
  date: string
  weatherId: BodyWeatherId
  label: string              // 「阴天」
  metaphor: string           // 一句人话
  letterOpener: string       // 来信开头
  confidence: 'high' | 'medium' | 'low'
  matchedRuleId: string
  // 仅 advancedMode：
  debugFactors?: { signal: string; value: number | null; note: string }[]
}
```

---

## 5. 与来信 / UI 联动

| 消费方 | 字段 |
|--------|------|
| `WeatherStamp` | `weatherId` → 图标映射 |
| `weeklyLetter` SYSTEM_PROMPT | `letterOpener` 必须融入开头 |
| `HomePage` | `label` + `metaphor`，禁止展示 `hrvRatio` |

---

## 6. 待办（调研 & 工程）

- [ ] 填写 `evidence-bibliography.md` 中 BW 相关文献
- [ ] `baselines.ts` 增加 `wristTempRaw`
- [ ] 实现 `bodyWeather.ts` + 单元测试 fixtures
- [ ] 校准 `TODO_CV`（日内 HRV 变异系数阈值）
- [ ] 缺 HRV 日文案走 `foggy` / `partly_cloudy` 降级策略 A/B 测试
