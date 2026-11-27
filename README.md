# 四级原文定位器 · PWA

非官方、非商业的个人学习工具：把「题干 → 正确选项 → 原文定位句」压缩到一次点击。本仓库只负责构建与部署，题目内容版权归原权利人。

- 题库：76 套 / 4180 题（听力 1900 + 阅读 2280）
- 能力：定位答案句、题眼高亮（含同义替换/词形）、逐字解析对照、作答统计、明暗主题
- 离线：首次打开后 Service Worker 缓存整页，断网可用
- 当前版本：v20.8

> 同站点另有一个**独立的**附加应用「四六级阅读批注 Demo」，部署在 `/ink/` 子路径，与本站相互隔离，详见下文。

## 结构

```
build/app.config.mjs         发版时只改这里：APP_URL（根站应用地址）、VERSION（缓存版本）、INK_FILE / INK_VERSION / INK_APP_VERSION（附加应用）
build/build.mjs              构建脚本：根站远端拉取 → 注入 PWA 头 → 生成图标/清单/SW；同时构建 /ink/ 子站
build/ink-theme.css          /ink/ 子站品牌主题覆盖（琥珀→玫红）
ink/app.html                 附加应用「四六级阅读批注 Demo」单文件（约 4.3MB，自包含）
CHANGELOG.md                 附加应用的版本更新记录
.github/workflows/pages.yml  GitHub Actions：构建并部署到 GitHub Pages
NOTICE.md                    内容权利归属与使用限制
```

根站应用主体（约 11MB 单文件 HTML）不直接入库，构建时从 `APP_URL` 拉取；也可用 workflow 同名环境变量覆盖。

## 版本管理

| 文件 | 作用 |
|-|-|
| `build/app.config.mjs` → `VERSION` | 根站缓存版本（`v20.8`），改动即触发根站 SW 更新 |
| `build/app.config.mjs` → `INK_VERSION` | `/ink/` 子站缓存版本（`ink-v5`），改动即触发子站 SW 更新 |
| `build/app.config.mjs` → `INK_APP_VERSION` | 附加应用的应用版本号（`1.5.0`），写入 PWA 清单与页面 `meta` |
| 应用内 `core.js` → `APP_VERSION` / `APP_BUILD` / `APP_CHANGELOG` | 应用版本号与更新日志，界面左上角徽标与「V」快捷键可查看 |
| `CHANGELOG.md` | 附加应用版本更新记录 |

发版顺序：先改应用内 `core.js` 的 `APP_VERSION` 与 `CHANGELOG.md`，再同步 `build/app.config.mjs` 中的 `INK_APP_VERSION` / `INK_VERSION`，最后构建并 push。
`INK_VERSION` 与 `INK_APP_VERSION` 必须同时递增，否则旧缓存不会被清理。

## 同站附加应用：四六级阅读批注 Demo（/ink/）

与根站是**两个互不干扰的 PWA**，不要混用：

| 项目 | 根站（四级原文定位器） | 附加应用（四六级阅读批注 Demo） |
|-|-|-|
| 地址 | `/` | `/ink/` |
| 题目范围 | 76 套 4180 题（听力 + 阅读） | 70 套 2100 题（2016–2026 四级阅读） |
| 主要能力 | 原文定位、题眼高亮、逐字对照 | 点词查词、压感批注、交卷判分与复盘 |
| 构建来源 | 远端 `APP_URL` 拉取 | 仓库内 `ink/app.html` |
| 清单 / 缓存 | 根 `manifest.webmanifest`、`v20.8-shell` | `/ink/manifest.webmanifest`、`ink-v5-shell` |
| 应用版本 | v20.8 | 1.5.0 |
| 安装 | 可单独安装 | 可单独安装，图标与界面主色为琥珀→玫红，区别于根站靛蓝 |

- 独立 Service Worker（作用域 `/ink/`），根站 SW 会跳过 `/ink/` 请求，两个缓存互不删除。
- 目录内自带 `manifest.webmanifest`、`sw.js`、`icon-*.png`，均由 `build/build.mjs` 生成。
- 首次访问 `/ink/` 后即可离线使用，不会影响根站缓存。

## 部署

仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**，否则 deploy 步骤会报 `Ensure GitHub Pages has been enabled`。
开启后每次 push 到 `main` 会自动构建并发布。

- 根站：https://qc384.github.io/cet4-locator/
- 附加应用：https://qc384.github.io/cet4-locator/ink/

## 版权与使用边界

- 性质：非官方学习工具，与 CET 考试主办方、懒笔记均无隶属或授权关系。
- 权利：真题原文与解析文字版权归原命题方、懒笔记等原权利人；本项目只做检索呈现，不提供下载或再分发。
- 限制：仅供个人学习，禁止商用、转载、打包售卖与收费培训。
- 不索引：`robots.txt` 全站 Disallow，页面 noindex/nofollow。
- 下架：权利人请在 Issues 提出，将删除对应内容或下线站点。

详见 [NOTICE.md](./NOTICE.md)。

## 本地构建

```bash
node build/build.mjs     # 输出 dist/（根站）与 dist/ink/（附加应用）
npx serve dist           # 或任意静态服务器，需 https 或 localhost 才能注册 SW
```

## 安装

1. 手机浏览器打开对应地址（根站或 `/ink/`）；
2. Android Edge / Chrome：菜单 → 「添加到手机」/「安装应用」；
3. 安装后从桌面图标启动，全屏独立窗口运行；两个应用可同时安装、各自独立。
