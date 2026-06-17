# 健康板块完整实现说明（Claude Code 直接使用）

> **状态**：引擎 + UI + Store + 来信联动 + 单元测试 **已实现**  
> **项目**：`CC project/subhealth-monitor`  
> **待办规格**：[CLAUDE_CODE_ROADMAP.md](./CLAUDE_CODE_ROADMAP.md) · [HOMEPAGE_REDESIGN.md](./HOMEPAGE_REDESIGN.md) · [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)  
> **规则文档**：`docs/body-weather-rules.md` 等（纯文字，无需图片）

---

## 1. 架构一览

```
DailyWatchRow + PersonalBaseline + VoiceExtraction
              ↓
    lib/wellnessSignals.ts     ← 信号：hrvRatio, rhrDelta, …
              ↓
┌─────────────────────────────────────────────────────────┐
│ engine/bodyWeather.ts      → BodyWeatherSnapshot        │
│ engine/moodInference.ts    → MoodInferenceResult        │
│ engine/wuyinPrescription.ts → WuyinPrescription | null   │
│ engine/tcmCircadian.ts     → PersonalCircadianPlan     │
│ engine/wellnessSnapshot.ts → WellnessSnapshot（聚合）   │
└─────────────────────────────────────────────────────────┘
              ↓
    store.wellness（refreshAlerts 时更新）
              ↓
    HomePage UI + weeklyLetter 开头融合
```

---

## 2. 已实现文件清单

### 引擎层

| 文件 | 职责 |
|------|------|
| `src/lib/wellnessSignals.ts` | 从当日/昨日行 + 基线计算统一信号 |
| `src/engine/bodyWeather.ts` | 按 `BODY_WEATHER_RULES` 匹配天气 |
| `src/engine/moodInference.ts` | 语音优先 + 生理规则加权推断情绪 |
| `src/engine/wuyinPrescription.ts` | mood → 五音处方 |
| `src/engine/tcmCircadian.ts` | 个人入睡窗口（代理，非真实经络） |
| `src/engine/wellnessSnapshot.ts` | `buildWellnessSnapshot()` 入口 |

### 配置层

| 文件 | 职责 |
|------|------|
| `src/config/bodyWeatherRules.ts` | 阈值 + 规则元数据 + 文案 |
| `src/config/moodInferenceRules.ts` | 情绪规则 + gentleNote |
| `src/config/wuyinToneMap.ts` | 五音 Hz + 处方 + 音频默认参数 |
| `src/config/tcmMeridianSchedule.ts` | 时辰表 + circadian 规则 |

### 类型

| 文件 |
|------|
| `src/types/bodyWeather.ts` |
| `src/types/mood.ts` |
| `src/types/tcm.ts` |
| `src/types/wellness.ts` |

### UI 组件

| 组件 | 位置 |
|------|------|
| `BodyWeatherCard` | 首页「今日身体天气」 |
| `WeatherStamp` | 信封 Modal 印章 |
| `WuyinSessionCard` | 五音哼唱练习（Web Audio） |
| `CircadianHintCard` | 东方作息参考条 |

### 服务

| 文件 | 职责 |
|------|------|
| `src/services/audioTone.ts` | `playReferenceTone` / `playToneForDuration` |

### Store / 来信

| 文件 | 改动 |
|------|------|
| `src/store/useAppStore.ts` | 新增 `wellness`，`refreshAlerts` 内计算 |
| `src/services/weeklyLetter.ts` | `generateWeeklyLetter(..., wellness?)` 融合 `letterOpener` |
| `src/pages/HomePage.tsx` | 挂载天气 / 五音 / 作息卡片 |
| `src/lib/baselines.ts` | 增加 `wristTempRaw` 基线 |

### 测试

| 文件 | 命令 |
|------|------|
| `src/engine/wellness.test.ts` | `npm test` |
| `src/engine/__fixtures__/wellnessFixtures.ts` | 合成数据 |

---

## 3. Claude Code 常用命令

```bash
cd "CC project/subhealth-monitor"
npm install          # 含 vitest
npm test             # 规则引擎单元测试
npm run build        # 类型检查 + 构建
npm run dev          # 本地预览
```

---

## 4. 扩展规则（不改引擎结构）

### 4.1 新增身体天气规则

1. 在 `docs/body-weather-rules.md` 增加一行规则表  
2. 在 `src/config/bodyWeatherRules.ts` 的 `BODY_WEATHER_RULES` 追加条目  
3. 在 `src/engine/bodyWeather.ts` 的 `RULE_MATCHERS` 实现 `match` 函数  
4. 在 `BODY_WEATHER_COPY` 增加文案（若新 weatherId）  
5. 在 `wellnessFixtures.ts` + `wellness.test.ts` 加用例  

### 4.2 新增情绪推断规则

1. `docs/mood-inference-rules.md`  
2. `MOOD_INFERENCE_RULES` 追加  
3. `moodInference.ts` → `ruleMatches` switch 增加 case  
4. 补 `evidence-bibliography.md` 文献 ID  

### 4.3 校准阈值

编辑各 `config/*Rules.ts` 中的 `THRESHOLDS` 常量；**不要**在 UI 暴露原始数值。

---

## 5. 已知局限（需在文献 doc 中持续标注）

| 局限 | 当前处理 |
|------|----------|
| Apple Watch HRV 仅宜趋势 | 全部用相对 42 日基线；confidence 上限 medium |
| 无褪黑素 / 无 sleep segment 起始时刻 | `tcmCircadian` 用 14 日 sleep 均值代理 onset，confidence low/medium |
| 日聚合数据无法做日内动态天气 | 当前为「当日整体天气」；扩展需改 `health_parse.py` |
| 五音频率 | 象征性参考音高 + 免责声明，非医疗共振 |

---

## 6. 待 Claude Code 可选续作

- [ ] `health_parse.py` 导出 sleep segment `startDate` → 提高 `tcmCircadian` 精度  
- [ ] Settings 增加「显示高级健康数据」开关，暴露 `debugFactors` / `scores`  
- [ ] `LeftSidebar` 集成 `MiniCalendar` 与天气印章（若布局 v2 未完成）  
- [ ] 将 `evidence-bibliography.md` 中 TODO 文献填全并标 VERIFIED  

---

## 7. 验收清单

- [ ] `npm test` 全绿  
- [ ] `npm run build` 通过  
- [ ] 首页显示：身体天气卡片 + 来信含 weather opener + 五音卡片（anxiety 场景）  
- [ ] 新来信 Modal 信封上有 WeatherStamp  
- [ ] 前台无 HRV 数值、无 EvidenceBadge、无经络诊断用语  

---

*文档版本：2026-06-16 · 与代码同步*
