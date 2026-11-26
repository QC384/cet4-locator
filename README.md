# CET4 原文定位器 · PWA

大学英语四级「原文定位器」的渐进式网页应用（PWA）封装，可直接在手机浏览器（Edge / Chrome / Safari）安装为独立 App。

- 题库：76 套 / 4180 题（听力 1900 + 阅读 2280）
- 能力：定位答案句、题眼高亮（含同义替换/词形）、懒笔记逐字解析、作答统计、明暗主题
- 离线：首次打开后 Service Worker 缓存整页，断网可用

## 结构

```
build/build.mjs              构建脚本：拉取应用单文件 → 注入 PWA 头 → 生成图标/清单/SW → dist/
.github/workflows/pages.yml  GitHub Actions：构建并部署到 GitHub Pages
```

应用主体（约 11MB 单文件 HTML）不直接入库，构建时从 `APP_URL` 拉取（默认指向已发布的 v18 构建）。
如需指向新版本，修改 `build/build.mjs` 顶部的 `APP_URL` 或在工作流中注入同名环境变量。

## 本地构建

```bash
node build/build.mjs
npx serve dist        # 或任意静态服务器，需 https 或 localhost 才能注册 SW
```

## 安装

1. 手机浏览器打开 Pages 地址；
2. Android Edge / Chrome：菜单 → 「添加到手机」/「安装应用」；
3. 安装后从桌面图标启动，全屏独立窗口运行。

## 说明

题库与定位句以懒笔记为准，答案非官方发布。
