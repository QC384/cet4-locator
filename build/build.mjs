// 四级原文定位器 · PWA 构建脚本
// 作用：拉取已发布的单文件应用，注入 PWA 头部与 SW 注册，生成图标与清单，输出 dist/
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import zlib from 'node:zlib';
import { APP_URL, APP_FILE, VERSION } from './app.config.mjs';

const OUT = 'dist';

const MANIFEST = {
  name: '四六级阅读批注 Demo',
  short_name: '四六级批注',
  description: '非官方个人学习工具：四六级阅读 70 套 2100 题，点词查词、压感批注与原文定位。内容版权归原权利人。',
  lang: 'zh-CN',
  dir: 'ltr',
  start_url: './',
  scope: './',
  id: './',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui'],
  orientation: 'any',
  background_color: '#f5f4fc',
  theme_color: '#4956d8',
  categories: ['education', 'productivity'],
  icons: [
    { src: './icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: './icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};

const SW = `const CACHE='${VERSION}-shell';
const ROOT=new URL('./',self.location).href;
const SHELL=[ROOT,'./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(CACHE);for(const u of SHELL){try{await c.add(new Request(u,{cache:'reload'}));}catch(err){}}await self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys()){if(k!==CACHE)await caches.delete(k);}await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const res=await fetch(req);
        const c=await caches.open(CACHE);
        c.put(ROOT,res.clone());
        return res;
      }catch(err){
        return (await caches.match(ROOT))||(await caches.match('./'))||new Response('<h1>四级原文定位器</h1><p>当前离线，且本机还没有缓存页面，请联网后重新打开。</p>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }
  e.respondWith((async()=>{
    const hit=await caches.match(req);
    if(hit)return hit;
    try{
      const res=await fetch(req);
      if(res&&res.status===200&&res.type==='basic'){const c=await caches.open(CACHE);c.put(req,res.clone());}
      return res;
    }catch(err){
      return new Response('',{status:504});
    }
  })());
});
`;

/* ---------- PNG 图标生成（无第三方依赖） ---------- */
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(size, px) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
const clamp01 = v => Math.max(0, Math.min(1, v));
function rrect(px, py, x0, y0, x1, y1, r) {
  // 圆角矩形覆盖率（1px 过渡）
  const cx = Math.min(Math.max(px, x0 + r), x1 - r);
  const cy = Math.min(Math.max(py, y0 + r), y1 - r);
  const d = Math.hypot(px - cx, py - cy) - r;
  return clamp01(-d);
}
function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function blend(dst, i, rgb, a) {
  const A = clamp01(a);
  dst[i] = Math.round(dst[i] * (1 - A) + rgb[0] * A);
  dst[i + 1] = Math.round(dst[i + 1] * (1 - A) + rgb[1] * A);
  dst[i + 2] = Math.round(dst[i + 2] * (1 - A) + rgb[2] * A);
  dst[i + 3] = Math.round(dst[i + 3] * (1 - A) + 255 * A);
}
function drawIcon(size, { maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const c1 = hex('#4956d8'), c2 = hex('#7c5cff');
  const paper = hex('#ffffff'), line = hex('#d9d7ea'), gold = hex('#c9a227');
  const pad = maskable ? 0.18 : 0.08;        // maskable 安全区：内容收缩
  const x0 = pad * size, x1 = (1 - pad) * size;
  const y0 = pad * size, y1 = (1 - pad) * size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // 背景渐变
      const t = (x / size * 0.35 + y / size * 0.65);
      const bg = [Math.round(c1[0] + (c2[0] - c1[0]) * t), Math.round(c1[1] + (c2[1] - c1[1]) * t), Math.round(c1[2] + (c2[2] - c1[2]) * t)];
      blend(px, i, bg, maskable ? 1 : rrect(x, y, 0, 0, size, size, size * 0.22));
      // 卡片
      const cx0 = x0 + (x1 - x0) * 0.16, cx1 = x1 - (x1 - x0) * 0.16;
      const cy0 = y0 + (y1 - y0) * 0.13, cy1 = y1 - (y1 - y0) * 0.13;
      blend(px, i, paper, rrect(x, y, cx0, cy0, cx1, cy1, (cx1 - cx0) * 0.10));
      // 文本行
      const w = cx1 - cx0;
      const l0 = cx0 + w * 0.12, l1 = cx1 - w * 0.12;
      const rows = [0.30, 0.42, 0.54];
      rows.forEach((ry, idx) => {
        const yy = cy0 + (cy1 - cy0) * ry;
        const hh = (cy1 - cy0) * 0.075;
        const right = idx === 1 ? cx0 + w * 0.62 : l1;
        blend(px, i, line, rrect(x, y, l0, yy, right, yy + hh, hh * 0.5));
      });
      // 金色定位条（答案依据）
      const gy = cy0 + (cy1 - cy0) * 0.72;
      blend(px, i, gold, rrect(x, y, l0, gy, cx0 + w * 0.70, gy + (cy1 - cy0) * 0.085, (cy1 - cy0) * 0.0425));
    }
  }
  return encodePNG(size, px);
}

/* ---------- 主流程 ---------- */
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

async function fetchApp() {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0';
  const attempts = [
    { 'user-agent': ua, 'accept': 'text/html,application/xhtml+xml,*/*;q=0.8', 'accept-language': 'zh-CN,zh;q=0.9' },
    { 'user-agent': 'Mozilla/5.0' },
    {}
  ];
  let last = 'unknown';
  for (const headers of attempts) {
    try {
      const r = await fetch(APP_URL, { redirect: 'follow', headers });
      if (!r.ok) { last = 'HTTP ' + r.status + ' (ua=' + (headers['user-agent'] || 'default') + ')'; continue; }
      const body = await r.text();
      if (!body.includes('<html')) { last = 'body without <html>, length=' + body.length; continue; }
      if (body.length < 1000000) { last = 'too short, length=' + body.length; continue; }
      return body;
    } catch (e) {
      last = (e && e.name) + ': ' + (e && e.message) + ' (ua=' + (headers['user-agent'] || 'default') + ')';
    }
  }
  throw new Error('拉取应用失败 -> ' + last);
}

let html;
try {
  html = await readFile(APP_FILE, 'utf8');
  if (!html.includes('<html')) throw new Error('本地 ' + APP_FILE + ' 不是有效 HTML');
  console.log('using local app:', APP_FILE, html.length, 'bytes');
} catch (localErr) {
  console.log('local app unavailable:', localErr && localErr.message, '-> fallback to remote');
  try {
    html = await fetchApp();
  } catch (e) {
    console.log('::error::' + e.message);
    throw e;
  }
}
console.log('app bytes:', html.length);

const headInject = [
  '<link rel="manifest" href="./manifest.webmanifest">',
  '<meta name="robots" content="noindex,nofollow,noarchive">',
  '<meta name="application-name" content="四六级阅读批注 Demo">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="四六级批注">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<link rel="apple-touch-icon" href="./icon-192.png">',
  '<link rel="apple-touch-icon" sizes="512x512" href="./icon-512.png">',
  '<meta name="theme-color" content="#4956d8" media="(prefers-color-scheme: light)">',
  '<meta name="theme-color" content="#17112f" media="(prefers-color-scheme: dark)">'
].join('\n');

html = html.replace(/<\/head>/i, headInject + '\n</head>');
html = html.replace(/<\/body>/i, `<script>
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(function(){});});}
</script>\n</body>`);

await writeFile(`${OUT}/index.html`, html);
await writeFile(`${OUT}/manifest.webmanifest`, JSON.stringify(MANIFEST, null, 2));
await writeFile(`${OUT}/sw.js`, SW);
await writeFile(`${OUT}/icon-192.png`, drawIcon(192));
await writeFile(`${OUT}/icon-512.png`, drawIcon(512));
await writeFile(`${OUT}/icon-maskable-512.png`, drawIcon(512, { maskable: true }));
await writeFile(`${OUT}/robots.txt`, 'User-agent: *\nDisallow: /\n');
await writeFile(`${OUT}/.nojekyll`, '');
console.log('built:', html.length, 'bytes html');
