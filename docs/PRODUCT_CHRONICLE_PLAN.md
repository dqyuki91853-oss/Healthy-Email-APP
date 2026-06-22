# 身体的编年史家 — 产品 SSOT

> **Purpose**：把 Watch 22 项、饮食口述、心情与血糖，翻译成可读的今日天气、可追的每周连载、可验证的个人规律。  
> **副句**：读懂自己身体的语言，并在对的时刻做一小步。  
> **引擎规格**：[ENGINE_CHRONICLE_SPEC.md](./ENGINE_CHRONICLE_SPEC.md)  
> **UI 重构方案**：[immutable-roaming-yeti.md](./immutable-roaming-yeti.md)

## 四层架构

1. **数据层**：Watch 22 项 + 饮食 + 心情 + 血糖
2. **隐喻引擎**：身体天气 · 内部气候 · 身体季节 · 个人基线
3. **故事生成**：每日简报 · 每周来信 · 案卷 · 季节报告
4. **行动层**：预报卡 · 跟哼 · 收工通知 · 晨推 · 回信

## 七大板块

| 板块 | 入口 | 一屏故事 |
|------|------|----------|
| A 今日编年 | 首页 | 今天身体什么天气 |
| B 本周连载 | 信封 Hero | 这周身体经历了什么 |
| C 个人案卷 | 数据页 / 首页折叠条 | 一个关于你的发现 |
| D 身体季节 | Modal 触发 | 你进入了哪个生理季 |
| E 饮食×气候 | 饮食页 | 这顿饭在身体里的旅程 |
| F 道场收工 | WellnessDojo | 收工前做哪一小幕 |
| G 高级附录 | 设置开启 | 22 指标分域（非首页网格） |

## Fun Functions 验收

| FF | 内容 | 引擎 | UI Phase | 状态 |
|----|------|------|----------|------|
| FF-1 | 天气预报卡 + 今日适宜 chip | `dailyBrief` + `innerClimate` | 1 | 待做 |
| FF-2 | 血糖录入 + 食物反应时间线 | `glucoseStore`（Phase 6） | 6 | ✅ |
| FF-3 | 案卷 N=1（每周 ≤2 条） | `patternDiscovery` | 3 | 待做 |
| FF-4 | 身体季节 Modal | `bodySeason` | 4 | 待做 |
| FF-5 | 给身体回信 | `bodyReplyStore` | 5 | ✅ |
| FF-6 | 晨间天气推送（Tauri） | `chronicleNotifications` | 7 | ✅ |
| FF-7 | 适宜/慎重 chip | `dailyBrief.decisionHints` | 7 | ✅ |

## WellnessSnapshot 字段（当前）

```typescript
// src/types/wellness.ts
bodyWeather, mood, wuyin, circadian, listeningWindow  // 已有
innerClimate, dailyBrief, caseFiles, bodySeason       // 类型已定义，引擎 stub
```

## 红线

- 不做积分/减肥/诊断语言
- 首页不展示 22 指标数字墙
- 预警仅高级模式
- 首页已移除 WeeklyActivity 大 panel；折线仅在 `/dashboard`

## 分期（yeti UI Phase + 引擎子步骤）

详见 [ENGINE_CHRONICLE_SPEC.md §3](./ENGINE_CHRONICLE_SPEC.md#3-phase-3--4--5--7-子步骤拆分)。

| UI Phase | 主题 | 引擎子步骤 | UI 子步骤 |
|----------|------|------------|-----------|
| 0 | 天气 Token | — | 0-UI |
| 1 | Hero 天气卡 | 7-E2（innerClimate + dailyBrief） | 1-UI |
| 2 | Dojo 天气化 | — | 2-UI |
| **3** | **档案馆 FF-3** | **3-E1~E4** | **3-UI1~4** |
| **4** | **四季 FF-4** | **4-E1~E4** | **4-UI1~4** |
| **5** | **回信 FF-5** | **5-E1~E3** | **5-UI1~3** |
| 6 | 血糖 FF-2 | 6-E（glucoseStore） | 6-UI |
| **7** | **晨推+决策 FF-6/7** | **7-E3~E4** | **7-UI1~3** |
| 8 | 22 指标 + 打磨 | — | 8-UI |

## 新增文件清单

**引擎（4，待建）**：`innerClimate.ts`、`dailyBrief.ts`、`patternDiscovery.ts`、`bodySeason.ts`

**类型（4，✅）**：`types/innerClimate.ts`、`types/dailyBrief.ts`、`types/caseFile.ts`、`types/bodySeason.ts`

**支撑**：`caseFileStore.ts`、`chroniclePrefs.ts`、`bodyReplyStore.ts`、`chronicleNotifications.ts`
