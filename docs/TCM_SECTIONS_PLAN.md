# 五音 + 东方作息 — 板块深化方案

> **读者**：Claude Code  
> **项目**：`CC project/subhealth-monitor`  
> **路线图**：[CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md) Phase 2  
> **前置**：`WELLNESS_RESEARCH_AND_DESIGN.md` §2.4–2.5

---

## 0. 两板块各自想表达什么（产品语义）

### 0.1 五音疗疾 `WuyinSessionCard`

| 维度 | 设计意图 | 用户应感受到 |
|------|----------|--------------|
| **本质** | 60–90 秒 **跟哼 + 慢呼吸** 的微型放松仪式，不是音乐播放列表 | 「给我一件现在就能做的小事」 |
| **为何是这音** | 由 `moodInference`（睡眠/HRV/语音）推断 dominant mood → 映射五音 | 「App 懂我今天偏累/偏急，所以推荐这个练习」 |
| **宫商角徵羽** | 传统文化 **命名与仪式**，非 Hz 治脏腑 | 看见「宫·脾」应联想到 **稳、中和、慢下来**，不是诊断 |
| **与现代证据** | HUM-HRV-2013、BREATH-RELAX：哼唱 + 慢呼吸可能助放松 | 练习过程有 **呼吸节奏引导**，不是只听 sine 波 |
| **边界** | disclaimer：传统参考 + 放松练习 | 不出现「治疗」「共振治愈」 |

**截图现状（unknown → 宫音）**：引擎 fallback 到 `WY-unknown-01`，文案偏中性，**未解释「为何今日推荐」**，卡片像静态说明 + 两个按钮。

### 0.2 东方作息参考 `CircadianHintCard`

| 维度 | 设计意图 | 用户应感受到 |
|------|----------|--------------|
| **本质** | **个人化**「今晚几点该开始收工、几点参考入睡」 | 「这是我自己的作息窗口，不是背表」 |
| **数据从哪来** | 近 14 日睡眠时长 → 调整 fallback 23:00；准备休息 = 入睡 − 90min | 时间数字 **有依据**（哪怕 confidence low） |
| **子午流注角色** | 21–23 亥时「收工」、23–01 子时「入静」的 **文化时间框** | 知道「现在处于哪个休息阶段」，不是「胆经不通」 |
| **动态文案** | 昨晚睡够/不足、当前是否在亥子时，切换 suggestion | 每天打开 **有一句话是对今天说的** |
| **边界** | 无褪黑素、无经络病理 | disclaimer 保留 |

**截图现状**：仅标题 + 一句泛化建议 + 两个时间点 + disclaimer。**缺少时间轴、当前时刻、与「个人节奏」的可视化连接**。

---

## 1. 问题诊断（为何显得简略）

### 1.1 五音卡片

| 缺口 | 现状 | 影响 |
|------|------|------|
| **因果链不可见** | 不展示 mood 推断 → 五音 的「因为…所以…」 | 用户不知为何是宫音 |
| **仪式层薄** | 呼吸动画仅 `phase === 'session'` 出现 | idle 态像设置页 |
| **五音符号弱** | 仅文字「宫音·脾」+ 小 Music 图标 | 缺少五音视觉识别（印章/波形/五行色） |
| **练习步骤抽象** | 「慢慢哼一会儿」无分步 | 新手不知 inhale-hum-exhale 4-6-6 |
| **与身体天气脱节** | 仅 anxiety+rainy 有加句 | fatigue/overcast 等未联动 metaphor |
| **完成后无反馈** | 一行「练习完成」 | 缺少轻量成就感 / 与来信联动 |

### 1.2 作息卡片

| 缺口 | 现状 | 影响 |
|------|------|------|
| **无时间上下文** | 不显示现在几点、离「准备休息」还有多久 | 两个时间像静态配置 |
| **无 CircadianTimeline** | 设计文档 R4 未做 | 子午流注只剩名字，无「流」 |
| **个性化不可信** | confidence low 仅括号小字 | 用户不知道 21:30/23:00 怎么来的 |
| **时辰文化未呈现** | `activeWindowId` 算了但未展示 | 亥时/子时的收工语义丢失 |
| **与昨晚数据弱连接** | suggestionText 有逻辑但 UI 不突出 | 「根据最近睡眠」像套话 |

---

## 2. 改进方向（三套强度）

### 方案 A — 卡片增强（推荐 Phase 1，2–3h）

**不改路由**，在现有 Card 内加厚信息与轻交互。

#### A1 五音 `WuyinSessionCard` 2.0

```
┌─ 今日音疗 · 放松练习 ─────────────────────────────────────┐
│ [五音印章 GongStamp]  宫音 · 脾                              │
│ 副标题 13px muted：今天身体有点像「多云」，适合用稳一点的宫音 │
│ ── 三步练习（idle 即可见）────────────────────────────────  │
│  ① 听参考音（2s）  ② 跟着圆环 吸—哼—呼  ③ 约 60 秒          │
│ [BreathingGuide 缩略预览 loop，opacity 50%]                   │
│ [试听参考音]  [开始哼唱 60s]                                  │
│ 10px disclaimer                                              │
└──────────────────────────────────────────────────────────────┘
```

**工程**：
- 新增 `GongStamp` / `ToneStamp`（类似 WeatherStamp，五音汉字 + 五行色边）
- `WuyinContextLine`：从 `wellness.mood` + `bodyWeather` 生成一句「因为…所以…」（**无数值**）
  - 例 unknown：「还看不清今天的情绪底色，先用最中性的宫音稳一稳。」
  - 例 fatigue：「最近睡得偏少，宫音低而长，适合把节奏放慢。」
- idle 态显示 **缩略 BreathingGuide loop**（opacity ~50%，D4 已确认）；session 态放大至全尺寸
- 新增 `WuyinStepList`：3 步文案，来自 `humPattern` 映射
- `handleStart` 前 3s 倒计时「准备…」再开计时

#### A2 作息 `CircadianHintCard` 2.0

```
┌─ 东方作息参考 ─── 现在 20:15 ──────────────────────────────┐
│ [迷你时间轴 18:00 ───●────── 21:30 ──── 23:00 ─── 01:00]   │
│      现在↑              准备休息      参考入睡    子时      │
│ 主文案：还有约 1 小时 15 分，可以开始少屏幕、收一收。        │
│ 副文案：近 14 天睡眠推算 · 置信度低                          │
│ 10px disclaimer                                            │
└────────────────────────────────────────────────────────────┘
```

**工程**：
- 新建 `CircadianMiniTimeline.tsx`：仅渲染 **18:00–01:00** 区段 + 两锚点 + now 竖线
- `computePersonalCircadian` 扩展返回：
  - `minutesUntilGate: number`
  - `phaseLabel: 'before_gate' | 'wind_down' | 'sleep_window' | 'late'`
  - `personalizationHint: string`（如「近 14 天平均睡 6.2h，建议略早准备」）
- 主文案按 `phaseLabel` 切换（非单一套话）
- 亥时/子时仅作 **时间轴标签**（「收工段」「入静段」），hover 显示 `modernProxy` 白话

---

### 方案 B — 可展开详情（Phase 2，3–4h）

点击卡片 → **Card 内 accordion / 轻 overlay**（非新 Tab）。

#### B1 五音展开层

- 五音 **五行色环** + 情绪白描（「思/虑 → 宫」用 `emotionLabel`，不说脏腑病）
- 「今日怎么推断的」：**隐喻句** 1–2 条（来自 mood factors 的 userFacing 文案，过滤 ruleId）
- 可选：60s 内 **圆环 + 振动触觉**（`navigator.vibrate` 弱脉冲，需设置开关）

#### B2 作息展开层

- 完整 `CircadianTimeline` 24h 条（设计文档 2.4.3）
- 点击时辰 → 弹出 **modernProxy 建议**（wind_down / sleep_gate / deep_sleep）
- 「我的窗口怎么算的」折叠说明（14 日平均、fallback 23:00、±调整规则）— **高级模式可开**

---

### 方案 C — 独立仪式页（Phase 3，可选）

- `/practice/wuyin` 全屏：大 BreathingGuide + 进度环 + 完成后写 `localStorage` streak
- 首页卡片仅 **入口摘要**
- 适合「五音是核心功能」时；**当前产品来信优先，不建议先做**

---

## 3. 文案层改进（低成本高收益）

### 3.1 五音「因为所以」模板

| moodTag | contextLine 示例 |
|---------|------------------|
| unknown | 还不确定今天的情绪底色，先用最中性的宫音，慢慢哼一会儿。 |
| fatigue | 身体有点像「阴天」，宫音低而稳，帮节奏慢下来。 |
| anxiety | 心里有点急，徵音配慢呼吸，像把胸腔的结松开一点。 |
| low_mood | 情绪偏沉，商音配长呼气，不追求响，追求稳。 |
| irritable | 肩上有劲，角音短哼几轮，像把劲轻轻放下来。 |

**联动 bodyWeather**（追加半句，已有 rainy+anxiety 逻辑可泛化）：
- overcast + fatigue → 「外面也阴，里面也慢，宫音正好。」
- rainbow → 隐藏卡片（已有）

实现：`src/lib/wuyinContextLine.ts`，单测覆盖各 mood。

### 3.2 作息阶段文案

| phaseLabel | 主文案示例 |
|------------|------------|
| before_gate | 还有 {n}，今晚可以在 {gate} 左右开始收工。 |
| wind_down | 现在是「收工段」（亥时参考），少屏幕、少进食正好。 |
| sleep_window | 参考入睡窗口是 {onset} 前后，尽量靠近你的个人节奏。 |
| late | 已经过了参考入睡时间；若还醒着， dim 屏幕、做两次慢呼吸也好。 |

---

## 4. 视觉规范（继承 v2）

| 元素 | 五音 | 作息 |
|------|------|------|
| 主 accent | blush/coral `#F1C6CD` / `#DD7C64` | teal `#63AD96` |
| 五音色 | 宫黄、商白、角青、徵红、羽黑（**低饱和**） | — |
| 动画 | BreathingGuide 圆环；`prefers-reduced-motion` 关闭 | now 竖线 subtle pulse |
| 印章 | ToneStamp 48px，-6° 旋转 | — |

---

## 5. 数据 / 引擎改动

| 任务 | 文件 | 说明 |
|------|------|------|
| contextLine | 新建 `wuyinContextLine.ts` | mood + weather → 副标题 |
| circadian 扩展 | `tcmCircadian.ts` | minutesUntilGate, phaseLabel, personalizationHint |
| 类型 | `types/tcm.ts` | 扩展 `PersonalCircadianPlan` |
| ToneStamp | 新建 `ToneStamp.tsx` | 五音汉字印章 |
| MiniTimeline | 新建 `CircadianMiniTimeline.tsx` | 18–01 区段 |
| 卡片重构 | `WuyinSessionCard.tsx`, `CircadianHintCard.tsx` | 2.0 布局 |
| 测试 | `wellness.test.ts` 或新建 | phaseLabel、contextLine |

**不做**：
- 不展示 HRV/睡眠小时数
- 不展示经络病理、Hz 治疗
- 不解析真实 sleep segment XML（R4 以后）

---

## 6. 实施阶段

| Phase | 内容 | 预估 | 依赖 |
|-------|------|------|------|
| **T1** | contextLine + circadian phaseLabel | 1–2h | 无 |
| **T2** | Wuyin 2.0（ToneStamp + 隐喻副标题 + idle 呼吸预览） | 2h | T1 |
| **T3** | Circadian 2.0（MiniTimeline + 亥/子软标签 + 阶段文案） | 2h | T1 |
| **T4** | **展开层**（五音详情 + 全时间轴 + 算法说明折叠） | 3h | T2, T3 |
| **T5** | 静态说明页「了解五音与文献」 | 1h | 可选 |

建议顺序：**T1 → T2 ∥ T3 → T4**。

---

## 7. 验收标准

### 五音
- [ ] idle 态能回答「为什么是这音」（1 句 context，无数值）
- [ ] idle 态 **默认 loop** 缩略呼吸圆环（reduced-motion 时静态）
- [ ] 练习中圆环与 humPattern 一致
- [ ] disclaimer 保留；无 Hz 治疗文案

### 作息
- [ ] 能看见 **现在时刻** 与两个锚点的相对位置
- [ ] 主文案随时间段变化（非固定套话）
- [ ] confidence low 时有 **人话** 解释（近 N 天数据）
- [ ] 无「胆经不通」「褪黑素监测」

---

## 8. 执行指令

见 [CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md) Phase 2 步骤 2.3–2.4。

---

## 9. 已确认决策（2026-06-16）

| 决策点 | 用户选择 | 实施含义 |
|--------|----------|----------|
| **D1 文化深度** | **软露出** | 时间轴旁小字「亥时参考 / 子时参考」+ 白话 `modernProxy`；不出现经络病理 |
| **D2 五音因果** | **1 句隐喻** | 展示 mood + bodyWeather → 推荐此音的一句人话（无数值、无诊断） |
| **D3 交互深度** | **卡片 + 展开** | Phase 1 做 A 级信息加厚；Phase 2 做 B 级 accordion/轻 overlay 详情 |
| **D4 idle 呼吸动画** | **A：默认 loop** | idle 态显示缩略 BreathingGuide 循环动画（opacity ~50%）；`prefers-reduced-motion` 关闭 |

**实施顺序修订**：T1 → T2 + T3（卡片 2.0）→ **T4 展开层**（非可选，纳入主路径）。

### 9.1 展开层范围（D3 细化）

**五音展开**：
- 五行色环 + `emotionLabel` 白描（「思/虑」非「脾病」）
- 2–3 条 mood 推断隐喻（userFacing，过滤 ruleId）
- 完整 humPattern 分步说明

**作息展开**：
- 完整 `CircadianTimeline`（24h，高亮 18:00–01:00）
- 点击时辰 → modernProxy 白话（wind_down / sleep_gate）
- 「窗口怎么算的」折叠：近 14 天平均 + fallback + confidence

---

*五音与作息板块方案 · 2026-06-16*
