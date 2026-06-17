# 亚健康监测 Web App — 设计改版方案 v2（纯文字版）

> **版本**：v2.1（2026-06-16）— 全文不依赖任何图片，Claude Code 可直接按文字规格实现  
> **项目路径**：`CC project/subhealth-monitor`  
> **色板与基础组件**：见 `DESIGN_OVERHAUL.md` 第 2–3 节（hex 值已写明，无需看图）

---

## 0. 变更摘要

| 维度 | 当前 v1 实现 | v2 目标 |
|------|-------------|---------|
| 产品重心 | 来信 + 大量分析页 | **分数 + 来信** 为唯一主输出；引擎逻辑后台运行 |
| 布局 | 72px 图标侧栏 + 主区 + 右栏 | **宽左栏 + 主内容区**（见第 2 节完整文字描述） |
| 导航 | 12+ 路由 | **4 个 Tab**：首页 / 记录 / 数据 / 设置 |
| 预警 | 红色 AlertBanner | 来信内 1–2 句温柔提醒，无警报条 |
| 图表 | 22 指标网格 | 首页仅 4 个环形分 + 1 张 Weekly Activity 折线图 |

---

## 1. 产品原则（文字说明，无需看图）

### 1.1 用户反馈的核心要求

用户明确说：**前台不要展示太多东西。**

不需要让用户看到：
- 决策逻辑是怎么算出来的
- 证据链强度（strong / moderate / heuristic）
- 阈值推导过程、HRV 基线百分比、Reliability 说明
- 9 个方向的评分明细卡片、雷达图

**只需要给用户两样东西：**
1. **一个综合健康分数**（0–100 的整数，一个数字就够）
2. **一封像朋友写的健康来信**（400–600 字中文）

来信的内容要求（写作风格，不是 UI）：
- 具体说：这周 **某种食物吃太多了**，建议下周 **少吃一点**
- 具体说：如果方便，下周可以 **多吃某类食物**（蔬菜、鱼等）
- **必须表扬**：例如「这周运动很好」「睡眠不错」「坚持记录饮食很棒」
- 全程 **鼓励、温暖、不批评、不恐吓**，像给朋友写信，不像医生下诊断

### 1.2 技术层与展示层分离

- `engine/`、`predictor`、`directionScorer` **继续运行**，结果只喂给 `weeklyLetter.ts` 生成人话
- 用户界面 **永远不渲染** `EvidenceBadge`、`ReliabilityBadge`、`DirectionScoreCard`、`RiskRadarChart`（除非设置里打开「高级模式」，默认关闭）

---

## 2. 主布局 — 完整文字描述（对齐「Soft UI 健康 Dashboard」风格）

> 以下描述替代所有「参考图」：实现时 **严格按尺寸与结构**，无需查看任何截图。

### 2.1 整体印象

这是一套 **浅色、透气、卡片化** 的 Web 仪表盘，气质类似现代 SaaS 个人中心（如 Notion / 健康类 App 的 Welcome 页），**不是** 深色医疗后台。

- 页面底色：极浅暖灰 `#FAF8F4`（像米白色墙纸）
- 所有功能块：**白色卡片** 浮在底色上，大圆角、轻阴影
- 主强调色：青绿色 `#63AD96`（用于激活态、按钮、进度环、日历今日标记）
- 次要强调：奶油黄 `#F8E9BB` / 金色 `#EBC97F`（用于 Hero 横幅背景）
- 整体留白多：卡片间距 24px，卡片内边距 24–32px

### 2.2 Desktop 结构（屏幕宽度 ≥ 1024px）

页面分为 **两列**，横向 flex 排列，全屏高度：

**左列（Left Sidebar）**
- 宽度：**280px**，固定不缩放
- 背景：`#FFFFFF`
- 右边框：1px solid `#E8E0D4`
- 内边距：24px
- 纵向排列，从上到下共 4 块 + 底部 FAB

**右列（Main Content）**
- 宽度：`flex: 1`，占剩余空间
- 背景：`#FAF8F4`
- 内边距：32px
- 纵向排列：顶栏 Tab → Hero 横幅 → 双列区 → 技能环 → 折线图

---

### 2.3 左列 — 逐块规格

#### 块 A：用户资料（顶部）

```
布局：横向 flex，align-items: center，gap: 12px，margin-bottom: 24px

头像：
  - 圆形，直径 48px
  - 背景 #63AD96（15% 透明度亦可）
  - 中间：User 图标，颜色 #63AD96，size 24px

文字区：
  - 第一行：昵称，14px，font-weight 600，颜色 #2C2C2C
    （无昵称时显示「健康访客」）
  - 第二行：今日日期 YYYY-MM-DD，12px，颜色 #8A8A8A
```

#### 块 B：迷你月历（Mini Calendar）

```
容器：白色或 #F5F0E8 背景，圆角 20px，padding 16px，margin-bottom 24px

顶栏：
  - 左右箭头按钮切换月份
  - 中间：「2026年6月」14px font-weight 600

日期网格：7 列（日一二三四五六），gap 4px

普通日期：
  - 32×32px 圆角 8px 可点击区域
  - 文字 13px，颜色 #2C2C2C

今日：
  - 背景实心 #63AD96
  - 文字白色

有数据的日期（有 watch 或 voice 记录）：
  - 日期数字下方 4px 处一个小圆点，直径 4px，颜色 #63AD96
```

#### 块 C：最近记录列表（Task List 风格）

```
区块标题：「最近记录」，12px，font-weight 500，颜色 #8A8A8A，margin-bottom 12px

列表：纵向 gap 8px，最多 5 条

每条记录卡片：
  - 背景 #F5F0E8
  - 圆角 12px
  - padding 12px
  - 横向 flex，gap 12px

  左侧图标块：
    - 40×40px，圆角 10px
    - 背景轮换：#F8E9BB / #F1C6CD / #EBC97F（15% 透明度）
    - 中间：Apple 或 Utensils 图标，#63AD96

  右侧文字：
    - 标题：餐次摘要，13px font-weight 500，单行 truncate
    - 副标题：「6月9日 · 午餐」，12px，#8A8A8A

点击整条：跳转 /voice-log
无记录时：显示「暂无记录，点击下方 + 开始」12px 居中灰色
```

#### 块 D：FAB 添加按钮（左列底部）

```
位置：左列内 sticky，bottom: 24px（或 margin-top: auto 推到底部）

尺寸：48×48px
圆角：12px（略圆角方形，不是正圆）
背景：#63AD96
图标：白色 + 号，24px
hover：背景 #DD7C64

点击：跳转 /voice-log
aria-label: 「添加饮食记录」
```

---

### 2.4 右列 — 逐块规格

#### 块 1：顶栏 Tab 导航（TopNav）

```
位置：主内容区最顶部，margin-bottom 24px
布局：横向 flex，gap 32px，align-items: center
底部分隔：无全宽线，仅 active 项有下划线

共 4 项，每项：图标 18px + 文字 14px，横向 gap 6px

| 路由 | 标签 | 图标 lucide |
|------|------|-------------|
| / | 首页 | Home |
| /voice-log | 记录 | Mic |
| /dashboard | 数据 | BarChart2 |
| /settings | 设置 | Settings |

未选中：文字 #8A8A8A，icon #8A8A8A
选中：文字 #63AD96 font-weight 600，icon #63AD96
选中下划线：高 2px，宽与文字同宽，颜色 #63AD96，位于文字下方 4px

Mobile（<1024px）：隐藏 TopNav，改用 BottomNav
```

#### 块 2：Hero 欢迎横幅

```
容器：
  - 宽度 100%
  - min-height 140px
  - 背景：linear-gradient(135deg, #F8E9BB 0%, #EBC97F 60%)
  - 圆角 28px
  - padding 32px
  - box-shadow: 0 4px 24px rgba(44,44,44,0.06)
  - margin-bottom 24px
  - 布局：横向 flex，justify-between，align-items: center，wrap 允许

左侧文字：
  - 大标题：「欢迎回来」，28px，font-weight 700，#2C2C2C
  - 副标题：「本周健康来信已准备好」，14px，#8A8A8A，margin-top 4px

中间：ScoreRing 组件，直径 88px（仅一个综合分，不要等级标签）

右侧 CTA：
  - Button primary：「阅读本周来信」
  - 点击：scrollIntoView(#weekly-letter)
  - teal 实心 pill 按钮

禁止出现在 Hero 内：
  - 预警数量 Badge
  - 「综合等级 正常/关注/预警」文字
  - emoji 色点
```

#### 块 3：双列主内容区（来信 + 消息）

```
布局：CSS grid，grid-template-columns: 1fr 320px，gap 24px，margin-bottom 24px
Mobile：单列，来信在上，消息在下

── 左列：Weekly Letter（占满剩余宽）──
  id="weekly-letter"
  使用 LetterCard / Card 组件：
    - 白底 #FFFFFF
    - 圆角 28px
    - padding 32px
    - 可选：背景有极淡信封对角线纹理（CSS repeating-linear-gradient 45deg，#E8E0D4 5% 透明度）

  顶部：小标签「本周健康来信」，12px uppercase，#63AD96，letter-spacing 0.05em

  评分行（若有）：
    - 「本周评分 82/100」，18px font-weight 700，#63AD96

  正文：
    - 15px，line-height 1.65，颜色 #2C2C2C
    - 段落间距 16px
    - 禁止展示原始数据表格、阈值、证据等级

  底部：
    - 左：日期范围 12px #8A8A8A
    - 右：ghost 按钮「重新生成」

── 右列：Messages 小部件（固定宽 320px）──
  白卡，圆角 20px，padding 20px，shadow-card

  标题：「最近饮食」，14px font-weight 600

  列表 3 条，gap 12px：
    每条横向 flex gap 12px：
      - 圆形头像 36px，背景 #F1C6CD，中间为首字（餐名首字），14px font-weight 600
      - 文字区：
          主：餐次摘要 13px font-weight 500 truncate
          副：日期 12px #8A8A8A

  空状态：「还没有饮食记录」+ 链接「去记录 →」
```

#### 块 4：Top Skills 环形进度（2×2 网格）

```
容器：白卡，圆角 20px，padding 24px，margin-bottom 24px

标题：「本周概况」，16px font-weight 600，margin-bottom 16px

网格：2 列 × 2 行，gap 16px

每个技能项（共 4 个）：
  布局：横向 flex，align-items: center，gap 16px
  背景：#F5F0E8，圆角 16px，padding 16px

  左：CircularProgress 环形，直径 56px，线宽 6px
      轨道色 #E8E0D4
      进度色见下表

  右：
    标签 14px font-weight 500 #2C2C2C
    百分比 12px #8A8A8A（如「75%」）

| 标签 | 计算方式 | 进度色 |
|------|----------|--------|
| 睡眠 | avg(sleepHours)/8，cap 100% | #63AD96 |
| 运动 | avg(exerciseMinutes)/30 | #EBC97F |
| 步数 | avg(dailySteps)/8000 | #DD7C64 |
| 饮食记录 | 有 voiceLog 的天数/7 | #F1C6CD 用 #DD7C64 描边 |

禁止：显示 metric key、阈值说明、Reliability 注释
```

#### 块 5：Weekly Activity 折线图（全宽）

```
容器：白卡，圆角 20px，padding 24px

顶栏 flex justify-between align-items: center，margin-bottom 16px：
  左：标题「Weekly Activity / 本周活动」，16px font-weight 600
  右：Pill 下拉「7天 ▾」，背景 #F5F0E8，圆角 999px，padding 6px 16px，13px

图表区高度 280px：
  - Recharts LineChart 或 AreaChart
  - 3 条平滑曲线（monotone）：
      步数 #63AD96
      睡眠(小时) #EBC97F
      运动(分钟) #DD7C64
  - 网格线 #E8E0D4，虚线
  - X 轴：日期 MM-DD，12px #8A8A8A
  - Y 轴：隐藏或极简

底部 Legend：横向居中，gap 24px
  每项：8×8px 色块 + 12px 标签
```

---

### 2.5 Mobile 布局（< 1024px）

```
- 隐藏 LeftSidebar 整列
- 隐藏 TopNav
- 显示 BottomNav：固定底部，高 64px，白底，上边框 1px #E8E0D4
  4 项均分：首页/记录/数据/设置，图标 22px + 标签 10px
  active：icon + 文字 #63AD96

- 主内容 padding 16px，padding-bottom 80px（避开 BottomNav）
- Hero 全宽，ScoreRing 可居中
- 双列区变单列
- FAB：fixed，bottom: 80px，right: 16px，48×48px teal 方块
- MiniCalendar：可放在 Hero 下方一行缩略版，或省略
- 最近记录列表：合并到 Messages 下方
```

---

## 3. 品牌色板（完整 hex，无需看图）

| 名称 | Hex | 用途 |
|------|-----|------|
| cream | `#F8E9BB` | Hero 渐变、空状态、图标块背景 |
| teal | `#63AD96` | 主色、按钮、激活态、进度、今日日历 |
| gold | `#EBC97F` | Hero 渐变、运动环、折线 |
| coral | `#DD7C64` | 步数环、hover、次要强调 |
| blush | `#F1C6CD` | 饮食环、消息头像背景 |
| bg | `#FAF8F4` | 页面底色 |
| surface | `#FFFFFF` | 卡片、侧栏 |
| surface-2 | `#F5F0E8` | 列表项、输入框、Tab 未选中背景 |
| border | `#E8E0D4` | 分隔线 |
| text | `#2C2C2C` | 主文字 |
| muted | `#8A8A8A` | 次要文字 |

圆角：`sm 12px` / `md 20px` / `lg 28px` / `pill 9999px`  
阴影：`0 4px 24px rgba(44,44,44,0.06)`

字体：
- 主字体：`"Plus Jakarta Sans", "SF Pro Text", system-ui, sans-serif`
- 来信签名可选：`"Caveat", cursive`（18px，#8A8A8A）

---

## 4. 「健康来信」视觉风格（文字描述）

来信区域应像 **实体信纸**，不是数据库报表：

- 白底，大内边距（32px），段落间有空行
- 可选：极淡对角交叉线（像信封翻盖折痕），opacity 0.04，不影响阅读
- 评分用一行大字展示，不用红绿黄等级词
- 新开信 Modal（若已有 NewLetterModal）：
  - 全屏半透明遮罩 rgba(44,44,44,0.4)
  - 中央白卡，宽 90% max 400px，圆角 28px，padding 32px
  - 标题：「收到了新的来信」，18px font-weight 600
  - 底部主按钮：黑色 `#2C2C2C` 实心 pill，白字「去看看」，圆角 999px，padding 12px 32px

---

## 5. 信息架构

### 5.1 主导航仅 4 项

| 路由 | 标签 | 内容 |
|------|------|------|
| `/` | 首页 | Hero + 来信 + Messages + 技能环 + 折线图 |
| `/voice-log` | 记录 | 语音录入 + 智能追问（气泡对话 UI） |
| `/dashboard` | 数据 | 仅 Weekly Activity + 3 个摘要数字（步数/睡眠/运动均值） |
| `/settings` | 设置 | 导入 Apple Health、API Key、隐私、清除数据 |

### 5.2 从导航移除（路由可保留）

- `/sleep` `/heart` `/metabolic` `/mental` `/women` `/diet` `/alerts` `/upload`
- Upload 功能移入 Settings
- Diet 内容并入首页 Messages + 左栏列表
- Alerts 不再独立展示；必要时在来信里用一句话带过

### 5.3 删除 HomePage 中的 QUICK_ENTRIES 四宫格

不再显示睡眠/心脏/代谢/心理快捷入口卡片。

---

## 6. 来信内容规范（`weeklyLetter.ts`）

### 6.1 LLM SYSTEM_PROMPT 必须包含

```
你是健康来信助手。根据用户 7 天数据写一封 400–600 字中文信。

结构：
1. 称呼 + 本周评分(0-100) + 一句总结
2. 这周可以留意的饮食（点名具体食物，建议少吃）
3. 下周可以试试多吃的（1-2 类食物，用「如果方便」）
4. 至少一句具体表扬（步数/睡眠/运动/坚持记录）
5. 温暖结尾，署名「你的健康小助手」

严禁：证据等级、阈值、HRV%、临床术语、数据表格、批评恐吓
语气：像朋友写信，鼓励为主
```

### 6.2 Fallback 模板（无 API Key 时）

**禁止**输出 `buildWeeklyDataSummary` 原文。改用：

```
亲爱的小伙伴：

这周你的综合状态大约 {score} 分——{「整体不错」或「还有提升空间」}。

{若有高嘌呤/高糖记录} 我注意到你这周吃了不少【具体食物名】，下次可以稍微减少一些。
{若蔬菜不足} 如果下周方便，可以多安排一些蔬菜或鱼类。

{从步数/睡眠/运动选一项真实数据} 特别想夸夸你：【具体表扬句】。

祝你新的一周元气满满。
你的健康小助手
```

`buildWeeklyDataSummary()` 仅供 LLM 输入，**不得**出现在 UI。

---

## 7. 必须隐藏的前台组件

默认 `advancedMode === false` 时不渲染：

| 组件 | 原位置 |
|------|--------|
| `EvidenceBadge` | 各分析页、Alerts |
| `ReliabilityBadge` | Dashboard、Sleep、Heart 等 |
| `DirectionScoreCard` | 各方向页、Diet、Alerts |
| `RiskRadarChart` | 若有 |
| `AlertBanner` | HomePage |
| 阈值评估 Card | SleepPage 等 |
| Dashboard 22 指标网格 | DashboardPage |

Settings 可选 Toggle「显示高级健康数据」，默认 **关**。

---

## 8. 文件改动清单

### 新建

| 文件 | 职责 |
|------|------|
| `components/layout/LeftSidebar.tsx` | 第 2.3 节完整左栏 |
| `components/layout/TopNav.tsx` | 第 2.4 块 1 |
| `components/ui/MiniCalendar.tsx` | 第 2.3 块 B |
| `components/home/HeroBanner.tsx` | 第 2.4 块 2 |
| `components/home/MessagesWidget.tsx` | 第 2.4 块 3 右列 |
| `components/home/SkillsRings.tsx` | 第 2.4 块 4 |
| `components/home/WeeklyActivitySection.tsx` | 第 2.4 块 5 |
| `lib/skillScores.ts` | 四环百分比计算 |

### 重构

| 文件 | 改动 |
|------|------|
| `AppLayout.tsx` | LeftSidebar + Main；删除 72px Icon Nav 和 RightPanel |
| `HomePage.tsx` | 按 2.4 节网格重组；删 AlertBanner、QUICK_ENTRIES |
| `DashboardPage.tsx` | 仅折线图 + 三数字摘要 |
| `weeklyLetter.ts` | prompt + fallback 按第 6 节 |
| `SettingsPage.tsx` | 并入 Upload；可选 advancedMode |

### 停用

| 文件 | 说明 |
|------|------|
| `RightPanel.tsx` | 功能拆到 LeftSidebar + MessagesWidget |

---

## 9. 实施顺序

**Phase A** — 布局：`LeftSidebar` + `TopNav` + 重构 `AppLayout` + Mobile BottomNav/FAB  
**Phase B** — 首页：`HeroBanner` + 网格 + `SkillsRings` + `WeeklyActivitySection`  
**Phase C** — 来信：更新 `weeklyLetter.ts`，确认 Modal  
**Phase D** — 导航精简 + Dashboard 简化 + Upload 移 Settings  
**Phase E** — 隐藏高级组件 + 空状态 + `npm run build`

---

## 10. 验收标准（可逐项勾选）

- [ ] Desktop：左 280px 白侧栏（资料+日历+列表+FAB）+ 右主区（Tab+Hero+双列+环+折线）
- [ ] 首屏用户只见：**一个分数 + 一封信 + 简单图表**，无证据/阈值/雷达
- [ ] 来信含具体饮食建议 + 至少一句表扬，语气鼓励
- [ ] Fallback 来信无 raw data 表格
- [ ] 主导航 4 项；Mobile 有 BottomNav + 右下 FAB
- [ ] 色板使用第 3 节 hex；卡片圆角 ≥ 20px；白卡片 + 轻阴影
- [ ] `npm run build` 通过；语音记录、导入、追问正常

---

## 11. Claude Code 执行指令（复制即用）

```
阅读 CC project/subhealth-monitor 下的 DESIGN_OVERHAUL_V2.md（纯文字版）。

按 Phase A→E 实施，严格遵循文档第 2 节的像素级布局描述和第 3 节色板。
不需要也无法查看任何参考图片。

优先级：
1. LeftSidebar 280px 取代现有 Icon Nav + RightPanel
2. 首页只展示分数+来信+4环+折线图，删除 AlertBanner 和 QUICK_ENTRIES
3. 隐藏 EvidenceBadge / ReliabilityBadge / DirectionScoreCard
4. 重写 weeklyLetter fallback，禁止向用户展示 buildWeeklyDataSummary

DESIGN_OVERHAUL.md 的 Button/Card 组件可复用。
不改动 engine/、db/、health-import/ 业务逻辑。
每 Phase 结束运行 npm run build。
```

---

*文档版本：v2.1 · 纯文字版 · 2026-06-16*
