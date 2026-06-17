# Claude Code 总路线图

> **项目**：`CC project/subhealth-monitor`  
> **原则**：先修行为 bug → 首页结构 → 板块体验 → 视觉增强  
> **详细规格**：各 Phase 链到对应文档章节，本文只列顺序与验收。

---

## Phase 0 — 首页骨架（P0）

**文档**：[HOMEPAGE_REDESIGN_v3.md](./HOMEPAGE_REDESIGN_v3.md)（布局）· [HOMEPAGE_REDESIGN.md](./HOMEPAGE_REDESIGN.md)（抽信/分数）

| 步骤 | 任务 | 关键文件 |
|------|------|----------|
| 0.1 | 分数统一（若未完成） | `weeklyScore.ts` |
| 0.2 | 两行布局：顶全宽信封 + 底 40/60；**去掉 Messages** | `HomeDashboard.tsx`, `HomePage.tsx` |
| 0.3 | `EnvelopeStage` 顶行全宽放大 | `EnvelopeStage.tsx` |
| 0.4 | `WellnessSection` + `CircadianStrip` | 新建 |
| 0.5 | 五音歌单/白噪音 + `WuyinPanel` | config + components |
| 0.6 | Activity `variant="panel"` 大图 | `WeeklyActivitySection.tsx` |
| 0.7 | `LetterRevealOverlay` 核对 | 已有则跳过 |

**验收**：例图两行；无首页饮食；左栏可看最近记录。

---

## Phase 1 — 来信与追问（P0）

**文档**：[IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) §3、§2

| 步骤 | 任务 | 关键文件 |
|------|------|----------|
| 1.1 | `setCachedLetter` + `shouldAutoRefreshForNewWeek` | `weeklyLetter.ts` |
| 1.2 | store 持久来信；同周切页不 regenerate | `useAppStore.ts`, `useWeeklyLetter.ts` |
| 1.3 | 移除 `addVoiceLog` 等 auto bump version | `useAppStore.ts` |
| 1.4 | `followUpAspect.ts` + `buildStableKey` 多轮 dedup | 新建；`VoiceRecorder.tsx` |
| 1.5 | 单元测试：第二轮不出现分量/克数重复 | `followUpAspect.test.ts` |

**验收**：首页↔数据页来信不变；同条录音二轮不重复 aspect；周一 auto 刷新。

---

## Phase 2 — 首页体验补全（P1）

**文档**：[HOMEPAGE_REDESIGN.md](./HOMEPAGE_REDESIGN.md) §5–6、[TCM_SECTIONS_PLAN.md](./TCM_SECTIONS_PLAN.md)

| 步骤 | 任务 | 关键文件 |
|------|------|----------|
| 2.1 | `chartNormalize.ts` + Activity monotone 归一化曲线 | `WeeklyActivitySection.tsx` |
| 2.2 | `SkillsRings layout="vertical"` | `SkillsRings.tsx` |
| 2.3 | TCM T1：`wuyinContextLine` + circadian `phaseLabel` | `wuyinContextLine.ts`, `tcmCircadian.ts` |
| 2.4 | TCM T2–T3：Wuyin/Circadian compact + 展开层 | TCM 组件 |
| 2.5 | Wuyin idle 呼吸 loop（D4 已确认） | `WuyinSessionCard.tsx` |

**验收**：运动/睡眠线有起伏；Tooltip 真值；五音/作息可展开且不被裁切。

---

## Phase 3 — 天气视觉（P1）

**文档**：[IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) §1

| 步骤 | 任务 | 关键文件 |
|------|------|----------|
| 3.1 | `BodyWeatherCard` min-height 160px；scene opacity 0.38 | `BodyWeatherCard.tsx` |
| 3.2 | Scene 动画增强（overcast/rainy 等） | `BodyWeatherScene.tsx` |
| 3.3 | EnvelopeStage / Overlay weather tint 联动 | `EnvelopeStage.tsx` |

**验收**：六种天气动画肉眼可辨；仍无 HRV 数字。

---

## Phase 4 — 可选（P2）

- 跨会话 `followUpMemory`（IMPROVEMENT_PLAN §2.4 P2）
- Activity 堆叠柱备选 variant
- BodyWeather 点击展开 overlay
- 五音 / 作息静态说明页

---

## 每 Phase 结束

```bash
npm test && npm run build
```

---

## 文档地图

```
CLAUDE_CODE_ROADMAP.md  ← 你在这里
├── HOMEPAGE_REDESIGN_v3.md  首页 v3（最新布局）
├── HOMEPAGE_REDESIGN.md     首页 v2（抽信/分数/图表）
├── IMPROVEMENT_PLAN.md      天气、追问、来信
├── TCM_SECTIONS_PLAN.md     五音、作息内容
├── DESIGN_OVERHAUL_V2.md    全站视觉与产品
└── WELLNESS_RESEARCH_AND_DESIGN.md  文献与设计语义
```
