# 四级原文定位器 · PWA

非官方、非商业的个人学习工具：把「题干 → 正确选项 → 原文定位句」压缩到一次点击。本仓库只负责构建与部署，题目内容版权归原权利人。

- 题库：76 套 / 4180 题（听力 1900 + 阅读 2280）
- 能力：定位答案句、题眼高亮（含同义替换/词形）、逐字解析对照、作答统计、明暗主题
- 离线：首次打开后 Service Worker 缓存整页，断网可用

## 结构

```
build/build.mjs              构建脚本：拉取应用单文件 → 注入 PWA 头 → 生成图标/清单/SW → dist/
.github/workflows/pages.yml  GitHub Actions：构建并部署到 GitHub Pages
NOTICE.md                    内容权利归属与使用限制
```

应用主体（约 11MB 单文件 HTML）不直接入库，构建时从 `APP_URL` 拉取。
如需指向新版本，修改 `build/build.mjs` 顶部的 `APP_URL`，或在工作流中注入同名环境变量。

## 部署

仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
开启后每次 push 到 `main` 会自动构建并发布；每 30 分钟还有一次定时重试。

站点地址：https://qc384.github.io/cet4-locator/

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
