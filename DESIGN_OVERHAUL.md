# 亚健康监测 Web App — UI/UX 设计改版方案

> ⚠️ **已被 v2 取代**：产品反馈与布局方向见 **[DESIGN_OVERHAUL_V2.md](./DESIGN_OVERHAUL_V2.md)**（来信优先 + 参考图 2 左栏布局）。  
> 本文档中的 **色板、Button/Card 组件规范** 仍然有效。

> **目标读者**：Claude Code（实现工程师）  
> **项目路径**：`CC project/subhealth-monitor`  
> **参考素材**：`/Users/daiqiyuan/Desktop/web design/`  
> **原则**：只改视觉与交互层，**不改动**数据逻辑、预测引擎、LLM 追问、IndexedDB 存储等业务代码。

---

## 1. 设计愿景（Design North Star）

将现有「深色临床仪表盘」重塑为 **「温暖、可信赖的个人健康来信」** 体验：

- **情感定位**：像收到一封来自健康助手的信，而不是在看医院报告（参考 `letter.png`、`letter2.png`）。
- **信息架构**：保留全部功能页面，但用 **三层信息层级** 组织——首页来信 / 数据卡片 / 深度分析页（参考 `排版&设计参考1.png`、`排版&设计参考3.png`）。
- **视觉语言**：Soft UI + 大圆角 + 充足留白 + 手绘感点缀（参考 `letter2.png`、`排版&设计参考2.png` Mentalq）。
- **色彩**：全面采用用户指定品牌色板（`color.png`），替换现有深色主题。

**一句话**：从「Dark Clinical Dashboard」→「Warm Health Letter + Soft Pastel Dashboard」。

---

## 2. 品牌色板（Design Tokens）

来源：`color.png`，写入 `src/index.css` 的 `:root` 并同步 Tailwind `@theme`（若使用 Tailwind v4 theme 扩展）。

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-cream` | `#F8E9BB` | 页面主背景、Hero 横幅、空状态背景 |
| `--color-teal` | `#63AD96` | 主色 / 正向指标 / 主 CTA / 导航激活态 |
| `--color-gold` | `#EBC97F` | 次要强调、中等预警、标签背景 |
| `--color-coral` | `#DD7C64` | 高优先级预警、重要数字、主按钮 hover |
| `--color-blush` | `#F1C6CD` | 装饰区块、女性健康/情绪类卡片背景 |
| `--color-bg` | `#FAF8F4` | 全局底色（奶油白，比 cream 更浅） |
| `--color-surface` | `#FFFFFF` | 卡片、Modal、侧边栏 |
| `--color-surface-2` | `#F5F0E8` | 次级容器、输入框背景 |
| `--color-border` | `#E8E0D4` | 分隔线、卡片描边（极淡） |
| `--color-text` | `#2C2C2C` | 主文字（深炭灰，非纯黑） |
| `--color-muted` | `#8A8A8A` | 次要文字、时间戳 |
| `--color-text-on-teal` | `#FFFFFF` | 主按钮文字 |

### 语义色映射（替换现有红/黄/绿）

| 等级 | 背景 | 文字/描边 | 说明 |
|------|------|-----------|------|
| green | `#63AD96` 15% opacity | `#63AD96` | 健康/正常 |
| yellow | `#EBC97F` 25% | `#B8860B` 近似深金 | 关注 |
| orange | `#DD7C64` 20% | `#DD7C64` | 预警 |
| red | `#DD7C64` 35% | `#C45A42` | 高优先级（复用 coral 系，避免刺目纯红） |

### 圆角与阴影

```css
--radius-sm: 12px;
--radius-md: 20px;
--radius-lg: 28px;
--radius-pill: 9999px;
--shadow-card: 0 4px 24px rgba(44, 44, 44, 0.06);
--shadow-float: 0 8px 32px rgba(44, 44, 44, 0.10);
```

---

## 3. 排版系统（Typography）

参考 `排版&设计参考1/2/3` 的现代 sans-serif + `letter2.png` 的手写感点缀。

| 层级 | 字体 | 大小 | 字重 | 用途 |
|------|------|------|------|------|
| Display | `"DM Sans"` 或 `"Plus Jakarta Sans"` | 32–40px | 700 | 首页问候、周报标题 |
| H1 | 同上 | 24px | 600 | 页面标题 |
| H2 | 同上 | 18px | 600 | 卡片标题 |
| Body | 同上 | 15px | 400 | 正文、周报段落 |
| Caption | 同上 | 12–13px | 400 | 时间戳、免责声明 |
| Accent | `"Caveat"` 或 `"ZCOOL KuaiLe"`（可选） | 18–22px | 400 | 「每周健康来信」签名行、装饰引语 |

- 引入 Google Fonts 或本地 woff2，在 `index.css` 声明。
- 行高：正文 `1.65`，标题 `1.25`。
- **禁止**继续使用 emoji 作为唯一等级指示（🟢🟡🟠🔴）——改为色块圆点 + 文字标签，emoji 仅作装饰。

---

## 4. 全局布局改版

### 4.1 当前问题（`AppLayout.tsx`）

- 深色窄侧栏 + 12 个平铺导航项，信息密度高、医疗感强。
- 无响应式移动端方案。
- 首页与其他页视觉层级一致，缺少「来信」作为情感入口。

### 4.2 新布局结构

#### Desktop（≥1024px）— 参考 `排版&设计参考1.png`

```
┌──────────┬────────────────────────────────────┬─────────────┐
│ Icon Nav │         Main Content               │ Right Panel │
│  (72px)  │         (flex-1)                   │  (320px)    │
│          │                                    │  可选折叠    │
└──────────┴────────────────────────────────────┴─────────────┘
```

- **左侧 Icon Nav（72px）**：仅图标 + tooltip；激活态 = `--color-teal` 实心圆背景 + 白色图标（参考参考1左侧导航）。
- **主导航分组**（用 section divider，不增加路由）：
  - **首页**：总览 `/`
  - **记录**：每日记录 `/voice-log`、饮食 `/diet`
  - **数据**：仪表盘 `/dashboard`、导入 `/upload`
  - **健康方向**：睡眠/心脏/代谢/心理/女性（5 项，可折叠 submenu 或二级页 Tab）
  - **系统**：预警 `/alerts`、设置 `/settings`
- **右侧 Panel（320px，仅首页 + 仪表盘显示）**：
  - 用户头像占位 + 问候语
  - 迷你周日历（参考 `排版&设计参考3.png`），点击日期筛选图表
  - 「本周活动」摘要条（步数/睡眠/运动 3 项 circular progress）
  - 最近 3 条饮食记录快捷入口

#### Mobile（<1024px）— 参考 `letter.png`

- 顶部：居中 App 名「健康来信」或用户自定义称呼，无侧栏。
- 底部 Tab Bar（3–4 项）：
  1. **首页**（`/`) — 邮箱/来信图标
  2. **记录**（`/voice-log`）— 麦克风
  3. **数据**（`/dashboard`）— 图表
  4. **我的**（`/settings`）— 人像
- 其余页面从首页卡片或「更多」抽屉进入。

### 4.3 需修改文件

- `src/components/layout/AppLayout.tsx` — 重构为 IconNav + 可选 RightPanel
- 新建 `src/components/layout/BottomNav.tsx` — 移动端
- 新建 `src/components/layout/RightPanel.tsx` — 桌面端右栏
- 新建 `src/components/layout/PageHeader.tsx` — 统一页面标题区

---

## 5. 核心页面改版规格

### 5.1 首页 `/` — 「健康来信」体验（最高优先级）

**参考**：`letter.png`（诗意居中）、`letter2.png`（收信 Modal）、现有 `WeeklyLetter.tsx`

#### 布局（Desktop）

```
[AlertBanner — 若有预警，改为顶部柔和横幅，非红色块]

[Hero 区 — cream 背景大卡片，圆角 28px]
  ├─ 左侧：ScoreRing（改用 teal/coral 渐变环）
  ├─ 中央：问候「你好，[昵称]」+ 副标题「本周健康来信已送达」
  └─ 右侧：pill 按钮「快速记录」teal 实心

[WeeklyLetter — 信纸样式卡片]
  ├─ 顶部：手绘邮箱插画占位（SVG，参考 letter.png 邮筒轮廓，用 teal/coral 配色）
  ├─ 信纸背景：白色，内边距 32px，顶部淡 envelope X 线稿（参考 letter2.png modal 背景）
  ├─ 正文：15px，行高 1.65，段落间距 16px
  ├─ 底部：日期范围 + 「重新生成」ghost 按钮
  └─ 首次加载：Modal 弹窗「收到了新的来信」+ 黑色 pill CTA「去看看」（参考 letter2.png）

[快捷入口 Grid — 2×2 或 3 列 pastel 卡片，参考参考1/2]
  ├─ 睡眠 / 心脏 / 代谢 / 心理 — 各方向最新等级 + 跳转
  └─ 卡片背景轮换：cream / blush / gold 15% / teal 15%
```

#### WeeklyLetter 组件改造要点（`WeeklyLetter.tsx`）

- 外层 Card 改为 `LetterCard` 组件：信纸纹理 + 大圆角 + 无硬边框（用 shadow-card）。
- Loading：信封打开动画（CSS scale + opacity），替代灰色 skeleton 条。
- 不足数据：居中插画 + 柔和文案，CTA 用 teal pill 按钮。
- 新增 `NewLetterModal`：检测 `letterData` 首次生成成功后弹出（localStorage 记录 `lastSeenLetterKey`）。

### 5.2 数据仪表盘 `/dashboard`

**参考**：`排版&设计参考3.png` Weekly Activity 图表 + 参考1 卡片 Grid

- 顶部：**Pill Tab 筛选**（7天 / 14天 / 30天 / 全部），激活态黑底白字（参考参考1 Filter Bar）。
- 图表区：
  - 主图：多指标折线/面积图（Recharts），线条色用 teal / gold / coral，圆角 legend。
  - 柱图：圆头 bar（`radius={[8,8,0,0]}`），参考 Mentalq 圆角柱。
- 指标卡片 Grid：每个 metric 一张 pastel 卡片（`Card` 改版），非深色边框盒。
- 空值显示「—」灰色，不用 0。

### 5.3 预警 `/alerts` + AlertBanner

**参考**：参考2 的 orange 激励横幅（反向用于预警）

- `AlertBanner.tsx`：改为顶部 **floating pill 横幅**，左侧色点 + 标题，右侧「查看」链接；背景用等级语义色 15% opacity。
- 预警列表页：每条预警 = 左侧色条（4px coral/gold/teal）+ 白色卡片 + 圆角 20px。

### 5.4 每日记录 `/voice-log` + 追问卡片

**参考**：`letter2.png` 手帐感 + Mentalq emoji 选择器

- 录音按钮：大圆形 FAB，teal 实心，固定于移动端右下角。
- `FollowUpCard.tsx`：改为 **对话气泡** 样式——系统消息左对齐 blush 背景，用户选项右对齐 cream 背景。
- `CompoundDishPanel.tsx`：圆角 24px 面板，选项 chip 用 pill 形（gold 未选 / teal 已选）。

### 5.5 健康方向页（睡眠/心脏/代谢/心理/女性）

**参考**：`排版&设计参考2.png` Mentalq 详情页

- 统一模板 `DirectionPageLayout.tsx`：
  - 顶部：方向名称 + `DirectionScoreCard`（大号百分比 + 状态文案）
  - 中部：`RiskRadarChart` 或 `TimeSeriesChart`（配色对齐 token）
  - 底部：Evidence 列表（浅色卡片 + 左侧 teal 圆点）
- 9 方向与 pastel 色绑定（固定映射，便于用户形成记忆）：

| 方向 | 卡片背景 |
|------|----------|
| 痛风/代谢 | `#EBC97F` 20% |
| 睡眠 | `#63AD96` 15% |
| 心脏 | `#DD7C64` 15% |
| 心理/情绪 | `#F1C6CD` 30% |
| 女性 | `#F1C6CD` 20% |
| … | 从五色中轮换 |

### 5.6 设置 `/settings`

- 分组卡片：隐私 / LLM 配置 / 追问偏好 / 清除数据。
- Toggle 开关：teal 激活态。
- 「清除全部数据」：coral 描边 ghost 按钮，二次确认 Modal（参考 letter2 弹窗样式）。

### 5.7 数据导入 `/upload`

- 拖拽区：虚线圆角框 + cream 背景 + 中心上传插画。
- 进度条：teal 填充，圆角 pill。

---

## 6. 组件库改造清单

| 组件 | 文件 | 改动 |
|------|------|------|
| Card | `components/ui/Card.tsx` | 白底 + shadow-card + radius-lg；支持 `variant: default/cream/blush/teal` |
| Button | **新建** `components/ui/Button.tsx` | `primary`(teal pill) / `secondary`(cream) / `ghost` / `danger`(coral outline) |
| ScoreRing | `components/ui/ScoreRing.tsx` | 轨道 `#E8E0D4`；进度 arc 用 teal→gold 渐变；文字深色 |
| Badge | **新建** `components/ui/Badge.tsx` | pill 形等级标签 |
| Modal | **新建** `components/ui/Modal.tsx` | 白底、radius-lg、backdrop blur、envelope 背景纹 |
| PillTabs | **新建** `components/ui/PillTabs.tsx` | 参考1 筛选条 |
| CircularProgress | **新建** `components/ui/CircularProgress.tsx` | 参考3 环形指标 |
| MiniCalendar | **新建** `components/ui/MiniCalendar.tsx` | 参考3，可选 |
| LetterCard | **新建** `components/health/LetterCard.tsx` | 信纸容器 |
| NewLetterModal | **新建** `components/health/NewLetterModal.tsx` | 收信弹窗 |
| MailboxIllustration | **新建** `components/illustrations/Mailbox.tsx` | 简笔 SVG 邮筒 |

### 图表（Recharts）全局 theme

在 `components/charts/chartTheme.ts` 集中定义：

```ts
export const CHART_COLORS = ['#63AD96', '#EBC97F', '#DD7C64', '#F1C6CD']
export const CHART_GRID = '#E8E0D4'
export const CHART_TOOLTIP = { bg: '#FFFFFF', border: '#E8E0D4', radius: 12 }
```

更新：`TimeSeriesChart.tsx`、`RiskRadarChart.tsx`。

---

## 7. 插画与装饰（轻量实现）

不引入 heavy 插画库，优先 **内联 SVG**：

1. **邮筒**（首页 Hero）：简化几何形，主色 teal，杆 gold（参考 `letter.png`）。
2. **信封线稿**：Modal/信纸背景用 CSS `repeating-linear-gradient` 或轻量 SVG pattern（参考 `letter2.png`）。
3. **可选**：`letter2.png` 的 hand-drawn 风格可通过 `border: 2px solid #2C2C2C; border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px` 等 irregular radius 模拟（仅用于装饰 frame，不全站滥用）。

---

## 8. 动效与微交互

| 场景 | 效果 | 实现 |
|------|------|------|
| 页面切换 | fade 150ms | Framer Motion 或 CSS `@keyframes` |
| 卡片 hover | translateY(-2px) + shadow 加深 | `transition: transform 0.2s, box-shadow 0.2s` |
| 新来信 Modal | scale 0.95→1 + fade | CSS animation |
| Tab 切换 | 下划线 slide 或背景 pill slide | CSS |
| 录音中 | teal 脉冲 ring | `animate-ping` |

**注意**：尊重 `prefers-reduced-motion`。

---

## 9. 响应式断点

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

- `< lg`：BottomNav 显示，侧栏隐藏，RightPanel 内容并入主页下方。
- `≥ lg`：IconNav + RightPanel，BottomNav 隐藏。

---

## 10. 无障碍（A11y）

- cream/gold 背景上的文字需满足 WCAG AA（正文对比度 ≥ 4.5:1）；必要时用 `#2C2C2C` 而非 muted 灰。
- 等级色不可仅依赖颜色——保留文字标签「正常 / 关注 / 预警」。
- 所有 icon-only 按钮加 `aria-label`。
- Modal 焦点陷阱 + Esc 关闭。

---

## 11. 实施顺序（Suggested Phases）

### Phase 1 — 设计基础（1–2h）
1. 重写 `src/index.css` tokens + 字体
2. 新建 `Button`, `Badge`, 改版 `Card`, `ScoreRing`
3. 验证 `npm run build` 通过

### Phase 2 — 布局（2–3h）
4. 重构 `AppLayout` + `BottomNav` + `PageHeader`
5. 响应式切换逻辑

### Phase 3 — 首页来信（2–3h）
6. `LetterCard` + `NewLetterModal` + Mailbox SVG
7. 改版 `HomePage.tsx` Hero + 快捷入口 Grid

### Phase 4 — 数据页（2h）
8. `PillTabs` + 图表 theme
9. 改版 `DashboardPage` + `RightPanel` MiniCalendar

### Phase 5 — 其余页面（3–4h）
10. 统一 `DirectionPageLayout`
11. 改版 AlertBanner、FollowUpCard、Upload、Settings

### Phase 6 —  polish（1h）
12. 动效、空状态、loading 态统一
13. 全站走查对比参考图截图

---

## 12. 不要改动的范围（Out of Scope）

- `src/engine/*` 预测与评分逻辑
- `src/services/*` LLM、weeklyLetter 生成逻辑（仅改 UI 层包装）
- `src/db/*` IndexedDB schema
- `src/lib/health-import/*` 导入管道
- `scripts/*` Python 解析脚本
- 路由路径与 store API 签名

---

## 13. 验收标准（Acceptance Criteria）

- [ ] 全站背景为浅色（cream/white），无 `#0f1419` 深色残留
- [ ] 品牌五色可在首页、卡片、图表中识别
- [ ] 首页 WeeklyLetter 呈现「信纸/收信」情感体验，含新信 Modal
- [ ] Desktop 有 Icon 侧栏；Mobile 有 Bottom Tab
- [ ] 所有卡片圆角 ≥ 20px，有 soft shadow
- [ ] 图表配色与 token 一致
- [ ] `npm run build` 零错误
- [ ] 功能回归：导入、语音记录、追问、预警、9 方向评分均正常

---

## 14. 参考图对照索引

| 文件名 | 借鉴元素 |
|--------|----------|
| `color.png` | 五色 token 唯一来源 |
| `letter.png` | 首页居中诗意布局、邮筒意象、底部 Tab 结构 |
| `letter2.png` | 收信 Modal、信纸背景纹、pill 按钮、手帐温暖感 |
| `排版&设计参考1.png` | 三栏布局、pastel 卡片 Grid、pill 筛选、Icon 侧栏 |
| `排版&设计参考2.png` | Mentalq 大圆角、emoji 状态、激励横幅、圆头柱图 |
| `排版&设计参考3.png` | 白卡片 dashboard、环形进度、日历、折线图、FAB |

---

*文档版本：2026-06-16 · 供 Claude Code 直接按 Phase 1→6 实施*
