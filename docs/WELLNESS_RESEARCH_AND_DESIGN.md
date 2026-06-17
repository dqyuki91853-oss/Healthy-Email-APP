# 健康人文板块 — 文献依据与设计方案

> **用途**：给 Claude Code / 产品 / 研发的主文档。**先文献、后规则、再 UI。**  
> **项目**：`CC project/subhealth-monitor`  
> **与现有体系关系**：Apple Watch 指标阈值见 `src/config/metricThresholds.ts`；本文档为**新增三大板块**的平行证据链。  
> **版本**：v1.0 · 2026-06-16

---

# 第一部分：文献与证据体系

## 1.1 证据等级（与现有 App 一致）

| 等级 | 含义 | UI 是否展示 | 可用于 |
|------|------|-------------|--------|
| **strong** | 系统综述 / 大样本前瞻 / 指南 | 否（仅后台与高级模式） | 规则阈值、来信语气权重 |
| **moderate** | 单篇 RCT、中等 Meta、Apple 官方技术说明 | 否 | 代理指标、趋势判断 |
| **heuristic** | 专家共识、小样本、可穿戴间接推断 | 否 | 缺数据降级、文案软化 |
| **traditional** | 中医经典与文化阐释，**非现代 RCT** | 仅作「文化参考」标签 | 时辰/五音**仪式与文案**，不作诊断 |

**Apple Watch 数据可靠性**（沿用 `reliability` 字段）：

| 可靠性 | 指标示例 | 对本方案的含义 |
|--------|----------|----------------|
| reliable | RHR、步数、活动能量 | 可与文献绝对阈值或趋势联用 |
| trend_only | HRV SDNN、睡眠时长、手腕温度 | **必须**用个人 42 日基线相对值，禁止展示绝对「正常/异常」 |
| unreliable | 夜间 SpO₂、部分呼吸频率 | 不纳入身体天气主规则 |

---

## 1.2 文献总表（必读清单）

> 实施规则前，建议将下列文献精读摘要填入 `docs/evidence-bibliography.md` 并标 `VERIFIED`。  
> 「支持结论」列写**可写进规则的一句话**，不是临床诊断。

### A. 自主神经 · HRV · 压力（身体天气 + 情绪推断）

| ID | 证据 | 类型 | 完整引用 | 支持结论 | 用于 |
|----|------|------|----------|----------|------|
| **HRV-GUIDE-1996** | strong | 指南 | Task Force of the European Society of Cardiology and the North American Society of Pacing and Electrophysiology. (1996). Heart rate variability: standards of measurement, physiological interpretation, and clinical use. *Circulation*, 93(5), 1043–1065. | SDNN 等 HRV 指标反映自主神经调节；个体间差异大，宜结合情境解读 | BW-*, MOOD-* |
| **HRV-NEURO-2009** | strong | 综述 | Thayer, J. F., & Lane, R. D. (2009). Claude Bernard and the heart–brain connection: Further elaboration of a model of neurovisceral integration. *Neuroscience & Biobehavioral Reviews*, 33(2), 81–88. | 低 HRV 与压力、情绪调节困难相关（群体层面） | BW-overcast, MOOD-anxiety |
| **HRV-CV-2017** | strong | Meta | Hillebrand, S., et al. (2013). Heart rate variability and first cardiovascular event. *International Journal of Cardiology*, 169(1), 14–19. （及后续 CV 风险 HRV 文献） | 低 HRV 与心血管风险升高相关 | 后台评分，**不进用户文案** |
| **HRV-WEAR-2020** | moderate | 验证 | Hernández-Vicente, A., et al. (2022). AI-based HRV from wearables vs ECG. *Sensors*; 及 Apple Watch HRV 与 chest strap 对比类研究 | 消费级 AW HRV **可用于趋势**，不宜单次绝对判断 | 全局 disclaimer；confidence 上限 medium |
| **HRV-RECOVERY-2013** | moderate | 运动 | Plews, D. J., et al. (2013). Training adaptation and heart rate variability. *Sports Medicine*, 43(1), 1–14. | 大强度训练后 HRV 短期下降属正常恢复，非单纯「压力」 | BW-rainbow |

### B. 睡眠 · 静息心率 · 情绪（身体天气 + 情绪推断）

| ID | 证据 | 类型 | 完整引用 | 支持结论 | 用于 |
|----|------|------|----------|----------|------|
| **SLEEP-MORT-2017** | strong | Meta | Yin, J., et al. (2017). Relationship between sleep duration and all-cause mortality. *Journal of Clinical Sleep Medicine*; 及 Cappuccio sleep duration meta-analyses | 睡眠 <6h 与不良结局风险升高（U 形关系） | `SLEEP_SHORT_H=6`；BW-rainy |
| **SLEEP-ANX-2016** | strong | Meta | Baglioni, C., et al. (2016). Sleep and anxiety: A meta-analysis of polysomnographic research. *Sleep Medicine Reviews*, 28, 104–118. | 睡眠剥夺/失眠与焦虑症状显著相关 | MOOD-sleep_anxiety-* |
| **SLEEP-AMYG-2020** | strong | 实验 | Ben Simon, E., et al. (2020). Overanxious and underslept. *Nature Human Behaviour*, 4, 100–110. | 一夜睡眠剥夺可升高次日焦虑反应 | MOOD-sleep_anxiety；来信语气 |
| **RHR-SLEEP-2015** | moderate | 综述 | Mehta, R. K., & Roth, J. J. (2015). Short-term sleep deprivation effects on autonomic function. *Industrial Health* 等 | 睡眠受限时 RHR 可升高 | MOOD-rhr_stress；BW-overcast |
| **SLEEP-FRAG-2008** | moderate | 观察 | Bonnet, M. H., & Arand, D. L. 睡眠碎片化与日间功能 | 觉醒次数多 → 恢复感差 | BW-rainy-02 |

### C. 手腕温度 · 昼夜节律（身体天气薄雾 + 子午流注）

| ID | 证据 | 类型 | 完整引用 | 支持结论 | 用于 |
|----|------|------|----------|----------|------|
| **TEMP-SLEEP-1997** | strong | 生理 | Kräuchi, K., & Wirz-Justice, A. (1994/1997). Circadian rhythm of heat production and heat loss. *Journal of Physiology* 等 | 入睡前后核心/外周温度存在可预测变化 | TCM 代理「准备休息窗口」 |
| **AW-WRIST-TEMP** | moderate | 厂商 | Apple Inc. Apple Watch sleep wrist temperature (Support documentation). | AW 报告**相对基线偏移**，非绝对体温；可用于周期/恢复趋势 | `wristTempDelta`；BW-foggy |
| **CIRCADIAN-2017** | strong | 综述 | Walker, M. *Why We Sleep* 及 Hirshkowitz 成人睡眠时长建议（AASM/SSR 2015） | 成人 7+h 为常用参考区间 | `SLEEP_OK_H=7` |

**禁止声称**：Apple Watch **不能**直接测量褪黑素（DLMO）；规则与 UI **不得**出现「监测到你的褪黑素分泌」。

### D. 语音情绪 + 生理融合

| ID | 证据 | 类型 | 完整引用 | 支持结论 | 用于 |
|----|------|------|----------|----------|------|
| **MOOD-SELF-REPORT** | strong | 方法 | Russell, J. A. (1980). Circumplex model of affect. *Journal of Personality and Social Psychology*. | 自陈情绪为金标准；语音 > 纯生理推断 | voice 覆盖 MOOD-* |
| **STRESS-WEAR-2021** | moderate | 综述 | Can wearable devices measure stress? 类综述（如 Dickerson et al.） | 单传感器 stress 检测准确率有限，宜多模态 | 生理推断 confidence ≤ medium |

### E. 中医 · 子午流注 · 五音（文化 + 现代放松）

| ID | 证据 | 类型 | 完整引用 | 支持结论 | 用于 |
|----|------|------|----------|----------|------|
| **TCM-ZIWU-CLASSIC** | traditional | 经典 | 《黄帝内经·灵枢·经脉》等关于十二时辰与经脉论述 | **文化框架**：21–23 点「收工」、23–1 点「入静」 | 文案、时间轴 UI，**非经络诊断** |
| **TCM-SLEEP-HYGIENE** | moderate | 现代中医 | 睡眠卫生类中医科普与 WHO 睡眠建议的交集 | 「减刺激、固定作息」与 WHO/AASM 一致部分可并用 | CircadianHint 建议语 |
| **TCM-WUYIN-CLASSIC** | traditional | 经典 | 《黄帝内经·素问·五脏生成》等五行、五音、情志论述 | 角徵宫商羽与五脏情志的**传统文化对应** | 五音命名与 UI 仪式 |
| **MUSIC-ANX-2017** | moderate | Meta | Aalbers, S., et al. (2017). Music therapy for depression and anxiety. *Cochrane Database*（需核对最新版） | 音乐干预对焦虑/情绪有**小到中等**效应 | 五音作为「音乐放松练习」而非频率治疗 |
| **HUM-HRV-2013** | moderate | 实验 | Vickhoff, B., et al. (2013). Music structure increases HRV and respiratory sinus arrhythmia. *Frontiers in Psychology*（哼唱/共振） | 哼唱与缓慢呼吸可能增加 RSA/HRV | WuyinSession「跟哼」设计 |
| **BREATH-RELAX-2015** | strong | Meta | Zaccaro, D. J., et al. (2018). Slow breathing and HRV. *Frontiers in Human Neuroscience*. | 慢呼吸降低交感兴奋 | 哼唱模式 inhale-hum-exhale |

**禁止声称**：特定 Hz「共振治愈脏腑」；UI 写「传统文化参考 + 放松练习」。

---

## 1.3 信号 → 阈值 → 规则映射（可执行，待文献 VERIFIED 后锁定）

### 1.3.1 身体天气

| 信号 | 计算 | 文献依据 ID | 建议阈值 | AW 可靠性 |
|------|------|-------------|----------|-----------|
| HRV 偏低 | `hrvSdnn / baseline.mean < 0.85` | HRV-GUIDE-1996, HRV-NEURO-2009 | 0.85 / 0.70 两档 | trend_only |
| RHR 偏高 | `restingHr - baseline.mean ≥ 5` | RHR-SLEEP-2015, metricThresholds | +5 / +8 bpm | reliable |
| 睡眠偏短 | `sleepHours < 6` | SLEEP-MORT-2017, metricThresholds | 6h / 7h | trend_only |
| 睡眠碎片化 | `awakeEpisodes ≥ 5` | SLEEP-FRAG-2008 | ≥5 次/夜 | trend_only |
| 运动后恢复 | 昨日 `exerciseMin≥45` 且 HRV↓ | HRV-RECOVERY-2013 | 45 min | reliable |
| 手腕温偏移 | `wristTempDelta ≥ 0.3°C` | AW-WRIST-TEMP, metricThresholds | 0.3 / 0.5 | trend_only |

**天气状态与组合逻辑**：见 `docs/body-weather-rules.md`（已实现引擎 `src/engine/bodyWeather.ts`）。

### 1.3.2 情绪推断（无语音时）

| 规则 | 条件 | 文献 ID | 输出 mood | 置信度上限 |
|------|------|---------|-----------|------------|
| 睡眠-焦虑 | 睡 <6h 且 HRV↓ | SLEEP-ANX-2016, BEN-SLEEP-AMYG | anxiety | medium |
| RHR-紧张 | RHR 连续 2 日 ≥基线+8 | RHR-SLEEP-2015 | anxiety | medium |
| 运动后疲惫 | 昨日大运动量 + HRV↓ | HRV-RECOVERY-2013 | fatigue | medium |
| 语音覆盖 | 用户记录「焦虑/低落/易怒」 | MOOD-SELF-REPORT | 对应 tag | high |

**前台表述**：用「身体有点像心里下着小雨」，**禁止**「你有焦虑症/抑郁症」。

### 1.3.3 子午流注（代理指标）

| 概念 | 现代代理 | 文献 | 能否从 AW 直接得到 |
|------|----------|------|-------------------|
| 个人入睡窗口 | 14 日 sleep segment 中位数；fallback 23:00 | TEMP-SLEEP-1997, CIRCADIAN-2017 | ⚠️ 需解析 XML 的 sleep start；日聚合仅 heuristic |
| 准备休息窗口 | 入睡时刻 − 90min | TCM-ZIWU-CLASSIC + Kräuchi | heuristic |
| 褪黑素 | — | — | **否** |

### 1.3.4 五音处方

| moodTag | 五音 | 传统文化 ID | 现代支持 ID | 练习形式 |
|---------|------|-------------|-------------|----------|
| anxiety | 徵 | TCM-WUYIN-CLASSIC | MUSIC-ANX-2017, BREATH-RELAX | 90s 跟哼 + 慢呼吸 |
| low_mood | 商 | TCM-WUYIN-CLASSIC | MUSIC-ANX-2017 | 长呼气哼鸣 |
| irritable | 角 | TCM-WUYIN-CLASSIC | BREATH-RELAX | 短哼 6 轮 |
| fatigue | 宫 | TCM-WUYIN-CLASSIC | HUM-HRV-2013 | 低长哼 |

参考频率（象征用）：角 293.66Hz / 徵 329.63Hz 等 — 见 `src/config/wuyinToneMap.ts`。

---

## 1.4 文献调研待办（Research Checklist）

- [ ] 核对 Yin/Cappuccio 睡眠 Meta 最新版，锁定 6h/7h 阈值引用页码  
- [ ] 检索 2020–2025 Apple Watch HRV validation（Series 8–9）更新 HRV-WEAR  
- [ ] Cochrane music therapy 是否有 2024 更新版  
- [ ] 确认 Ben Simon 2020 效应量，写入 MOOD 规则权重说明  
- [ ] 法务审阅：traditional 类文献在 App Store 健康类目的表述边界  
- [ ] 所有 ID 回填 `docs/evidence-bibliography.md` 状态 → VERIFIED  

---

# 第二部分：产品设计方案

## 2.1 设计原则（与 v2 产品一致）

1. **用户只见「天气 + 来信 + 练习」**，不见 HRV 78、证据链、经络诊断。  
2. **来信是第一输出**；身体天气、五音、作息是来信与首页的**情感包装**。  
3. **东方元素 = 仪式与隐喻**，每个入口带一句 disclaimer。  
4. **布局**遵循 `DESIGN_OVERHAUL_V2.md`（宽左栏 Dashboard + 4 Tab），本方案只描述**新增模块**在其中的位置。

---

## 2.2 信息架构

```
首页 /
├── 身体天气卡片（首屏，一句隐喻）
├── Hero（综合分 + 天气副文案）
├── 每周健康来信（含 weather opener + 饮食/表扬）
├── Messages（饮食记录）
├── 本周概况（4 环）
├── Weekly Activity（折线，无 22 指标网格）
├── [可选] 五音练习卡片（有 mood 且非 calm 时）
└── [可选] 东方作息提示条（折叠，默认展开一行）

记录 /voice-log
└── 语音 + 追问（气泡 UI）

数据 /dashboard
└── 仅 Weekly Activity + 三均值（步数/睡眠/运动）

设置 /settings
├── 导入 Apple Health
├── API Key
├── 开关：东方作息参考 / 五音练习 / 高级数据（默认关）
└── Disclaimer 全文
```

**不出现在主导航**：睡眠/心脏/代谢分析页、预警中心、雷达图（高级模式可选）。

---

## 2.3 UI 设计 — 板块 1：身体天气

### 2.3.1 用户目标

打开 App **第一眼**知道「今天身体像什么天气」，而不是「压力指数 78」。

### 2.3.2 组件

| 组件 | 位置 | 规格 |
|------|------|------|
| **BodyWeatherCard** | 首页 Hero 上方 |  cream 浅底；左：WeatherStamp 64px；右：标题「今天你的身体是{label}」+ metaphor 14px muted |
| **WeatherStamp** | 新来信 Modal 邮筒角 | 虚线圆角框、-8° 旋转、两汉字缩写（阴雨→「阴雨」） |
| **BodyWeatherScene**（可选 Phase 2） | 卡片背景 | SVG 分层：晴/云/雨/雾/彩虹；CSS 动画；`prefers-reduced-motion` 关闭动画 |

### 2.3.3 六种天气视觉

| weatherId | 主色 | 图标 | 动画（可选） |
|-----------|------|------|--------------|
| sunny | `#63AD96` | Sun | 慢速光晕 |
| partly_cloudy | `#EBC97F` | CloudSun | 云 drift |
| overcast | `#8A8A8A` | Cloud | 静态 |
| rainy | `#6B8CAE` | CloudRain | 雨丝 3 层 |
| foggy | `#B0A8A0` | CloudFog | opacity 呼吸 |
| rainbow | `#DD7C64` | Rainbow | 弧光 fade-in |

### 2.3.4 与来信联动

- `weeklyLetter` 开头**必须**融入 `bodyWeather.letterOpener`（已实现 `prependWellnessOpener`）。  
- 示例：「今天外面下雨，你的身体里也是——我们撑伞慢慢走就好。」  
- Modal 文案不变，仅加印章。

### 2.3.5 禁止

- 不展示 HRV/RHR 数字、不展示 ruleId、不展示「压力指数」。

---

## 2.4 UI 设计 — 板块 2A：子午流注作息

### 2.4.1 用户目标

获得**个人化**「今晚大概几点该准备休息」，而非背十二经络表。

### 2.4.2 组件 **CircadianHintCard**

```
┌─ 东方作息参考 ─────────────────────────────┐
│ 左 teal 竖条 4px                              │
│ 建议语 14px（1–2 句，无「胆经不通」）          │
│ 副信息 12px muted：准备休息 21:45 · 参考入睡 23:15 │
│ 10px disclaimer：传统文化参考，非医疗建议       │
└──────────────────────────────────────────────┘
```

### 2.4.3 可选 **CircadianTimeline**（Phase 2）

- 横向 24h 条，仅高亮 **21:00–01:00** 区段；当前时刻竖线。  
- 点击时辰弹出 `modernProxy` 白话建议，**不弹**经络病理。

### 2.4.4 设置

- Toggle「显示东方作息参考」（默认开）。  
- 关则隐藏 CircadianHintCard。

---

## 2.5 UI 设计 — 板块 2B：五音疗疾

### 2.5.1 用户目标

在焦虑/疲惫时完成 **60–90 秒**哼唱练习，不是听歌单。

### 2.5.2 展示条件

| 条件 | 显示 |
|------|------|
| `mood.dominant` 为 anxiety / low_mood / irritable / fatigue | WuyinSessionCard |
| calm 或 unknown（且无 voice 焦虑） | 不显示或仅 unknown 时 60s 宫音 |
| `rainbow` + fatigue | 隐藏（恢复日不推音疗） |

### 2.5.3 组件 **WuyinSessionCard**

```
┌─ 今日音疗 · 放松练习 ────────────────────────┐
│ [Music 图标]  徵音 · 心                        │
│ 说明 14px：找到「徵」音，轻轻哼…               │
│ disclaimer 12px muted                          │
│ [试听参考音]  [开始哼唱 90s]                   │
│ 进行中：剩余 73s  [停止]                       │
└──────────────────────────────────────────────┘
```

- 音频：Web Audio sine，volume 0.15，fade in/out（`audioTone.ts`）。  
- 完成后：可选 toast「练习完成」；来信下次可提一句表扬。

### 2.5.4 设置

- Toggle「启用五音放松练习」（默认开）。  
- Footer link「了解五音与文献」→ 静态说明页（traditional + MUSIC-ANX 摘要，无 Hz 治疗宣称）。

---

## 2.6 首页整体线框（含新板块）

```
┌─ LeftSidebar 280px ─┬─ Main ────────────────────────────────────┐
│ 头像 / 日历 / 记录   │ [BodyWeatherCard]                            │
│ FAB +               │ [HeroBanner: 欢迎 + 分 + 天气副文案]          │
│                     │ ┌─ WeeklyLetter ────────┬─ Messages ─────┐  │
│                     │ └───────────────────────┴────────────────┘  │
│                     │ [WuyinSessionCard] 若 mood 匹配              │
│                     │ [CircadianHintCard]                          │
│                     │ [SkillsRings 2×2]                            │
│                     │ [WeeklyActivitySection]                      │
└─────────────────────┴──────────────────────────────────────────────┘
```

Mobile：左栏折叠；天气卡片全宽；FAB 右下；BottomNav 4 Tab。

---

## 2.7 视觉规范（继承 v2 色板）

| Token | Hex | 新板块用途 |
|-------|-----|------------|
| teal | `#63AD96` | 晴、主按钮、作息竖条 |
| gold/cream | `#F8E9BB` / `#EBC97F` | Hero、多云 |
| coral | `#DD7C64` | 彩虹、五音图标底 |
| blush | `#F1C6CD` | 五音卡片图标底 |
| rain blue | `#6B8CAE` | 阴雨天气 |

字体：正文 Plus Jakarta Sans 15px；来信 1.65 行高；disclaimer 10–12px muted。

---

## 2.8 文案规范

| 场景 | 推荐 | 禁止 |
|------|------|------|
| 天气 | 「今天你的身体是阴天」 | 「HRV 低于基线 15%」 |
| 情绪 | 「心里有点像下着小雨」 | 「诊断：焦虑症」 |
| 作息 | 「建议 21:45 开始准备休息」 | 「你的胆经当令异常」 |
| 五音 | 「徵音 · 放松练习 90 秒」 | 「329Hz 治疗心脏」 |

---

## 2.9 实施阶段（给 Claude Code）

| 阶段 | 内容 | 依赖 |
|------|------|------|
| **R0** | 文献 VERIFIED + 阈值锁定 | 第一部分 checklist |
| **R1** | 引擎（已实现）+ 单元测试 | `docs/WELLNESS_IMPLEMENTATION.md` |
| **R2** | 首页 UI 挂载（已实现） | 本文 2.3–2.6 |
| **R3** | BodyWeatherScene 动画 | 设计 2.3.3 |
| **R4** | CircadianTimeline + sleep segment 解析 | TEMP-SLEEP 文献 + parser |
| **R5** | 五音说明静态页 + Settings 开关 | MUSIC-ANX 摘要 |
| **R6** | 高级模式展示 debugFactors / citationIds | 仅设置内 |

---

## 2.10 验收标准

- [ ] 每条规则在 `evidence-bibliography` 有对应 VERIFIED 文献  
- [ ] 用户首屏无数值型 HRV/压力分/经络诊断  
- [ ] 来信开头含天气 opener；Modal 含 WeatherStamp  
- [ ] 五音卡片含 disclaimer；无 Hz 治疗文案  
- [ ] 作息卡片含 disclaimer；无褪黑素/经络不通表述  
- [ ] `npm test` + `npm run build` 通过  

---

## 附录：文档索引

| 文档 | 内容 |
|------|------|
| **本文** | 文献 + 设计方案（主入口） |
| `docs/evidence-bibliography.md` | 文献 ID 状态登记 |
| `docs/body-weather-rules.md` | 天气规则表 |
| `docs/mood-inference-rules.md` | 情绪规则表 |
| `docs/wuyin-tone-rules.md` | 五音规则表 |
| `docs/ziwu-liuzhu-rules.md` | 作息规则表 |
| `docs/WELLNESS_IMPLEMENTATION.md` | 代码实现说明 |
| `DESIGN_OVERHAUL_V2.md` | 全站布局与来信产品 |
| `src/config/metricThresholds.ts` | 原有 AW 指标阈值 |

---

*给 Claude Code：先完成第一部分 1.4 文献 VERIFIED，再按第二部分 2.9 阶段实施；规则数值以 1.3 为准，UI 以 2.3–2.6 为准。*
