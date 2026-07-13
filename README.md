# 健康来信 · Healthy Letter

> **Healthy-Email-APP** — 私人 Mac 健康工作室（React + Tauri）  
> Apple Watch 数据 + 饮食口述 → 身体天气、周报花信、五音疗愈与 N=1 个人洞察。  
> **非医疗器械，不作诊断。**

---

## 这是什么 · What is this?

**健康来信**把 Apple Watch 的恢复信号（睡眠、HRV、步数等）与每日饮食口述合在一起，用天气、四季、茶语、小植园等隐喻呈现状态，并生成本周「花信」周报。数据默认只存在本机。

**Healthy Letter** is a personal wellness studio for macOS. It blends Apple Watch recovery signals with voice/text meal logs, surfaces patterns through gentle metaphors (body weather, seasons, tea, a tiny plant garden), and writes a weekly “flower letter” — all **local-first**, **not a medical device**.

---

## 主要功能 · Features

### 首页工作室 · Home studio

| 模块 | 说明 · Description |
|------|---------------------|
| **你的花信** | 周报信封：点击展开读信、回信、历史归档 |
| **今日身体天气** | 个人 N=1 恢复隐喻（晴/雾/雨等），非临床分级 |
| **收工提醒** | 个人作息窗口 + 五音聆听建议（Mac 本地通知） |
| **今日茶语** | 按身体季节推荐茶饮方向（不展示诊断） |
| **小植园** | 近 7 天睡眠/运动映射植物状态（生长/蔫了等） |
| **身体四季** | 个人生理季（春夏秋冬）与节奏建议 |
| **五音疗愈道场** | 宫商角徵羽处方、跟哼、歌单/白噪音 |

### 导航 · Navigation

| Tab | 路由 | 功能 |
|-----|------|------|
| 首页 | `/` | 工作室总览 |
| 记录 | `/voice-log` | 语音/文字饮食与状态记录 |
| 珍藏 | `/collection` | 茶收藏、植物图鉴、来信档案 |
| 血压 | `/bp-advisory` | 血压风况与建议（N=1 + 软临床提醒） |
| 四季 | `/seasons` | 身体季节编年 |
| 饮食分析 | `/diet` | 饮食模式、方向评分、食物指纹入口 |
| 设置 | `/settings` | 导入、同步、演示数据、高级选项 |

### 数据与引擎 · Data & engines

- **Apple Health 导入**：`.zip` / `export.xml` / CSV（设置或 `/upload`）
- **血压**：手动录入、CSV 导入、餐后食物指纹（`/blood-pressure`）
- **编年史引擎**：内部气候、今日简报、案卷发现、身体季节（见 `docs/ENGINE_CHRONICLE_SPEC.md`）
- **预警中心** `/alerts`：九方向规则引擎（痛风、代谢、IBS 等）— 绿/黄/橙/红，非诊断措辞
- **高级指标页**：睡眠 / 心脏 / 代谢 / 心理 / 女性（设置内开启）

### 隐私 · Privacy

- 默认 **仅本地**（IndexedDB / localStorage）
- 支持 JSON **导出 / 导入** 备份（设置 → 数据同步）
- 周报生成可选 LLM；不上传则完全离线（除你主动配置的 API）

---

## 快速开始 · Quick start

### 环境 · Prerequisites

- **Node.js** 20+
- **Rust** + **Xcode CLT** — 见 [docs/PERSONAL_MAC_APP.md](docs/PERSONAL_MAC_APP.md)

### Mac App · macOS app

```bash
git clone https://github.com/dqyuki91853-oss/Healthy-Email-APP.git
cd Healthy-Email-APP
npm install
npm run tauri:dev      # 开发窗口
npm run tauri:build    # 产出 .app → src-tauri/target/release/bundle/macos/健康来信.app
npm test               # 单元测试（可选）
```

首次打开若被 Gatekeeper 拦截：**右键 → 打开**。  
详细打包、公证与分发给他人见 [docs/PERSONAL_MAC_APP.md](docs/PERSONAL_MAC_APP.md)。

### 演示数据 · Demo seed

无 Watch 数据时，可在 **设置 → 演示数据** 加载 14 天样例，或：

```bash
npm run seed:demo
```

会写入 `public/data/watch-data.json` 与 `app-sync.json`（需 `WRITE_DEMO_SEED=1`）。

---

## 常用命令 · Scripts

| 命令 | 说明 |
|------|------|
| `npm run tauri:dev` | Mac 窗口开发（含热更新） |
| `npm run tauri:build` | 构建 Mac `.app` / `.dmg` |
| `npm test` | Vitest 单元测试 |
| `npm run seed:demo` | 生成 14 天演示数据 |
| `npm run backup:full` | 合并本地备份 JSON |

---

## 技术栈 · Tech stack

- **UI**：React 19 · TypeScript · Vite · Tailwind CSS 4
- **桌面**：Tauri 2 · 本地通知插件
- **状态 / 存储**：Zustand · Dexie (IndexedDB)
- **图表**：Recharts
- **语音**：Web Speech API + 可扩展 LLM 结构化提取

---

## 项目结构 · Project layout

```
src/
  pages/           # 路由页面（首页、珍藏、血压建议、饮食分析…）
  components/      # UI（home、chronicle、collection、bpAdvisory…）
  engine/          # 身体天气、四季、血压建议、编年史引擎
  lib/             # 存储、导入、演示种子、同步
  config/          # 规则与文案 SSOT
docs/              # 产品/引擎规格书（开发必读）
src-tauri/         # Rust 壳与 bundle 配置
public/data/       # 可选静态同步/演示 JSON
```

**开发文档入口**：[docs/README.md](docs/README.md)  
**血压建议规格**：[docs/BP_ADVISORY_SPEC.md](docs/BP_ADVISORY_SPEC.md)  
**编年史引擎**：[docs/ENGINE_CHRONICLE_SPEC.md](docs/ENGINE_CHRONICLE_SPEC.md)

---

## 免责声明 · Disclaimer

本应用仅供个人健康觉察与生活方式参考，**不能替代**专业医疗诊断或治疗。异常读数或持续不适请就医复测。

This app is for personal wellness awareness only and **is not** a substitute for professional medical advice.

---

## 相关 · Related

- Python 早期原型可参考 `~/Projects/uric-acid-monitor`
- 阈值与文献索引：`docs/evidence-bibliography.md`、`src/config/metricThresholds.ts`
