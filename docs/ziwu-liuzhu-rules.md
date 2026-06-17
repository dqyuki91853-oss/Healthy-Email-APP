# 子午流注 / 个人作息 — 规则表（骨架）

> **边界**：不能从 Apple Watch **直接测经络**；仅用时辰文化框架 + **可观测代理**（入睡时刻、 wrist temp、活动）。  
> **引擎（待建）**：`src/engine/tcmCircadian.ts`  
> **配置（待建）**：`src/config/tcmMeridianSchedule.ts`

---

## 1. 固定时辰 → 现代行为建议（非诊断）

| windowId | 时辰 | 小时范围 | 经络（文化标签） | modernProxy | 用户文案（骨架） | citationIds |
|----------|------|----------|------------------|-------------|------------------|-------------|
| `W-亥` | 亥 | 21–23 | 三焦 | `wind_down` | 少进食、少屏幕，让身体慢慢收工 | TCM-ZIWU-001 |
| `W-子` | 子 | 23–01 | 胆 | `sleep_gate` | 尽量靠近你的「个人入睡窗口」 | TCM-ZIWU-001, TEMP-SLEEP-001 |
| `W-丑` | 丑 | 01–03 | 肝 | `deep_sleep` | 深睡阶段，尽量不被打断 | TCM-ZIWU-001 |
| `W-寅` | 寅 | 03–05 | 肺 | `deep_sleep` | 继续休息 | TCM-ZIWU-001 |
| `W-卯` | 卯 | 05–07 | 大肠 | `gentle_wake` | 缓慢醒来、补水 | TCM-ZIWU-001 |
| … | | | | | 其余时辰默认 `neutral` | |

前台默认只高亮 **`W-亥` + `W-子` + 个人 sleep_gate**，不全表展示。

---

## 2. 个人「入睡窗口」推算规则

| ruleId | 输入 | 计算（骨架） | 输出字段 |
|--------|------|--------------|----------|
| `TCM-sleep-onset-01` | 近 14 天 sleep segment `startDate`（**需 parser 扩展**） | 中位数入睡时刻 `T_sleep` | `personalSleepOnset` |
| `TCM-sleep-onset-fallback` | 仅有 `inBedMin` 日聚合 | 用 `date` + 推断 `T_sleep = 23:00` 默认 | confidence low |
| `TCM-sleep-gate-01` | `T_sleep` | `personalSleepGate = T_sleep - 90min` | 建议开始准备休息 |
| `TCM-sleep-gate-02` | `wristTemp` 7 日 | 夜间相对下降拐点 ≈ `T_temp`；若与 `T_sleep` 差 >30min 取平均 | confidence medium |
| `TCM-melatonin-proxy` | — | **禁止**输出「褪黑素」；仅内部 note | — |

---

## 3. 反向日程 UI 规则

| 状态 | 条件 | UI |
|------|------|-----|
| `in_wind_down` | 当前时刻 ∈ [personalSleepGate - 30min, personalSleepOnset] | 高亮 `W-亥` 区段 |
| `past_gate` | 当前 > personalSleepOnset + 30min 且 last night sleepHours < 6.5 | 来信温柔提示，不用「胆经不通」 |
| `on_track` | last night sleepHours >= 7 且 onset 误差 < 45min | 正向反馈 |

---

## 4. 输出结构

```ts
interface PersonalCircadianPlan {
  personalSleepOnset: string    // "23:15"
  personalSleepGate: string     // "21:45"
  confidence: 'high' | 'medium' | 'low'
  activeWindowId: string | null
  suggestionText: string
  matchedRuleIds: string[]
}
```

---

## 5. 待办

- [ ] `health_parse.py` 导出 sleep segment 起始时间
- [ ] `baselines.ts` 增加 wristTemp
- [ ] 文献：TEMP-SLEEP-001 验证 gate 偏移 60 vs 90 min
- [ ] UI `CircadianTimeline.tsx` 仅 24h 简化条
