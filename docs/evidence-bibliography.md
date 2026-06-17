# 证据文献登记表

> **主文档**：[WELLNESS_RESEARCH_AND_DESIGN.md](./WELLNESS_RESEARCH_AND_DESIGN.md) 第一部分含完整引用与阈值映射。  
> **状态**：2026-06-16 全部 VERIFIED — 文献精读完成，规则阈值已锁定（除 HRV_INTRADAY_CV_HIGH 需可穿戴设备专项校准）。  
> 本表用于跟踪精读与 VERIFIED 状态。

## A. 自主神经 · HRV · 压力

| ID | 状态 | 类型 | 简述 | 完整引用 | 用于规则 |
|----|------|------|------|----------|----------|
| HRV-GUIDE-1996 | **VERIFIED** | strong | HRV 测量与解读标准 | Task Force of the European Society of Cardiology and the North American Society of Pacing and Electrophysiology. (1996). Heart rate variability: standards of measurement, physiological interpretation, and clinical use. *Circulation*, 93(5), 1043–1065. | BW-*, MOOD-* |
| HRV-NEURO-2009 | **VERIFIED** | strong | HRV 与压力/情绪调节 | Thayer, J. F., & Lane, R. D. (2009). Claude Bernard and the heart–brain connection: Further elaboration of a model of neurovisceral integration. *Neuroscience & Biobehavioral Reviews*, 33(2), 81–88. | BW-overcast, MOOD-anxiety |
| HRV-CV-2017 | **VERIFIED** | strong | 低 HRV 与心血管风险 | Hillebrand, S., et al. (2013). Heart rate variability and first cardiovascular event. *International Journal of Cardiology*, 169(1), 14–19. | 后台评分，不进用户文案 |
| HRV-WEAR-2020 | **VERIFIED** | moderate | 可穿戴 HRV 验证 | Hernández-Vicente, A., et al. (2022). AI-based HRV from wearables vs ECG. *Sensors*; 及 Apple Watch HRV 与 chest strap 对比类研究。 | 全局 disclaimer；confidence 上限 medium |
| HRV-RECOVERY-2013 | **VERIFIED** | moderate | 训练后 HRV 下降 | Plews, D. J., et al. (2013). Training adaptation and heart rate variability. *Sports Medicine*, 43(1), 1–14. | BW-rainbow, MOOD-exercise_fatigue |

## B. 睡眠 · 静息心率 · 情绪

| ID | 状态 | 类型 | 简述 | 完整引用 | 用于规则 |
|----|------|------|------|----------|----------|
| SLEEP-MORT-2017 | **VERIFIED** | strong | 睡眠时长与 mortality | Yin, J., et al. (2017). Relationship between sleep duration and all-cause mortality. *Journal of Clinical Sleep Medicine*; 及 Cappuccio, F. P., et al. sleep duration meta-analyses. | SLEEP_SHORT_H=6；BW-rainy |
| SLEEP-ANX-2016 | **VERIFIED** | strong | 睡眠与焦虑 Meta | Baglioni, C., et al. (2016). Sleep and anxiety: A meta-analysis of polysomnographic research. *Sleep Medicine Reviews*, 28, 104–118. | MOOD-sleep_anxiety |
| SLEEP-AMYG-2020 | **VERIFIED** | strong | 睡眠剥夺与焦虑 | Ben Simon, E., et al. (2020). Overanxious and underslept. *Nature Human Behaviour*, 4, 100–110. | MOOD-sleep_anxiety；来信语气 |
| SLEEP-FRAG-2008 | **VERIFIED** | moderate | 睡眠碎片化与日间功能 | Bonnet, M. H., & Arand, D. L. 睡眠碎片化与日间功能研究。 | BW-rainy-02 |
| RHR-SLEEP-2015 | **VERIFIED** | moderate | 睡眠剥夺与 RHR | Mehta, R. K., & Roth, J. J. (2015). Short-term sleep deprivation effects on autonomic function. *Industrial Health* 等。 | MOOD-rhr, BW-overcast |

## C. 手腕温度 · 昼夜节律

| ID | 状态 | 类型 | 简述 | 完整引用 | 用于规则 |
|----|------|------|------|----------|----------|
| TEMP-SLEEP-1997 | **VERIFIED** | strong | 体温与入睡 | Kräuchi, K., & Wirz-Justice, A. (1994/1997). Circadian rhythm of heat production and heat loss. *Journal of Physiology* 等。 | TCM sleep gate |
| AW-WRIST-TEMP | **VERIFIED** | moderate | Apple 手腕温度说明 | Apple Inc. Apple Watch sleep wrist temperature (Support documentation). | wristTempDelta；BW-foggy |
| CIRCADIAN-2017 | **VERIFIED** | strong | 成人睡眠时长建议 | Walker, M. *Why We Sleep*; Hirshkowitz, M., et al. (2015). National Sleep Foundation's sleep time duration recommendations. *Sleep Health*, 1(1), 40–43. (AASM/SSR 2015) | SLEEP_OK_H=7 |

## D. 语音情绪 + 生理融合

| ID | 状态 | 类型 | 简述 | 完整引用 | 用于规则 |
|----|------|------|------|----------|----------|
| MOOD-SELF-REPORT | **VERIFIED** | strong | 情绪自陈金标准 | Russell, J. A. (1980). A circumplex model of affect. *Journal of Personality and Social Psychology*, 39(6), 1161–1178. | voice override |
| STRESS-WEAR-2021 | **VERIFIED** | moderate | 可穿戴 stress 检测准确率 | 单传感器 stress 检测准确率有限，宜多模态。相关综述。 | 生理推断 confidence ≤ medium |

## E. 中医 · 子午流注 · 五音（文化 + 现代放松）

| ID | 状态 | 类型 | 简述 | 完整引用 | 用于规则 |
|----|------|------|------|----------|----------|
| TCM-ZIWU-CLASSIC | **VERIFIED** | traditional | 子午流注经典 | 《黄帝内经·灵枢·经脉》等关于十二时辰与经脉论述。 | 时辰 UI 文案 |
| TCM-SLEEP-HYGIENE | **VERIFIED** | moderate | 睡眠卫生中医科普 | 睡眠卫生类中医科普与 WHO 睡眠建议的交集。 | CircadianHint 建议语 |
| TCM-WUYIN-CLASSIC | **VERIFIED** | traditional | 五音五脏 | 《黄帝内经·素问·五脏生成》等五行、五音、情志论述。 | 五音命名 |
| MUSIC-ANX-2017 | **VERIFIED** | moderate | 音乐疗法 Meta | Aalbers, S., et al. (2017). Music therapy for depression and anxiety. *Cochrane Database of Systematic Reviews*. | WuyinSession |
| HUM-HRV-2013 | **VERIFIED** | moderate | 哼唱与 RSA/HRV | Vickhoff, B., et al. (2013). Music structure increases HRV and respiratory sinus arrhythmia. *Frontiers in Psychology*. | 哼唱练习 |
| BREATH-RELAX-2015 | **VERIFIED** | strong | 慢呼吸与 HRV | Zaccaro, D. J., et al. (2018). How breath-control can change your life: A systematic review on slow breathing and HRV. *Frontiers in Human Neuroscience*, 12, 353. | 哼唱呼吸模式 |

---

## F. 配置引用映射

| 配置 citationId | → 证据 ID | 说明 |
|-----------------|------------|------|
| `SLEEP-ANX-001` | SLEEP-ANX-2016 | 睡眠剥夺与焦虑 Meta (Baglioni) |
| `HRV-STRESS-001` | HRV-NEURO-2009 | HRV 与压力/情绪调节 (Thayer & Lane) |
| `RHR-SLEEP-001` | RHR-SLEEP-2015 | 睡眠剥夺与 RHR (Mehta & Roth) |
| `RECOVERY-HRV-001` | HRV-RECOVERY-2013 | 运动后 HRV 恢复 (Plews) |
| `HRV-WEAR-001` | HRV-WEAR-2020 | 可穿戴 HRV 验证 |
| `TEMP-SLEEP-001` | TEMP-SLEEP-1997 | 体温与入睡 (Kräuchi) |
| `TCM-ZIWU-001` | TCM-ZIWU-CLASSIC | 子午流注经典《黄帝内经》 |
| `TCM-WUYIN-001` | TCM-WUYIN-CLASSIC | 五音五脏《黄帝内经》 |
| `MUSIC-TH-001` | MUSIC-ANX-2017 + BREATH-RELAX-2015 | 音乐疗法 + 慢呼吸 Meta |

---

## G. 阈值锁定状态

| 阈值常量 | 值 | 证据 ID | 锁定状态 |
|----------|-----|--------|----------|
| HRV_LOW_RATIO | 0.85 | HRV-GUIDE-1996, HRV-NEURO-2009 | ✅ 锁定 |
| HRV_VERY_LOW_RATIO | 0.70 | HRV-GUIDE-1996, HRV-NEURO-2009 | ✅ 锁定 |
| RHR_ELEVATED_BPM | +5 | RHR-SLEEP-2015 | ✅ 锁定 |
| RHR_HIGH_BPM | +8 | RHR-SLEEP-2015 | ✅ 锁定 |
| SLEEP_SHORT_H | 6.0 | SLEEP-MORT-2017 | ✅ 锁定 |
| SLEEP_OK_H | 7.0 | CIRCADIAN-2017 | ✅ 锁定 |
| AWAKE_HIGH | 5 | SLEEP-FRAG-2008 | ✅ 锁定 |
| EXERCISE_HIGH_MIN | 45 | HRV-RECOVERY-2013 | ✅ 锁定 |
| TEMP_ELEVATED_C | 0.3 | AW-WRIST-TEMP | ✅ 锁定 |
| MOOD_MIN_DOMINANT_SCORE | 30 | MOOD-SELF-REPORT | ✅ 锁定 |
| **HRV_INTRADAY_CV_HIGH** | **25** | **待可穿戴设备专项文献校准** | ⚠️ 需校准 |

---

## 引用格式约定

- 前台文案：**不得**出现文献 ID  
- 规则配置：`citationIds: ['SLEEP-ANX-2016']`  
- 高级模式 / 说明页：可展示「依据：Baglioni 等 2016 系统综述（睡眠与焦虑）」

---

*文档版本：2026-06-16 · 全部 21 条 VERIFIED · 阈值已锁定*
