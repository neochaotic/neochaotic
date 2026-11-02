# Generates the README hero (assets/hero-dark.svg, assets/hero-light.svg).
# Requires fonttools: pip install fonttools brotli
import base64, io, sys
from fontTools import subset
from fontTools.ttLib import TTFont

import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTDIR = os.path.join(ROOT, "docs/vendor/inter")
OUT = os.path.join(ROOT, "assets")
W, H = 1000, 400
eyebrow = "GOOGLE DEVELOPER EXPERT · CLOUD & AI"
name = "Alisson Rosa"
title = "Principal Engineer, Data &amp; AI"
line = "I design data platforms that cost less and fail less, and lead the teams that run them."
place = "Belo Horizonte, Brazil"
stats = [
    ("88%", "lower data lake cost,", "Azure, Databricks to BigQuery"),
    ("68%", "lower Databricks spend", "with FinOps cost segmentation"),
    ("40 PB", "moved to Google Cloud", "largest in Latin America"),
    ("0 to 1", "AgTech data lake built,", "company later acquired"),
]
text_all = eyebrow + name + title + line + place + "".join("".join(s) for s in stats)

def sub(weight):
    opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["kern", "liga", "tnum"]
    f = TTFont(f"{FONTDIR}/inter-latin-{weight}-normal.woff2")
    s = subset.Subsetter(opts); s.populate(text=text_all); s.subset(f)
    b = io.BytesIO(); f.flavor = "woff2"; f.save(b)
    return base64.b64encode(b.getvalue()).decode()

fonts = {w: sub(w) for w in (400, 500, 600)}
themes = {
    "dark": dict(bg="#0B0C0F", border="#23262D", text="#F4F4F5", sec="#B4B4BB", muted="#7C7C86", accent="#8AB4F8", rule="#23262D"),
    "light": dict(bg="#FFFFFF", border="#E4E4E7", text="#111114", sec="#3F3F46", muted="#71717A", accent="#1A56DB", rule="#E4E4E7"),
}
def esc(s): return s.replace("&", "&amp;")
for t, c in themes.items():
    ff = "".join(f"@font-face{{font-family:I;font-weight:{w};src:url(data:font/woff2;base64,{d}) format('woff2')}}" for w, d in fonts.items())
    css = ff + "text{font-family:I,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-feature-settings:'tnum'}"
    x0 = 56
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t d">',
             f'<title id="t">Alisson Rosa, Principal Engineer, Data &amp; AI</title>',
             f'<desc id="d">Google Developer Expert in Cloud and AI. 88% lower data lake cost moving Azure and Databricks to BigQuery; 68% lower Databricks spend; 40 PB moved to Google Cloud; AgTech data lake built from zero, company later acquired.</desc>',
             f'<style>{css}</style>',
             f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="16" fill="{c["bg"]}" stroke="{c["border"]}"/>',
             f'<text x="{x0}" y="72" font-size="12" font-weight="500" letter-spacing="1.6" fill="{c["accent"]}">{esc(eyebrow)}</text>',
             f'<text x="{W-x0}" y="72" font-size="13" font-weight="400" text-anchor="end" fill="{c["muted"]}">{place}</text>',
             f'<text x="{x0-3}" y="134" font-size="52" font-weight="600" letter-spacing="-1.6" fill="{c["text"]}">{name}</text>',
             f'<text x="{x0}" y="172" font-size="21" font-weight="500" letter-spacing="-0.2" fill="{c["sec"]}">{title}</text>',
             f'<text x="{x0}" y="206" font-size="15" font-weight="400" fill="{c["muted"]}">{esc(line)}</text>',
             f'<line x1="{x0}" y1="246" x2="{W-x0}" y2="246" stroke="{c["rule"]}"/>']
    colw = (W - 2 * x0) / 4
    for i, (big, l1, l2) in enumerate(stats):
        x = x0 + i * colw
        parts.append(f'<text x="{x}" y="300" font-size="32" font-weight="600" letter-spacing="-0.8" fill="{c["text"]}">{big}</text>')
        parts.append(f'<text x="{x}" y="328" font-size="13" font-weight="400" fill="{c["sec"]}">{l1}</text>')
        parts.append(f'<text x="{x}" y="347" font-size="13" font-weight="400" fill="{c["muted"]}">{l2}</text>')
    parts.append('</svg>')
    open(f"{OUT}/hero-{t}.svg", "w").write("\n".join(parts) + "\n")
print("ok")
