# 子午流注 × 五音聆听窗口 — 实施计划

> **版本**：v1 · 2026-06-11  
> **前置**：Phase 1–6 数字道场 Web 预览（tag `v4-dojo-web`）  
> **状态**：Phase W1 已完成（Web）；Phase W2 待实施

---

## 0. 已确认产品决策

| # | 决策 | 选择 |
|---|------|------|
| 1 | 时间模型 | **收工主窗口（A）** + **传统时辰对照（D）**；mood 处方优先，时辰仅微调文案 |
| 2 | 提醒渠道 | **先做规则 + App 内 UI**；Capacitor 本地通知留到 App 打包（Phase W3） |
| 3 | 练习类型 | **跟哼 + 试听**；收工段偏跟哼，白天偏轻听 |
| 4 | 窗口内已练 | **收起提醒**，显示「今日收工练习已完成 ✓」 |
| 5 | 窗口偏移 | **personalSleepGate 提前 15 分钟**开始高亮/提醒 |

---

## 1. 子午流注时间轴 — 作用

把 Watch 睡眠 + 「收工 / 入静」文化框架，转为**个人休息节奏参考**（非诊断）：

- `personalSleepOnset` — 参考入睡时刻（14 日睡眠均值）
- `personalSleepGate` — 收工起点（入睡 − 90min）
- `phaseLabel` — before_gate / wind_down / sleep_window / late
- UI「时间长河」— 可视化当前阶段 + Watch 睡眠相位

---

## 2. 五音 — 何时听

**现状**：仅由当日 mood 推断（`wuyinPrescription.ts`），与时刻无关。

**结合后**：

| 时段 | 建议模式 |
|------|----------|
| gate−15min → onset（primary） | **跟哼优先** |
| before_gate 且距 gate ≤ 90min | **试听暖场** |
| sleep_window | 轻听或极短哼 |
| late | closed，不强调五音 |
| 白天 secondary | 轻听 + 文化对照文案 |

**优先级**：mood 处方 toneId > primary 窗口规则 > meridianToneHint（仅展开说明）

---

## 3. 数据结构（Phase W1）

```ts
interface WuyinListeningWindow {
  tier: 'primary' | 'secondary' | 'closed'
  suggestedMode: 'hum' | 'listen' | 'either'
  windowStart: string      // personalSleepGate - 15min
  windowEnd: string        // personalSleepOnset
  phaseLabel: CircadianPhaseLabel
  meridianWindowId: string | null
  toneHint: WuyinToneId
  meridianToneHint?: WuyinToneId
  reasonText: string
  minutesUntilOpen: number
  minutesUntilClose: number
  /** 今日 primary 窗口内已跟哼 → 收起提醒 */
  completedInWindow: boolean
}
```

---

## 4. 实施路线

### Phase W1 — 规则 + UI（2–3h）

- [x] `src/engine/wuyinListeningWindow.ts`
- [x] `wellnessSnapshot` 接入
- [x] `DojoListeningWindowStrip.tsx`
- [x] `CircadianRiverStrip` 叠加五音适宜带
- [x] 与 `wuyinPracticeStreak` / `practicedWuyinToday` 联动 completed 态

### Phase W2 — 设置（1–2h）

- [ ] Settings：启用收工五音提醒、gate 偏移（默认 15min）
- [ ] localStorage dismiss / snooze

### Phase W3 — App 本地通知（打包时）

- [ ] `@capacitor/local-notifications`
- [ ] deep link → `/practice/wuyin` 或首页道场

### Phase W4 — 可选

- [ ] 12 时辰 × 五音文化表（Expand 面板）
- [ ] 来信：「这周在收工窗口练了 N 次」

---

## 5. 边界

- 不做 Hz 治疗宣称；时辰为文化参考
- Web 第一版不做 Notification API
- 不改 IndexedDB schema（偏好放 localStorage / settings store）
