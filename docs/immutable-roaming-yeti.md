# 身体的编年史家 — App 完整重构方案（校准版）

> **状态**：📋 Plan Only + 类型已落地（见 [ENGINE_CHRONICLE_SPEC.md](./ENGINE_CHRONICLE_SPEC.md)）  
> **完整 UX 细节**：桌面原稿 `~/Desktop/亚健康/新方案/immutable-roaming-yeti.md`（§五–§七 仍有效）  
> **引擎 SSOT**：[ENGINE_CHRONICLE_SPEC.md](./ENGINE_CHRONICLE_SPEC.md)

**关键决策（修订）**：

- 仅 `/practice/wuyin` 保留国风；其余切天气视觉
- Hero：EnvelopeStage（55%）+ WeatherHeroCard（45%）并存
- **四编年史引擎待实现**（非「0 改动」）
- 首页 **已移除** WeeklyActivity 大 panel；折线仅在 `/dashboard`
- Row 2 右栏预留给 **案卷折叠条**（Phase 3-UI4）

---

## 一、现状盘点（校准）

### 引擎层

| 模块 | 文件 | 状态 |
|------|------|------|
| Body Weather | `bodyWeather.ts` | ✅ |
| Mood Inference | `moodInference.ts` | ✅ |
| Wuyin / Circadian / Listening | `wuyinPrescription.ts` 等 | ✅ |
| **Inner Climate** | `innerClimate.ts` | ❌ 待建 |
| **Daily Brief** | `dailyBrief.ts` | ❌ 待建 |
| **Pattern Discovery** | `patternDiscovery.ts` | ❌ 待建 |
| **Body Season** | `bodySeason.ts` | ❌ 待建 |
| Glucose Store | `glucoseStore.ts` | ❌ Phase 6 |
| **WellnessSnapshot** | `wellnessSnapshot.ts` | ⚠️ 已扩展类型，四字段 stub |

### 类型层（四主模块 ✅）

| 文件 | 导出 |
|------|------|
| `types/innerClimate.ts` | `InnerClimateSnapshot` |
| `types/dailyBrief.ts` | `DailyWeatherBrief`, `DecisionHints` |
| `types/caseFile.ts` | `CaseFile`, `PatternDiscoveryResult` |
| `types/bodySeason.ts` | `BodySeasonSnapshot` |
| `types/wellness.ts` | 扩展 `WellnessSnapshot` |

---

## 四、实施阶段（Phase 3/4/5/7 含引擎+UI 子步骤）

### Phase 3 · 身体档案馆（FF-3）

**目标**：`patternDiscovery` 引擎 + `/chronicle` + 首页案卷条。

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| 3-E1 | 引擎 | `types/caseFile.ts` ✅ |
| 3-E2 | 引擎 | `engine/patternDiscovery.ts` |
| 3-E3 | 引擎 | `lib/caseFileStore.ts` |
| 3-E4 | 引擎 | `wellnessSnapshot` → `caseFiles` |
| 3-UI1 | UI | `CaseFileCard`, `CaseFileGallery` |
| 3-UI2 | UI | `ChroniclePage` + 路由 |
| 3-UI3 | UI | Sidebar / BottomNav |
| 3-UI4 | UI | 首页 `CaseFileStrip`（折叠条） |

---

### Phase 4 · 四季编年（FF-4）

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| 4-E1 | 引擎 | `types/bodySeason.ts` ✅ |
| 4-E2 | 引擎 | `engine/bodySeason.ts` |
| 4-E3 | 引擎 | `lib/chroniclePrefs.ts` |
| 4-E4 | 引擎 | `wellnessSnapshot` → `bodySeason` |
| 4-UI1 | UI | `SeasonHeroCard`, `SeasonTimeline` |
| 4-UI2 | UI | `SeasonChangeModal` |
| 4-UI3 | UI | `SeasonsPage` + `/seasons` |
| 4-UI4 | UI | `WeatherHeroCard` 季节 badge |

---

### Phase 5 · 往来书信（FF-5）

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| 5-E1 | 引擎 | `types/bodyReply.ts` |
| 5-E2 | 引擎 | `lib/bodyReplyStore.ts` |
| 5-E3 | 引擎 | `weeklyLetter.ts` 回信上下文 |
| 5-UI1 | UI | `LetterReplyInput` |
| 5-UI2 | UI | `LetterHistory` |
| 5-UI3 | UI | `LetterRevealOverlay` 回信入口 |

---

### Phase 7 · 晨推 + 决策（FF-6 + FF-7）

| 子步骤 | 类型 | 交付 |
|--------|------|------|
| 7-E1 | 引擎 | `types/innerClimate.ts`, `types/dailyBrief.ts` ✅ |
| 7-E2 | 引擎 | `engine/innerClimate.ts`, `engine/dailyBrief.ts` |
| 7-E3 | 引擎 | `wellnessSnapshot` → `innerClimate`, `dailyBrief` |
| 7-E4 | 引擎 | `services/chronicleNotifications.ts` |
| 7-UI1 | UI | `WeatherHeroCard` decisionHints chip |
| 7-UI2 | UI | `SettingsPage` 晨推开关 |
| 7-UI3 | UI | Tauri 晨间推送 |

> **7-E2 亦为 Phase 1 前置**（WeatherHeroCard 需要 dailyBrief）。

Phase 0–2、6、8 见桌面原稿 §四。

---

## 八、文件总览（修订）

### 新增 · 引擎（4）

| 文件 | Phase |
|------|-------|
| `src/engine/innerClimate.ts` | 1 / 7-E2 |
| `src/engine/dailyBrief.ts` | 1 / 7-E2 |
| `src/engine/patternDiscovery.ts` | 3-E2 |
| `src/engine/bodySeason.ts` | 4-E2 |

### 新增 · 类型（4，✅）

| 文件 |
|------|
| `src/types/innerClimate.ts` |
| `src/types/dailyBrief.ts` |
| `src/types/caseFile.ts` |
| `src/types/bodySeason.ts` |

### 新增 · UI / lib / services（节选）

| 文件 | Phase |
|------|-------|
| `src/components/home/WeatherHeroCard.tsx` | 1 |
| `src/components/home/CaseFileStrip.tsx` | 3-UI4 |
| `src/lib/caseFileStore.ts` | 3-E3 |
| `src/lib/chroniclePrefs.ts` | 4-E3 |
| `src/lib/bodyReplyStore.ts` | 5-E2 |
| `src/services/chronicleNotifications.ts` | 7-E4 |
| `src/pages/ChroniclePage.tsx` 等 | 3–4 UI |

### 修改

| 文件 | 变更 |
|------|------|
| `src/types/wellness.ts` | ✅ WellnessSnapshot 扩展 |
| `src/engine/wellnessSnapshot.ts` | 接入四引擎（当前 stub） |
| `src/pages/HomePage.tsx` | ✅ 移除 WeeklyActivity panel |
| `src/components/home/HomeDashboard.tsx` | ✅ 单列 Dojo |

### ~~保留不动~~ → 已修正

- ~~所有 engine 已完备~~ → **四编年史引擎待实现**
- ~~WeeklyActivity 首页 panel~~ → **已移除**

---

## 九、风险 & 取舍（修订）

- ✅ 7 个 FF 分阶段；TCM 功能保留，首页换视觉
- ❌ 「引擎 0 改动」— **已撤回**
- ❌ 首页 WeeklyActivity 大 panel — **已移除**
- ✅ 案卷不 push；数据不足显示「线索不足」
