# 首页改版方案 v3 — 来信优先 + 人文大板块

> **读者**：Claude Code  
> **项目**：`CC project/subhealth-monitor`  
> **版本**：v3.1 · 2026-06-16  
> **布局参考**：Soft UI Dashboard（大 Welcome 横幅 + 左下 Skills 列表 + 右下 Weekly Activity 大图）；**不含**例图右上角 Messages  
> **替代关系**：布局以 **本文为准**；v2 细节（抽信动画、分数统一、chartNormalize）继续有效  
> **关联**：[HOMEPAGE_REDESIGN.md](./HOMEPAGE_REDESIGN.md) · [TCM_SECTIONS_PLAN.md](./TCM_SECTIONS_PLAN.md)

---

## 0. 变更摘要

| 模块 | v2 | v3.1 |
|------|----|------|
| **信件 / 信封** | 中栏 42% | **顶行全宽**，等同例图 Welcome 横幅，最大 |
| **五音 + 作息** | 两枚小 pocket | **底行左**：合并 `WellnessSection`（等同 Top Skills 位，55% 宽度） |
| **五音内容** | 跟哼为主 | **歌单/白噪音主区**；跟哼 **折叠** |
| **东方作息** | 独立大卡 | Section 内 **CircadianStrip** 窄条 |
| **最近饮食** | 右栏 Messages | **首页移除**（左栏 Sidebar「最近记录」保留） |
| **本周活动** | 右栏 sparkline | **底行右**：**紧凑折线图**（45% 宽度，等同例图 Weekly Activity） |

**产品重心**：来信 >> 人文练习 >> 活动趋势。饮食入口：**LeftSidebar 最近记录** + FAB + `/voice-log`。

---

## 1. 新布局 — 例图两行式 `HomeDashboardV3`

### 1.1 参考图 → 本 App 映射

| 例图区域 | 本 App | 说明 |
|----------|--------|------|
| Welcome 黄色大横幅 | **`EnvelopeStage` 顶行全宽** | 主 CTA：点击开信 |
| ~~Messages 右上~~ | **（删除）** | 不在 Main Content 重复饮食 |
| Top Skills 左下竖卡 | **`WellnessSection`** | 五音歌单 + 作息 Strip |
| Weekly Activity 右下大图 | **`WeeklyActivitySection` large** | 多色曲线 + Legend |
| LeftSidebar 资料/日历/任务 | **`LeftSidebar`（已有）** | 含「最近记录」5 条 |

### 1.2 Desktop（≥1024px）线框

```
┌ LeftSidebar 280px ─┬─ Main Content ──────────────────────────────────────────┐
│  资料 / 月历        │ [CompactWeatherStrip]  高 40px                          │
│  最近记录 (≤5)      │ ┌─ ROW-HERO 全宽 ─────────────────────────────────────┐ │
│  FAB +              │ │  EnvelopeStage v3  LARGE                              │ │
│                     │ │  cream/weather 渐变 · 信封居中 · 邮戳+分              │ │
│                     │ │  min-height: 36% 视口  (~240–300px)                   │ │
│                     │ └───────────────────────────────────────────────────────┘ │
│                     │ ┌─ ROW-BODY grid 55% / 45% ─────────────────────────────┐ │
│                     │ │ WellnessSection      │ WeeklyActivitySection       │ │
│                     │ │ 「今日身心练习」       │ 「本周活动 / Weekly Activity」│ │
│                     │ │ WuyinPanel + Strip   │ 多线 monotone  chart        │ │
│                     │ │ min-h ~220px         │ h ~220px + Legend           │ │
│                     │ └──────────────────────┴───────────────────────────────┘ │
└─────────────────────┴──────────────────────────────────────────────────────────┘
```

**一屏约束**：`height: calc(100vh - 100px)`；`overflow: hidden`；仅 Section 内部可 scroll。

### 1.3 Grid CSS

```css
.home-v3 {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 100px);
  overflow: hidden;
}

.row-hero {
  flex: 0 0 auto;
  min-height: min(300px, 38vh);
}

.row-body {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(320px, 55fr) minmax(260px, 45fr);
  gap: 16px;
}

.wellness-section-v3 {
  min-height: 200px;
  overflow-y: auto;          /* 内容多时在 Section 内滚，不裁切按钮 */
  display: grid;
  grid-template-columns: 1fr minmax(130px, 30%);
  gap: 12px;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 4px 24px rgba(44,44,44,0.06);
}

.activity-panel-v3 {
  min-height: 0;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 20px 24px;
  box-shadow: 0 4px 24px rgba(44,44,44,0.06);
  display: flex;
  flex-direction: column;
}
```

### 1.4 视觉权重

| 区域 | 主内容区面积 |
|------|-------------|
| EnvelopeStage（顶行） | **~38%** |
| WellnessSection | **~34%**（五音 + 作息横向展开） |
| Weekly Activity | **~28%**（紧凑图） |

### 1.5 Mobile（<1024px）

单列 stack，允许页面 scroll：

`WeatherStrip → EnvelopeStage → WellnessSection → WeeklyActivity`

---

## 2. 信件区 — EnvelopeStage（顶行全宽）

继承 v2 抽信逻辑；尺寸升级：

```
宽度：100%（ROW-HERO）
min-height: 240px（mobile）/ 280px（desktop）/ 320px（≥1440px）
布局：横向 flex — 左信封插画 · 中文案 · 右 ScoreRing 72px
背景：weather tint 渐变（例图 Welcome 黄横幅的视觉权重）
click → LetterRevealOverlay
分数：getDisplayWeeklyScore(letter) 唯一来源
```

---

## 3. 人文大 Section — `WellnessSection`（底行左，例图 Top Skills 位）

```
┌─ 今日身心练习 ──────────────────────────────────────────────┐
│  ┌─ WuyinPanel ~70% ──────────────┐ ┌ CircadianStrip ~30% ─┐ │
│  │ 歌单/白噪音横滑 + mini player   │ │ 现在·轴·一句建议      │ │
│  │ ▼ 跟哼练习（折叠）              │ │ [展开详情]            │ │
│  └────────────────────────────────┘ └───────────────────────┘ │
│  disclaimer 10px                                              │
└───────────────────────────────────────────────────────────────┘
```

- 五音、作息 **同一白卡**，非两个 NestedPocket
- `overflow-y: auto`；**禁止** `maxHeight` + `overflow: hidden` 裁切

五音 / 作息 / 歌单 / 折叠跟哼规格见 **§4–5**（与 v3.0 相同，不重复删减）。

---

## 4. 五音 — 歌单 / 白噪音为主（摘要）

| Primary | 横滑 `WuyinAudioCarousel` + `WuyinMiniPlayer` |
| Secondary | `WuyinHumFoldout` 折叠：试听 + 哼唱 60s |
| 数据 | `wuyinAudioLibrary.ts` + `recommendWuyinAudio()` |
| 素材 | `public/audio/` 免版权 loop / ambient |

---

## 5. 东方作息 — CircadianStrip（摘要）

Section 右窄条：now + 迷你轴 36px + 21:30/23:00 + 一句 phase 文案；详情 accordion 展开。

---

## 6. 本周活动 — 底行右大图（例图 Weekly Activity）

**移除** sparkline 侧栏形态；恢复 **主内容区大 chart**。

```
容器：activity-panel-v3，占 ROW-BODY 60%
标题行：左「本周活动 / Weekly Activity」· 右 range pills（7/14/30 天，同现组件）
图表：ResponsiveContainer height 220px（紧凑列宽适配）
线条：步数 #63AD96 · 睡眠 #EBC97F dashed · 运动 #DD7C64
type="monotone" + chartNormalize（小数值仍有起伏）
Legend：底部色点 + 标签（例图样式）
Tooltip：真实单位
```

改造 `WeeklyActivitySection` prop：`variant="panel"`（默认首页）| `variant="compact"`（仅 dashboard 若需要）。

**首页不再使用** `MessagesWidget` / `SideStackCompact` / `DashboardPanel`。

---

## 7. 最近饮食 — 首页移除

| 项 | 处理 |
|----|------|
| Main Content `MessagesWidget` | **删除** |
| `HomePage` colFeed | **删除**；`HomeDashboard` 改为单行 hero + body |
| 用户看饮食 | `LeftSidebar` 最近记录 · Mobile FAB · Tab「记录」`/voice-log` |
| `MessagesWidget.tsx` | 保留文件，**不在 HomePage 引用**（或仅 `/dashboard` 可选） |

---

## 8. 组件树（v3.1）

```
HomePage
├── CompactWeatherStrip
├── HomeDashboardV3
│   ├── row-hero → EnvelopeStage v3
│   └── row-body
│       ├── WellnessSection
│       │   ├── WuyinPanel
│       │   └── CircadianStrip
│       └── WeeklyActivitySection variant="panel"
└── LetterRevealOverlay
```

**删除首页**：`colFeed` · `DashboardPanel` · `MessagesWidget` · `SideStackCompact` · `SkillsRings`（可选仅 dashboard）

---

## 9. 工程任务

| Phase | 任务 | 文件 |
|-------|------|------|
| **V3-0** | `HomeDashboardV3` 两行布局（hero + body 40/60） | `HomeDashboard.tsx`, `HomePage.tsx` |
| **V3-0b** | 移除 Messages / colFeed | `HomePage.tsx` |
| **V3-1** | EnvelopeStage 顶行全宽放大 | `EnvelopeStage.tsx` |
| **V3-2** | `WellnessSection` + CircadianStrip | 新建 |
| **V3-3** | 五音音频库 + WuyinPanel | config + components |
| **V3-4** | Activity `variant="panel"` 大图 | `WeeklyActivitySection.tsx` |

---

## 10. 验收清单

### 布局（例图）
- [ ] 顶行 **仅信封**，全宽，视觉最大
- [ ] 底行 **左人文 + 右活动图**，约 40/60
- [ ] 首页 **无**「最近饮食」区块
- [ ] 饮食仍可从 **左栏最近记录** 进入

### 内容
- [ ] 五音歌单/白噪音可见；跟哼在折叠内
- [ ] 活动图 h≥240，三线 + Legend，normalize 起伏
- [ ] 抽信动画、分数统一、同周不刷来信（v2）

---

## 11. 已确认决策

| ID | 决策 |
|----|------|
| L1 | 视觉：**来信（顶全宽）>> 人文左下 >> 活动右下** |
| L2 | 五音：歌单/白噪音 primary，跟哼折叠 |
| L3 | 作息：CircadianStrip 窄条 |
| **L6** | **首页去掉最近饮食**；饮食走 Sidebar + 记录 Tab |
| L7 | 活动图：**大图 panel**，非 sparkline |

---

## 12. Claude Code 执行指令

```
阅读 docs/HOMEPAGE_REDESIGN_v3.md v3.1。

V3-0：HomeDashboard 改为 row-hero + row-body(40/60)；删除 Messages/colFeed
V3-1：EnvelopeStage 顶行全宽
V3-2~3：WellnessSection + WuyinPanel + CircadianStrip
V3-4：WeeklyActivitySection variant="panel" 高 240–280

继承 v2：LetterRevealOverlay、weeklyScore、禁止 TCM 裁切。

npm test && npm run build
```

---

## 13. 相关文件

| 改造 | 删除首页引用 |
|------|-------------|
| `HomeDashboard.tsx` → 两行布局 | `MessagesWidget` |
| `HomePage.tsx` | `DashboardPanel` / `colFeed` |
| `EnvelopeStage.tsx` | `SideStackCompact` |
| `WellnessSection.tsx`（新） | |
| `WeeklyActivitySection.tsx` | |

---

*首页改版方案 v3.1 · 2026-06-16*
