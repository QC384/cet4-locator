// 版本一致性自检：README 描述、app.config.mjs 与应用内常量必须对得上。
// 用法：node build/check-versions.mjs
import { readFileSync } from 'node:fs';
import { VERSION, INK_VERSION, INK_APP_VERSION } from './app.config.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const problems = [];

const readme = read('README.md');
const config = read('build/app.config.mjs');
const inkHtml = read('ink/app.html');

// 1. README 里的根站版本号必须与 VERSION 一致
if (!readme.includes(VERSION)) {
  problems.push(`README 未出现根站版本 ${VERSION}（请同步「当前版本」「清单 / 缓存」「应用版本」等处）`);
}
// 根站版本形如 v20.8 / v21.0（不匹配 v1.5.0 这类三段式应用版本）
const rootVersion = /v\d+\.\d+(?!\.\d)/g;
const stale = [...readme.matchAll(rootVersion)].map((m) => m[0]).filter((v) => v !== VERSION);
if (stale.length) {
  problems.push(`README 出现与 VERSION 不一致的版本号：${[...new Set(stale)].join("、")}`);
}

// 2. app.config.mjs 的导出值必须与校验基准一致
if (!config.includes(`export const VERSION = '${VERSION}'`)) {
  problems.push(`app.config.mjs 中 VERSION 的导出值与校验基准不一致（期望 ${VERSION}）`);
}

// 3. 应用内 APP_VERSION 必须与 INK_APP_VERSION 一致
const appVersion = inkHtml.match(/const APP_VERSION = "([^"]+)"/);
if (!appVersion) problems.push('ink/app.html 中找不到 APP_VERSION 常量');
else if (appVersion[1] !== INK_APP_VERSION) {
  problems.push(`ink/app.html 的 APP_VERSION=${appVersion[1]} 与 INK_APP_VERSION=${INK_APP_VERSION} 不一致`);
}

// 4. 缓存版本形如 ink-vN，需为数字；README 里的子站版本也要一致
if (!/^ink-v\d+$/.test(INK_VERSION)) problems.push(`INK_VERSION 格式应为 ink-vN，当前为 ${INK_VERSION}`);
if (!readme.includes(INK_VERSION)) {
  problems.push(`README 未出现子站缓存版本 ${INK_VERSION}（请同步「版本管理」与「清单 / 缓存」两处）`);
}
const staleInk = [...readme.matchAll(/ink-v\d+/g)].map((m) => m[0]).filter((v) => v !== INK_VERSION);
if (staleInk.length) {
  problems.push(`README 出现与 INK_VERSION 不一致的子站版本：${[...new Set(staleInk)].join("、")}`);
}
if (!readme.includes(INK_APP_VERSION)) {
  problems.push(`README 未出现附加应用版本 ${INK_APP_VERSION}（请同步「版本管理」与「应用版本」两处）`);
}

// 5. CHANGELOG 需包含当前应用版本
const changelog = read('CHANGELOG.md');
if (!changelog.includes(`v${INK_APP_VERSION}`)) {
  problems.push(`CHANGELOG.md 缺少 v${INK_APP_VERSION} 条目`);
}

if (problems.length) {
  console.error('版本一致性检查未通过：');
  problems.forEach((p) => console.error('  ✗ ' + p));
  process.exit(1);
}
console.log(`版本一致性检查通过：根站 ${VERSION} / 子站 ${INK_VERSION}（应用 v${INK_APP_VERSION}）`);
