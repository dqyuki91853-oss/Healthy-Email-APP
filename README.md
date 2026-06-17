# 亚健康监测与预警模型

基于 Apple Watch 健康数据与口述录音的 Web 应用，对 9 个亚健康方向进行持续监测与早期预警。

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- Recharts（时间序列）
- Zustand（状态）
- Dexie.js / IndexedDB（本地存储）
- Web Speech API + 可扩展 LLM 提取

## 快速开始

```bash
npm install
npm run dev
```

## 功能概览

- **数据导入**：Apple Health 导出 `.zip` / `export.xml` / 通用 CSV
- **仪表盘**：RHR、HRV、步数、睡眠等时间序列，叠加文献阈值与可靠性标识
- **每日记录**：语音/文字 → 结构化饮食、情绪、症状提取（含低置信度追问）
- **预测引擎**：9 方向规则引擎（痛风、代谢、NAFLD、缺铁、IBS、倦怠、情绪、脑雾、女性健康）
- **预警中心**：绿/黄/橙/红四级风险提示（非诊断措辞）
- **隐私**：数据默认仅存本地，支持 JSON 导出

## 阈值来源

所有阈值均来自 `Cursor_Web_Prompt.md` 中标注的同行评审文献，UI 区分 🏥 强证据 / 📊 中等 / 💡 启发式。

## 相关项目

Python 原型逻辑可参考 `~/Projects/uric-acid-monitor`。
