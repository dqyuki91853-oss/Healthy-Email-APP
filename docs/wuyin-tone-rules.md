# 五音疗疾 — 规则表（骨架）

> **产品形态**：60–90 秒**单音哼唱练习**（Web Audio sine），不是歌单。  
> **文化锚点**：角徵宫商羽 ↔ 五脏 ↔ 情志（传统参考）；现代侧：**音乐治疗 / 哼唱放松**（待填 RCT）。  
> **配置（待建）**：`src/config/wuyinToneMap.ts`  
> **引擎（待建）**：`src/engine/wuyinPrescription.ts`

---

## 1. 五音静态映射表

| toneId | 中文 | 传统脏腑 | 传统情志 | 频率 Hz（象征） | MIDI 近似 | citationIds |
|--------|------|----------|----------|-----------------|-----------|-------------|
| `jue` | 角 | 肝 | 怒/郁 | 293.66 (D4) | D4 | TCM-WUYIN-001, MUSIC-TH-001 |
| `zhi` | 徵 | 心 | 喜/急/扰 | 329.63 (E4) | E4 | TCM-WUYIN-001, MUSIC-TH-001 |
| `gong` | 宫 | 脾 | 思/虑 | 261.63 (C4) | C4 | TCM-WUYIN-001 |
| `shang` | 商 | 肺 | 悲/忧 | 220.00 (A3) | A3 | TCM-WUYIN-001 |
| `yu` | 羽 | 肾 | 恐/虚 | 196.00 (G3) | G3 | TCM-WUYIN-001 |

**免责声明（必显）**：频率为**练习用参考音高**，非医疗共振治疗。

---

## 2. moodTag → 五音 处方规则

| ruleId | 条件 | → toneId | 时长 s | 哼唱模式 | instructionText（骨架） |
|--------|------|----------|--------|----------|-------------------------|
| `WY-anxiety-01` | `dominant == anxiety` | `zhi` | 90 | 吸-哼-呼 4-6-6 | 找到「徵」音，轻轻哼，感觉胸腔慢慢松开。 |
| `WY-low-01` | `dominant == low_mood` | `shang` | 90 | 长呼气哼 | 用「商」音配长呼气，不追求响，追求稳。 |
| `WY-irritable-01` | `dominant == irritable` | `jue` | 75 | 短哼 × 6 轮 | 「角」音短一点、慢一下，像把肩上的劲放下来。 |
| `WY-fatigue-01` | `dominant == fatigue` | `gong` | 90 | 低哼 sustained | 「宫」音低而稳，适合今天有点累的身体。 |
| `WY-fear-01` | `dominant == fearful` | `yu` | 90 | 极低哼 | 仅 high confidence 时启用 |
| `WY-calm-01` | `dominant == calm` | — | 0 | — | 不推荐音疗 |
| `WY-unknown-01` | `dominant == unknown` | `gong` | 60 | 默认温和 | 不确定时给最中性的「宫」|

### 二级 override（可选）

| ruleId | 条件 | 调整 |
|--------|------|------|
| `WY-weather-rainy` | `weatherId == rainy` | 时长 +15s，文案加「撑伞慢慢哼」 |
| `WY-voice-explicit` | voice 含「焦虑」 | 强制 zhi，忽略 fatigue 规则 |

---

## 3. 会话参数（Web Audio 骨架）

| 参数 | 值 | 说明 |
|------|-----|------|
| `waveform` | sine | 纯音 |
| `fadeInMs` | 800 | 避免爆音 |
| `fadeOutMs` | 1200 | |
| `volume` | 0.15 | 偏小，鼓励哼而非听 |
| `showPitchGuide` | true | 可选播放 2s 参考音后静音跟哼 |

---

## 4. 输出结构

```ts
interface WuyinPrescription {
  toneId: WuyinToneId
  label: string           // 「徵音 · 心」
  frequencyHz: number
  durationSec: number
  humPattern: string      // 机器可读模式 id
  instructionText: string
  disclaimer: string      // 固定短句
  matchedRuleId: string
  citationIds: string[]
}
```

---

## 5. 待办

- [ ] MUSIC-TH-001 系统综述是否支持「单音 vs 旋律」
- [ ] VOICE-HUM-001 哼唱呼吸文献
- [ ] 实现 `audioTone.ts` + `WuyinSession.tsx`
- [ ] 用户「跳过 / 完成」反馈写入 localStorage 供来信引用
