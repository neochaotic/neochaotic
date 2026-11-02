# Generates the README panels and link buttons (assets/card-*, oss-*, community-*, btn-*).
# Requires fonttools: pip install fonttools brotli
import io, base64, sys
from fontTools import subset
from fontTools.ttLib import TTFont
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FD = os.path.join(ROOT, 'docs/vendor/inter')
OUT = os.path.join(ROOT, 'assets')
TH = {
  'dark': dict(bg='#0B0C0F', border='#23262D', text='#F4F4F5', sec='#B4B4BB', muted='#7C7C86', accent='#8AB4F8', chip='#16202F'),
  'light': dict(bg='#FFFFFF', border='#E4E4E7', text='#111114', sec='#3F3F46', muted='#71717A', accent='#1A56DB', chip='#EEF3FD'),
}
metrics = {w: TTFont(f'{FD}/inter-latin-{w}-normal.woff2') for w in (400, 500, 600)}
def tw(t, size, w):
    f = metrics[w]; cm = f.getBestCmap(); hm = f['hmtx']; upm = f['head'].unitsPerEm
    return sum(hm[cm.get(ord(c), cm[32])][0] for c in t) * size / upm
def wrap(t, size, w, maxw):
    lines, cur = [], ''
    for word in t.split():
        nxt = (cur + ' ' + word).strip()
        if tw(nxt, size, w) > maxw and cur: lines.append(cur); cur = word
        else: cur = nxt
    return lines + [cur]
def fonts(text):
    css = ''
    for w in (400, 500, 600):
        o = subset.Options(); o.flavor = 'woff2'; f = TTFont(f'{FD}/inter-latin-{w}-normal.woff2')
        s = subset.Subsetter(o); s.populate(text=text + ' '); s.subset(f); b = io.BytesIO(); f.flavor = 'woff2'; f.save(b)
        css += f"@font-face{{font-family:I;font-weight:{w};src:url(data:font/woff2;base64,{base64.b64encode(b.getvalue()).decode()}) format('woff2')}}"
    return css + "text{font-family:I,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif}"
esc = lambda s: s.replace('&', '&amp;').replace('<', '&lt;')

def card(name, W, H, eyebrow, title, tags, desc, foot, chip=None, desc_size=15, title_size=26):
    for t, c in TH.items():
        X = 32
        parts = []
        allt = eyebrow + title + (tags or '') + desc + foot + (chip or '')
        parts.append(f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="16" fill="{c["bg"]}" stroke="{c["border"]}"/>')
        parts.append(f'<text x="{X}" y="48" font-size="11.5" font-weight="500" letter-spacing="1.5" fill="{c["accent"]}">{esc(eyebrow)}</text>')
        if chip:
            cw = tw(chip, 12, 500) + 22
            parts.append(f'<rect x="{W-X-cw}" y="31" width="{cw}" height="24" rx="12" fill="{c["chip"]}"/>')
            parts.append(f'<text x="{W-X-cw/2}" y="47.5" font-size="12" font-weight="500" text-anchor="middle" fill="{c["accent"]}">{esc(chip)}</text>')
        y = 48 + title_size + 18
        parts.append(f'<text x="{X-1}" y="{y}" font-size="{title_size}" font-weight="600" letter-spacing="-0.6" fill="{c["text"]}">{esc(title)}</text>')
        if tags:
            y += 26; parts.append(f'<text x="{X}" y="{y}" font-size="13.5" font-weight="500" fill="{c["muted"]}">{esc(tags)}</text>')
        y += 12
        for ln in wrap(desc, desc_size, 400, W - 2 * X):
            y += desc_size * 1.5; parts.append(f'<text x="{X}" y="{y}" font-size="{desc_size}" fill="{c["sec"]}">{esc(ln)}</text>')
        parts.append(f'<text x="{X}" y="{H-30}" font-size="13.5" font-weight="500" fill="{c["accent"]}">{esc(foot)}</text>')
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{esc(title)}: {esc(desc)}">'
               f'<style>{fonts(allt)}</style>' + ''.join(parts) + '</svg>\n')
        open(f'{OUT}/{name}-{t}.svg', 'w').write(svg)

card('card-dexaflow', 490, 262, 'CREATOR · OPEN SOURCE', 'Dexaflow', 'Go · Kubernetes · Helm',
     'Runs Airflow DAGs on a single Go control plane with the Airflow UI and REST API, one pod per task, and weekly releases.',
     'github.com/dexadata/dexaflow', chip='Weekly releases')
card('card-powerlab', 490, 262, 'SIDE PROJECT', 'PowerLab', 'Go · SvelteKit',
     'Self-hosted control panel for home servers and edge boxes, with a one-line installer and a curated app catalog.',
     'github.com/neochaotic/powerlab', chip='AGPL-3.0')
OSS = dict(W=324, H=236, desc_size=14, title_size=21)
card('oss-openmetadata', eyebrow='OPEN SOURCE', title='OpenMetadata', tags=None,
     desc='Found that a successful login was dropped when the browser service worker failed, then fixed it.',
     foot='#32063 · #32065', chip='Merged', **OSS)
card('oss-airflow', eyebrow='OPEN SOURCE', title='Apache Airflow', tags=None,
     desc='Reported two Airflow 3 UI bugs after Mark-as actions, both fixed upstream within a week.',
     foot='#67883 · #67884', chip='Fixed upstream', **OSS)
card('oss-adk-go', eyebrow='OPEN SOURCE', title='Google ADK for Go', tags=None,
     desc='Proposed a Firestore session service for serverless agent deployments.',
     foot='Pull request #2058', chip='In review', **OSS)
card('community', 1000, 172, 'COMMUNITY', 'Speaker, organizer and mentor', None,
     'Speaker at The Developers Conference (TDC) and DevFest BH. Organizer of the Data Analytics Meetup and mentor at Data Science Academy.',
     '', desc_size=15, title_size=22)
print('ok')

def btn(key, label, primary):
    size = 13; w = round(tw(label, size, 600) + 36); h = 34
    fill = '#1A56DB' if primary else 'none'; stroke = '#1A56DB' if primary else '#8B8B95'; tc = '#FFFFFF' if primary else '#8B8B95'
    f = fonts(label).split('text{')[0]
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{label}"><style>{f}</style>'
           f'<rect x="0.75" y="0.75" width="{w-1.5}" height="{h-1.5}" rx="8" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>'
           f'<text x="{w/2}" y="{h/2+4.6}" text-anchor="middle" font-family="I,-apple-system,Segoe UI,Helvetica,Arial,sans-serif" font-size="{size}" font-weight="600" fill="{tc}">{label}</text></svg>\n')
    open(f'{OUT}/btn-{key}.svg', 'w').write(svg)
for k, l, p in [('resume', 'Resume', True), ('cv', 'Interactive CV', True), ('linkedin', 'LinkedIn', False), ('instagram', 'Instagram', False), ('email', 'Email', False)]:
    btn(k, l, p)
