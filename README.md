# 四六级阅读批注 Demo · PWA

非官方、非商业的个人学习工具：把「题干 → 正确选项 → 原文定位句」压缩到一次点击，并支持点词查词与手写批注。本仓库只负责构建与部署，题目内容版权归原权利人。

- 题库：70 套 / 2,100 题（2016–2026 四级阅读，含选词填空、长篇阅读、仔细阅读）
- 能力：原文定位、点词查词（词卡跟随单词、最近查词切换）、压感批注与双指轻点撤销、交卷判分与复盘、题库筛选导入、明暗主题
- 离线：首次打开后 Service Worker 缓存整页，断网可用
- 当前版本：v21（单文件应用入库，本地优先构建）

## 结构

```
app.html                     单文件应用（构建时本地优先；缺失时回退 APP_URL）
build/app.config.mjs         发版时只改这里：APP_FILE / APP_URL（兜底地址）与 VERSION（缓存版本）
build/build.mjs              构建脚本：读取应用单文件 → 注入 PWA 头 → 生成图标/清单/SW → dist/
.github/workflows/pages.yml  GitHub Actions：构建并部署到 GitHub Pages
NOTICE.md                    内容权利归属与使用限制
```

`app.html` 约 4.3MB，是自包含的单文件应用；构建时优先读取本地文件，若缺失再从 `APP_URL` 拉取。

## 部署

仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**，否则 deploy 步骤会报 `Ensure GitHub Pages has been enabled`。
开启后每次 push 到 `main` 会自动构建并发布。

站点地址：https://qc384.github.io/cet4-locator/

> 若该地址返回 404，说明 Pages 被关闭（`has_pages=false`），站点处于下线状态，仅本地单文件可用。

## 版权与使用边界

- 性质：非官方学习工具，与 CET 考试主办方、懒笔记均无隶属或授权关系。
- 权利：真题原文与解析文字版权归原命题方、懒笔记等原权利人；本项目只做检索呈现，不提供下载或再分发。
- 限制：仅供个人学习，禁止商用、转载、打包售卖与收费培训。
- 不索引：`robots.txt` 全站 Disallow，页面 noindex/nofollow。
- 下架：权利人请在 Issues 提出，将删除对应内容或下线站点。

详见 [NOTICE.md](./NOTICE.md)。

## 本地构建

```bash
node build/build.mjs
npx serve dist        # 或任意静态服务器，需 https 或 localhost 才能注册 SW
```

## 安装

1. 手机浏览器打开 Pages 地址；
2. Android Edge / Chrome：菜单 → 「添加到手机」/「安装应用」；
3. 安装后从桌面图标启动，全屏独立窗口运行。
