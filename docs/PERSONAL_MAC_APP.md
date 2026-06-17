# 私人 Mac App（Tauri）

> **定位**：不上架、不售卖，给自己或少数人用的 macOS 桌面应用。  
> **技术**：现有 React + Vite 前端 + [Tauri 2](https://v2.tauri.app/) 原生壳。

---

## 1. 环境准备（一次性）

### 1.1 Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version
```

**国内网络慢时**（项目已含 `.cargo/config.toml` 使用中科大 sparse 镜像；Rust 安装可加）：

```bash
export RUSTUP_DIST_SERVER=https://mirrors.ustc.edu.cn/rust-static
export RUSTUP_UPDATE_ROOT=https://mirrors.ustc.edu.cn/rust-static/rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup default stable
```

### 1.2 Xcode Command Line Tools

```bash
xcode-select --install
```

### 1.3 Node 依赖

```bash
npm install
```

### 1.4 五音音频（可选）

```bash
python3 scripts/fetch_wuyin_audio.py
```

---

## 2. 开发

```bash
npm run tauri:dev
```

会同时启动 Vite（5173）和 Tauri 窗口。前端热更新与浏览器版相同。

---

## 3. 打包 Mac App

```bash
npm run tauri:build
```

产物位置：

| 文件 | 路径 |
|------|------|
| `.app` | `src-tauri/target/release/bundle/macos/健康来信.app` |
| `.dmg` | `src-tauri/target/release/bundle/dmg/` |

### 仅本机使用

双击 `.app`；若 Gatekeeper 提示未验证，**右键 → 打开**。

### 给少数人用（可选）

1. Apple Developer 账号（$99/年）
2. 用 Developer ID 签名 + 公证（notarize）
3. 把 `.dmg` 或 zip 后的 `.app` 发给对方

**不必** 上 Mac App Store。

---

## 4. 项目结构

```
src/                 ← React 前端（与 Web 共用）
src-tauri/           ← Tauri / Rust 壳
  tauri.conf.json    ← 窗口、bundle id、图标
  src/lib.rs
src/lib/platform.ts  ← isTauri() 判断桌面环境
scripts/
  generate_tauri_icon.py
  app-icon.png       ← 图标源图（可换后重新 npx tauri icon）
```

---

## 5. 与 Web 版的差异

| 能力 | Web | Tauri Mac |
|------|-----|-----------|
| Apple Health | 上传 zip/xml/csv | 同上（设置页文件选择） |
| 数据存储 | Dexie / localStorage | 同左，存在本机 |
| **Web → App 饮食** | — | 设置 → **数据同步** → 导入 Web 导出的 JSON |

Mac 上 **HealthKit 自动同步很弱**；继续用 iPhone「健康 → 导出」zip 导入最稳妥。

### Web 饮食记录迁到 App

1. **Web 浏览器** → 设置 → **数据同步** → **导出 JSON**
2. **Mac App** → 设置 → **数据同步** → 选择该 JSON 文件
3. 导入后左侧「最近饮食」与「记录」Tab 即显示相同数据

合并规则：同 `id` 的记录会更新，新 `id` 会追加，不会清空 App 里已有记录。

---

## 6. 常用命令

```bash
npm run dev          # 仅浏览器
npm run tauri:dev    # Mac 窗口开发
npm run tauri:build  # 打出 .app / .dmg
npm test && npm run build
```

### 换图标

```bash
python3 scripts/generate_tauri_icon.py   # 或替换 scripts/app-icon.png
npx tauri icon scripts/app-icon.png
```

---

## 7. 后续可选增强

- `@tauri-apps/plugin-dialog`：原生文件选择器导入 Health
- `@tauri-apps/plugin-fs`：读固定目录下最新 export
- 菜单栏 / 全局快捷键

---

*私人 Mac App · Tauri 2 · 2026-06*
