# 五音音频来源方案（推荐 · 已采用）

> **策略**：**CC0 本地托管** — 下载后放 `public/audio/wuyin/`，不用外链热链。  
> **跟哼参考音**：仍用 Web Audio 单音（`WuyinHumFoldout`），与歌单分离。

---

## 1. 为什么选 OpenLo-Fi

| 项 | OpenLo-Fi |
|----|-----------|
| 许可 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — 可商用、可改、**无需署名** |
| 规模 | 166 首 Lofi / ambient / 季节天气等 |
| 清单 | [`catalog.json`](https://github.com/btahir/open-lofi/blob/main/catalog.json) |
| 获取 | [Release zip](https://github.com/btahir/open-lofi/releases/latest/download/openlofi.zip) |

**不采用**：Spotify/YouTube 外链、Freesound 热链（CORS/许可复杂）、全量 zip 进 git（体积大）。

---

## 2. 目录结构

```
public/audio/wuyin/open-lofi/   ← mp3 文件（gitignore，本地/CI 拉取）
src/lib/wuyinAudioLibrary.ts    ← 曲目标题 + src 路径 + tone 映射
scripts/fetch_wuyin_audio.py    ← 从 release zip 解压策展列表
```

---

## 3. 五音 → 曲目策展（每音 3 类各 1 首）

| 五音 | ambient | melody | nature* |
|------|---------|--------|---------|
| 宫 | Teacup Morning Fog | Dust on the Morning Keys | Mist Over Green Fields |
| 商 | Bells Before Sunrise | Stacks of Quiet Books | Sidewalk Puddles |
| 角 | Bloom Between Showers | Spring Garden Loops | Petals in the Breeze |
| 徵 | Fireplace Loop | Golden Afternoon Groove | Amber Windowpane |
| 羽 | Underwater Dreamscape | Satellite Lullaby | Tide Pools at Twilight |

\* `nature` 类用季节/天气 Lofi 轨，听感接近自然声。

---

## 4. 播放逻辑

```
WuyinMiniPlayer
  if track.src → HTMLAudioElement（loop 可选）
  else         → playWuyinTrack() 合成 fallback
```

---

## 5. 安装音频（开发者）

**推荐：只下 15 首（约 50–80 MB，不用拉 528 MB 整包）**

```bash
pip3 install -r scripts/requirements-wuyin.txt
python3 scripts/fetch_wuyin_audio.py
```

脚本会用 HTTP Range 从 release zip **按需抽取**策展曲目，避开 GitHub 大文件限流。

### GitHub 仍失败时

**方案 A — 浏览器下整包，本地解压（最稳）**

1. 浏览器打开 [openlofi.zip](https://github.com/btahir/open-lofi/releases/download/v1.0.0/openlofi.zip)（可挂代理 / 错峰）
2. 保存到 `~/Downloads/openlofi.zip`
3. 运行：

```bash
python3 scripts/fetch_wuyin_audio.py --from-zip ~/Downloads/openlofi.zip
```

**方案 B — 整包 + curl 断点续传 + 镜像**

```bash
python3 scripts/fetch_wuyin_audio.py --full
```

**方案 C — 无 mp3 时**

播放器自动回退 Web Audio 合成音；不影响其他功能。

`public/audio/wuyin/open-lofi/*.mp3` 已加入 `.gitignore`。

---

## 6. 后续扩展（P2）

- Freesound API：仅 CC0，**服务端下载缓存**，不浏览器直链
- 设置页「音频来源说明」+ OpenLo-Fi 链接

---

*五音音频方案 · 2026-06-16*
