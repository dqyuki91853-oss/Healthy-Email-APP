# 文档索引 — subhealth-monitor

> **给 Claude Code**：从 **[CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md)** 开始，按 Phase 顺序实施。  
> 全文纯文字规格，不依赖任何图片。

---

## 一、实施计划（按优先级）

| 文档 | 范围 | 优先级 |
|------|------|--------|
| [CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md) | **总路线图**：Phase 0→4 执行顺序 | ★ 入口 |
| [HOMEPAGE_REDESIGN_v3.md](./HOMEPAGE_REDESIGN_v3.md) | **最新首页**：来信放大 + 人文大 Section + 歌单/白噪音 | **P0** |
| [HOMEPAGE_REDESIGN.md](./HOMEPAGE_REDESIGN.md) | v2：抽信动画、分数统一、chartNormalize | 继承 |
| [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) | 天气动画、饮食追问 dedup、来信刷新策略 | P0–P1 |
| [TCM_SECTIONS_PLAN.md](./TCM_SECTIONS_PLAN.md) | 五音 / 作息内容深化 | P1–P2 |
| [WUYIN_AUDIO_SOURCES.md](./WUYIN_AUDIO_SOURCES.md) | 五音 CC0 本地歌单方案 | P1 |
| [PERSONAL_MAC_APP.md](./PERSONAL_MAC_APP.md) | **私人 Mac App**（Tauri，不上架） | 工具链 |
| [APP_DIET_FOLLOWUP_PLAN.md](./APP_DIET_FOLLOWUP_PLAN.md) | **App 饮食智能追问**（混合 LLM、2 轮、落库） | **P0** |

---

## 二、产品与视觉基准

| 文档 | 内容 |
|------|------|
| [../DESIGN_OVERHAUL_V2.md](../DESIGN_OVERHAUL_V2.md) | 全站布局、四 Tab、色板、来信产品原则 |
| [WELLNESS_RESEARCH_AND_DESIGN.md](./WELLNESS_RESEARCH_AND_DESIGN.md) | 文献依据 + 身体天气 / 五音 / 作息设计方案 |
| [WELLNESS_IMPLEMENTATION.md](./WELLNESS_IMPLEMENTATION.md) | 已实现引擎与组件代码索引 |

---

## 三、规则与文献（后台 / 引擎）

| 文档 | 对应代码 |
|------|----------|
| [body-weather-rules.md](./body-weather-rules.md) | `src/engine/bodyWeather.ts` |
| [mood-inference-rules.md](./mood-inference-rules.md) | `src/engine/moodInference.ts` |
| [wuyin-tone-rules.md](./wuyin-tone-rules.md) | `src/engine/wuyinPrescription.ts` |
| [ziwu-liuzhu-rules.md](./ziwu-liuzhu-rules.md) | `src/engine/tcmCircadian.ts` |
| [evidence-bibliography.md](./evidence-bibliography.md) | 文献 ID 与 VERIFIED 状态 |

Apple Watch 绝对阈值（原有体系）：`src/config/metricThresholds.ts`

---

## 四、已确认产品决策（摘要）

| 领域 | 决策 |
|------|------|
| 首页布局 | **v3.1 例图两行**：顶全宽信封；底左人文 + 底右大活动图；**无最近饮食** |
| 饮食入口 | LeftSidebar 最近记录 + Tab「记录」 |
| 读信 | 点击信封 → 屏幕正中抽信动画 → 横格纸全文 |
| 分数 | 唯一来源 `weeklyLetter.score`；禁止 `85 - alertPenalty` |
| 来信刷新 | 同周不自动刷新；周一可 auto；仅手动「重新生成」 |
| 饮食追问 | 同条录音多轮 aspect dedup（分量/克数不重复问） |
| 天气 | A1：卡片 medium 动画 + Hero/Envelope tint |
| 五音 | **歌单/白噪音主区** + 跟哼折叠 secondary；idle 呼吸可选 |
| TCM 文化 | 软露出亥时/子时 + 1 句隐喻因果 + 卡片可展开 |

---

## 五、快速复制指令

```
阅读 docs/CLAUDE_CODE_ROADMAP.md 与 docs/HOMEPAGE_REDESIGN_v3.md，从当前 Phase 继续。
每 Phase 结束：npm test && npm run build
```
