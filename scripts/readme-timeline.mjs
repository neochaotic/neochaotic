// Renders the web CV career timeline (docs/timeline.js) to static SVGs for
// the profile README: assets/timeline-dark.svg and assets/timeline-light.svg.
// The current role grows with today's date, so this runs on a schedule.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");
const fontB64 = w => readFileSync(join(docs, `vendor/inter/inter-latin-${w}-normal.woff2`)).toString("base64");
const THEMES = {
  dark: { bg: "#0B0C0F", border: "#23262D", text: "#F4F4F5", sec: "#B4B4BB", muted: "#7C7C86", accent: "#8AB4F8" },
  light: { bg: "#FFFFFF", border: "#E4E4E7", text: "#111114", sec: "#3F3F46", muted: "#71717A", accent: "#1A56DB" },
};
const W = 888, PX = 56, PY = 44;
const caption = "Career timeline. Open the interactive version";

const page = t => `<!doctype html><html class="${t === "light" ? "light" : ""}"><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:400;src:url(file://${docs}/vendor/inter/inter-latin-400-normal.woff2)}
@font-face{font-family:Inter;font-weight:500;src:url(file://${docs}/vendor/inter/inter-latin-500-normal.woff2)}
@font-face{font-family:Inter;font-weight:600 900;src:url(file://${docs}/vendor/inter/inter-latin-600-normal.woff2)}
:root{--bg:${THEMES[t].bg};--text:${THEMES[t].text};--text-secondary:${THEMES[t].sec};--text-muted:${THEMES[t].muted};--accent:${THEMES[t].accent}}
body{margin:0;background:var(--bg);font-family:Inter} #wrap,#tl{width:${W}px;background:var(--bg)} #tl{height:400px}
</style></head><body><div id="wrap"><div id="tl"></div></div>
<script src="file://${docs}/vendor/echarts-5.5.1.min.js"></script>
<script>const i=echarts.init;echarts.init=(el,th,o)=>i(el,th,Object.assign({},o,{renderer:"svg"}));</script>
<script src="file://${docs}/timeline.js"></script></body></html>`;

const dir = mkdtempSync(join(tmpdir(), "tl-"));
const browser = await chromium.launch();
for (const t of Object.keys(THEMES)) {
  const file = join(dir, `${t}.html`);
  writeFileSync(file, page(t));
  const p = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  p.on("pageerror", e => { console.error(e); process.exitCode = 1; });
  await p.goto("file://" + file);
  // Load the faces explicitly: label widths are measured with them, and
  // document.fonts.ready alone does not wait for fonts nothing uses yet.
  await p.evaluate(() => Promise.all(["400", "500", "600"].map(w => document.fonts.load(`${w} 12px Inter`))));
  await p.evaluate(() => window.renderCareerTimeline(document.getElementById("tl"), "en"));
  await p.waitForTimeout(1500);
  const { svg, h } = await p.evaluate(() => {
    const c = echarts.getInstanceByDom(document.getElementById("tl"));
    return { svg: c.renderToSVGString(), h: c.getHeight() };
  });
  await p.close();
  const c = THEMES[t], body = svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"));
  const WW = W + 2 * PX, HH = h + PY + 56;
  const ff = [400, 500, 600].map(w => `@font-face{font-family:Inter;font-weight:${w};src:url(data:font/woff2;base64,${fontB64(w)}) format('woff2')}`).join("");
  const out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WW}" height="${HH}" viewBox="0 0 ${WW} ${HH}" role="img" aria-labelledby="tt td">` +
    `<title id="tt">Career timeline of Alisson Rosa</title><desc id="td">Direct roles from IT services to Principal and Staff engineer, and client allocations including Google Cloud Professional Services.</desc>` +
    `<style>${ff}</style><rect x="0.5" y="0.5" width="${WW - 1}" height="${HH - 1}" rx="16" fill="${c.bg}" stroke="${c.border}"/>` +
    `<svg x="${PX}" y="${PY}" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">${body}</svg>` +
    `<text x="${WW - PX}" y="${HH - 24}" text-anchor="end" font-family="Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif" font-size="13" fill="${c.accent}">${caption}</text></svg>\n`;
  writeFileSync(join(root, `assets/timeline-${t}.svg`), out);
  console.log(`assets/timeline-${t}.svg`, WW, HH);
}
await browser.close();
