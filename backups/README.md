# 完整数据备份

- `latest-for-app.json` — Mac App 自动同步源（与 `public/data/app-sync.json` 内容一致）
- `subhealth-full-backup-*.json` — 按日期的完整快照

生成方式：

```bash
npm run backup:full
```

包含：饮食记录、Watch 数据、饮食习惯、dietHistory、localPrefs（五音/来信偏好等）。

Mac App（`npm run tauri:dev`）启动时会自动合并 `public/data/app-sync.json`。

若浏览器里有**更新**的记录，请先在 Web 设置页点击 **「导出完整备份」**，再运行 `npm run backup:full` 或手动将导出文件放入合并脚本。
