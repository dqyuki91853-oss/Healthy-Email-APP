# 首页改版方案

> **读者**：Claude Code  
> **项目**：`CC project/subhealth-monitor`  
> **关联**：[CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md) Phase 0–2

---

## 1. 目标

| 目标 | 说明 |
|------|------|
| 信封为主体 | 中栏 `EnvelopeStage` 为视觉中心，等同参考 Dashboard 的 Welcome 横幅位 |
| 一屏看全 | Desktop：`calc(100vh - 120px)`，`overflow: hidden`；LeftSidebar + 中栏 + 右栏 |
| 套中套 | 右栏 beige `DashboardPanel` 内嵌白 `NestedPocket`；禁止裁切 TCM |
| 读信仪式 | 点击信封 → 屏幕正中抽信动画 → 横格纸全文 |
| 分数一致 | 邮戳 / ScoreRing / 信内 **同一** `weeklyLetter.score` |
| 曲线可读 | 运动/睡眠归一化 + monotone，Tooltip 显示真值 |

---

## 2. 布局（p3 参考）

### 2.1 全页结构

App 已有 **LeftSidebar 280px**（资料 / 月历 / 最近记录）。Main Content 如下：

```
┌ LeftSidebar ─┬─ Main Content ─────────────────────────────────────┐
│              │ [CompactWeatherStrip]  顶行 pill，高 44px          │
│              │ ┌─ COL-MAIN 42% ──────┬─ COL-FEED 58% ────────────┐ │
│              │ │ EnvelopeStage       │ DashboardPanel #F5F0E8    │ │
│              │ │  cream 信封居中      │  ├ Messages pocket       │ │
│              │ │ Wuyin │ Circadian   │  └ Activity pocket      │ │
│              │ │ Skills vertical     │                           │ │
│              │ └─────────────────────┴───────────────────────────┘ │
└──────────────┴────────────────────────────────────────────────────┘
```

### 2.2 参考映射

| 参考元素 | 本 App 组件 |
|----------|-------------|
| Welcome 黄色横幅 | `EnvelopeStage` |
| Top Skills 竖向列表 | `SkillsRings layout="vertical"` |
| Messages | `MessagesWidget` |
| Weekly Activity 曲线 | `WeeklyActivitySection` compact |
| beige 外框 + 内白卡 | `DashboardPanel` + `NestedPocket` |
| 顶栏 filter pills | `CompactWeatherStrip` |

### 2.3 CSS Grid

```css
.home-dashboard {
  display: grid;
  grid-template-columns: minmax(300px, 42fr) minmax(320px, 58fr);
  gap: 16px;
  height: calc(100vh - 120px);
  overflow: hidden;
}
.col-main { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.col-feed { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.envelope-stage { flex: 1 1 auto; min-height: 240px; max-height: 52%; }
.dashboard-panel {
  background: #F5F0E8; border-radius: 28px; padding: 12px;
  flex: 1; display: flex; flex-direction: column; gap: 12px;
}
.tcm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
```

### 2.4 Mobile（<1024px）

单列 stack，允许 scroll：Weather → Envelope → Messages → Wuyin → Circadian → Skills → Activity。

### 2.5 禁止写法

```tsx
// ❌ 导致五音/作息半块不可见
<div className="overflow-hidden" style={{ maxHeight: 200 }}>
  <WuyinSessionCard />
</div>
```

---

## 3. 组件树

```
HomePage
├── CompactWeatherStrip
├── HomeDashboard
│   ├── col-main
│   │   ├── EnvelopeStage → EnvelopeOpen + ScoreRing
│   │   ├── tcm-row → NestedPocket(Wuyin) | NestedPocket(Circadian)
│   │   └── NestedPocket → SkillsRings vertical
│   └── col-feed
│       └── DashboardPanel
│           ├── NestedPocket → MessagesWidget
│           └── NestedPocket → WeeklyActivitySection compact
└── LetterRevealOverlay (portal)
```

### NestedPocket 规格

- 背景 `#FFFFFF`，圆角 20px，padding 14–16px
- `overflow: visible`（不裁切按钮）
- 可选标题：10px uppercase muted

---

## 4. 信封 — EnvelopeOpen（p2）

```
尺寸：desktop 360×220px；mobile 280×180px
信封：#F5F0E8 cream，底部封舌，shadow 0 12px 40px rgba(44,44,44,0.12)
信纸 peek：白底横线，italic「准备好就打开吧。」
左下：To · {nickname}
右下：PostmarkStamp（score + 周日期）+ WeatherStamp sm
hover：translateY(-6px)；click → openLetter()
ScoreRing：56px，= getDisplayWeeklyScore(letter)
```

---

## 5. 读信 — LetterRevealOverlay

替代 `LetterReaderSheet`（不再用右侧抽屉）。

**容器**：`fixed inset-0`，backdrop `#1a1110` 85% + blur；居中；Esc / 点遮罩关闭。

**动画**（~900ms；reduced-motion 仅 fade）：

| 阶段 | 动作 |
|------|------|
| T0 | 遮罩 fade in；关闭态信封 scale 0.95→1 |
| T1 | 信封上盖 rotateX(-180deg)，perspective 800px |
| T2 | 信纸 translateY 向上抽出，横格纸露出 |
| T3 | 展开 max-w-lg，max-h 70vh scroll |
| T4 | score badge + 正文 + footer 重新生成 |

逻辑：`useWeeklyLetter()` hook；关闭时 mark seen。

---

## 6. 分数统一

```ts
// src/lib/weeklyScore.ts
export function getDisplayWeeklyScore(letter: WeeklyLetterData | null): number | null
```

| 位置 | 来源 |
|------|------|
| 邮戳、ScoreRing、Overlay 内评分 | `getDisplayWeeklyScore(letter)` |
| 加载中 | skeleton 或「—」，**禁止**硬编码 85 |

删除：`const score = 85 - alertPenalty`。

---

## 7. 活动趋势图

**问题**：步数 6000+ 与运动 87min / 睡眠 7h 共轴 → 后两者贴底。

**方案**：`chartNormalize.ts` 将各序列映射 0–100（最小跨度 15% 防平线）。

```
compact 模式：
  Line type="monotone" strokeWidth 2.5
  步数 #63AD96 | 睡眠 #EBC97F dashed | 运动 #DD7C64
  隐藏 Y 轴；dot r=3；Tooltip 显示真值
  高度 flex 1，min 180px，max 240px
```

`/dashboard` 页可保留双 Y 轴真值图（P2）。

---

## 8. Pocket 分配

| 位置 | 组件 |
|------|------|
| COL-MAIN 顶 | EnvelopeStage |
| COL-MAIN 中 | WuyinSessionCard / CircadianHintCard compact |
| COL-MAIN 底 | SkillsRings vertical |
| COL-FEED 上 | MessagesWidget |
| COL-FEED 下 | WeeklyActivitySection compact |

---

## 9. 工程任务

| ID | 任务 | 文件 |
|----|------|------|
| H-1 | HomeDashboard + DashboardPanel | 新建 |
| H-2 | EnvelopeStage + EnvelopeOpen | 新建 |
| H-3 | LetterRevealOverlay | 新建 |
| H-4 | NestedPocket | 新建 |
| H-5 | chartNormalize + Activity 曲线 | `WeeklyActivitySection.tsx` |
| H-6 | Skills vertical | `SkillsRings.tsx` |
| H-7 | 删 TCM 裁切 + 85 分 | `HomePage.tsx` |

---

## 10. 验收清单

- [ ] Desktop 一屏：LeftSidebar + 中栏 + 右栏，无整页 scroll
- [ ] 五音/作息按钮与 disclaimer **完整可见**
- [ ] 点击信封 → 正中抽信动画 → 全文
- [ ] 邮戳 / 环 / 信内分数 **相同**
- [ ] 运动/睡眠线 **有起伏**；Tooltip 为真值
- [ ] 同周切页来信不重新生成（见 IMPROVEMENT_PLAN §3）

---

## 11. 相关文件

`HomePage.tsx` · `HomeDashboard.tsx` · `DashboardPanel.tsx` · `EnvelopeStage.tsx` · `NestedPocket.tsx` · `EnvelopeOpen.tsx` · `LetterRevealOverlay.tsx` · `weeklyScore.ts` · `chartNormalize.ts` · `useWeeklyLetter.ts`

**删除/废弃**：`HeroBanner` · 首页内联 `WeeklyLetter` · `LetterReaderSheet`

---

*首页改版方案 · 2026-06-16*
