/*
 * Career timeline rendered with Apache ECharts.
 * Dates follow LinkedIn. The current role has no end date, so its bar, its
 * duration and the total grow with today's date.
 */
(function () {
  const today = new Date();
  const NOW = [today.getFullYear(), today.getMonth() + 1];
  const FIRST = [2004, 8];

  const ROWS = [
    { co: "IT services", lane: "direct", s: [2004, 8], e: [2014, 12], role: { en: "Technician to business owner", pt: "Técnico a dono de negócio" } },
    { co: "Freelance", lane: "direct", s: [2014, 11], e: [2018, 7], role: { en: "BI Analyst and Python Developer", pt: "Analista de BI e Desenvolvedor Python" } },
    { co: "IFMG", lane: "direct", concurrent: true, s: [2015, 5], e: [2016, 4], role: { en: "Professor, Data Structures", pt: "Professor, Estrutura de Dados" } },
    { co: "BySat", lane: "direct", s: [2018, 8], e: [2019, 3], role: { en: "Senior BI Analyst", pt: "Analista de BI Sênior" } },
    { co: "Prodap", lane: "direct", s: [2019, 3], e: [2020, 10], role: { en: "Principal Data Engineer", pt: "Principal Data Engineer" } },
    { co: "Engineering", lane: "direct", s: [2020, 10], e: [2021, 8], role: { en: "Data Architect", pt: "Arquiteto de Dados" } },
    { co: "Avenue Code", lane: "direct", s: [2021, 8], e: [2023, 2], role: { en: "Principal Engineer, Data & AI", pt: "Principal Engineer, Data & AI" } },
    { co: "Acerto", lane: "direct", s: [2023, 3], e: [2024, 7], role: { en: "Senior Data Manager", pt: "Gerente Sênior de Dados" } },
    { co: "RD Station", lane: "direct", s: [2024, 8], e: [2025, 5], role: { en: "Staff Software Engineer, Data Platform", pt: "Staff Software Engineer, Plataforma de Dados" } },
    { co: "QI Network", lane: "direct", s: [2025, 6], e: null, role: { en: "Staff Engineer, Data & AI", pt: "Staff Engineer, Data & AI" } },
    { co: "Google Cloud PSO", lane: "out", s: [2021, 1], e: [2023, 2], role: { en: "Strategic Cloud Engineer", pt: "Strategic Cloud Engineer" } },
    { co: "Escale", lane: "out", s: [2026, 5], e: [2026, 10], role: { en: "Staff Engineer, Data & AI", pt: "Staff Engineer, Data & AI" } },
  ];

  const TEXT = {
    en: {
      direct: ["Direct", "Brazilian CLT or contractor"], out: ["Outsourced", "allocated to a client"],
      y: "y", m: "m", to: "to", present: "Present", total: n => `${n} years in technology`,
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    },
    pt: {
      direct: ["Direto", "CLT ou PJ"], out: ["Alocado", "em cliente"],
      y: "a", m: "m", to: "a", present: "Atual", total: n => `${n} anos em tecnologia`,
      months: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    },
  };

  const months = (s, e) => (e[0] * 12 + e[1]) - (s[0] * 12 + s[1]) + 1;
  const fmtDur = (n, t) => {
    const y = Math.floor(n / 12), m = n % 12;
    return [y ? `${y}${t.y}` : "", m ? `${m}${t.m}` : ""].filter(Boolean).join(" ");
  };
  const fmtDate = (ym, t) => `${t.months[ym[1] - 1]} ${ym[0]}`;
  const dec = ([y, m], end) => y + (m - 1) / 12 + (end ? 1 / 12 : 0);

  // The years before 2015 are compressed into one unit so the early career
  // does not take half of the chart; every later year is one unit.
  const EARLY_START = 2004.5, BREAK = 2015, EARLY_UNITS = 1.4, GAP = 0.7;
  const warp = y => y < BREAK
    ? (y - EARLY_START) / (BREAK - EARLY_START) * EARLY_UNITS
    : EARLY_UNITS + GAP + (y - BREAK);

  function themeColors() {
    const css = getComputedStyle(document.documentElement);
    const v = (name, fallback) => (css.getPropertyValue(name) || "").trim() || fallback;
    const light = document.documentElement.classList.contains("light");
    return {
      bg: v("--bg", light ? "#ffffff" : "#0b0c0f"),
      text: v("--text", "#f4f4f5"),
      muted: v("--text-muted", "#8b8b95"),
      secondary: v("--text-secondary", "#c4c4cb"),
      accent: v("--accent", "#8ab4f8"),
      grid: light ? "rgba(17,17,20,0.07)" : "rgba(255,255,255,0.06)",
      onBar: light ? "#ffffff" : "#0b0c0f",
      onBarMuted: light ? "rgba(255,255,255,0.78)" : "rgba(11,12,15,0.62)",
      hatchBg: light ? "rgba(26,86,219,0.10)" : "rgba(138,180,248,0.14)",
      tooltipBg: light ? "#ffffff" : "#15171c",
      tooltipBorder: light ? "rgba(17,17,20,0.12)" : "rgba(255,255,255,0.12)",
    };
  }

  function hatch(c) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 8;
    const g = cv.getContext("2d");
    g.fillStyle = c.hatchBg; g.fillRect(0, 0, 8, 8);
    g.strokeStyle = c.accent; g.globalAlpha = 0.55; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-2, 10); g.lineTo(10, -2); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(6, 10); g.lineTo(10, 6); g.stroke();
    return { image: cv, repeat: "repeat" };
  }

  // Labels get a halo in the color behind the chart so leader lines pass
  // behind the text instead of through it.
  function effectiveBg(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const b = getComputedStyle(n).backgroundColor;
      if (b && b !== "transparent" && !/rgba\(.*,\s*0\)$/.test(b)) return b;
    }
    return null;
  }

  function build(chart, lang) {
    const t = TEXT[lang] || TEXT.en;
    const c = themeColors();
    c.bg = effectiveBg(chart.getDom().parentElement) || c.bg;
    const width = chart.getWidth();
    const left = width < 900 ? 128 : 170, right = 24;
    const end = dec(NOW, true) + 0.2;
    const pxPerUnit = (width - left - right) / warp(end);
    const X = y => left + warp(y) * pxPerUnit;
    const fontPx = width < 900 ? 11 : 12;

    const fontFam = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    const measure = (() => {
      const g = document.createElement("canvas").getContext("2d");
      return (txt, f) => { g.font = f; return g.measureText(txt).width; };
    })();
    const headFont = `600 ${fontPx}px ${fontFam}`, durFont = `500 ${fontPx - 1}px ${fontFam}`, roleFont = `400 ${fontPx - 1}px ${fontFam}`;

    // Bars of one lane share a row unless they overlap by more than a month.
    // Every label is a two line block (company and duration, then role) that
    // sits above or below its bar, starting at the bar's left edge; near the
    // right edge it is right aligned to the bar's end. Blocks go to the
    // closest free tier, so labels never collide and always read the same way.
    const BAR_H = 16, LBL_H = 34, PAD = 6, SEP = 14;
    const items = ROWS.map((r, i) => {
      const e = r.e || NOW, n = months(r.s, e);
      const role = r.role[lang] || r.role.en, dur = fmtDur(n, t);
      const x1 = X(dec(r.s)), x2 = X(dec(e, true));
      const w = Math.max(measure(r.co, headFont) + 8 + measure(dur, durFont), measure(role, roleFont));
      const alignRight = x1 + w > width - right;
      const from = alignRight ? x2 - w : x1, to = alignRight ? x2 : x1 + w;
      return { i, r, e, n, role, dur, x1, x2, w, alignRight, from, to, ms: dec(r.s), me: dec(e, true) };
    });
    const lanes = { direct: [], out: [] };
    for (const it of items) {
      const rows = lanes[it.r.lane];
      let k = it.r.concurrent ? 0 : rows.findIndex(row => row.every(o => it.ms >= o.me - 2.5 / 12 || it.me <= o.ms + 2.5 / 12));
      if (k < 0) { rows.push([]); k = rows.length - 1; }
      rows[k].push(it); it.row = k;
    }
    for (const lane of Object.values(lanes)) {
      for (const row of lane) {
        const tiers = { above: [], below: [] };
        for (const it of row) {
          for (let depth = 0, placed = false; !placed; depth++) {
            for (const side of ["below", "above"]) {
              const list = tiers[side][depth] || (tiers[side][depth] = []);
              if (list.every(o => it.from >= o.to + SEP || it.to + SEP <= o.from)) {
                list.push(it); it.side = side; it.depth = depth; placed = true; break;
              }
            }
          }
        }
        row.above = tiers.above.filter(l => l.length).length;
        row.below = tiers.below.filter(l => l.length).length;
      }
    }
    const TOP = 44, LANE_GAP = 26, AXIS = 40, ROW_GAP = 4;
    let y = TOP;
    const laneTop = {};
    for (const name of ["direct", "out"]) {
      if (name === "out") y += LANE_GAP;
      laneTop[name] = y;
      for (const row of lanes[name]) {
        row.barY = y + row.above * LBL_H + (row.above ? PAD : 0);
        y = row.barY + BAR_H + (row.below ? PAD + row.below * LBL_H : 0) + ROW_GAP;
      }
    }
    for (const it of items) {
      const row = lanes[it.r.lane][it.row];
      it.barY = row.barY;
      it.lblY = it.side === "below"
        ? row.barY + BAR_H + PAD + it.depth * LBL_H
        : row.barY - PAD - (it.depth + 1) * LBL_H;
    }
    const height = y + AXIS;
    chart.getDom().style.height = height + "px";
    chart.resize();
    const rowY = it => it.barY;

    const total = Math.ceil(months(FIRST, NOW) / 12);
    const years = [];
    for (let y = BREAK; y <= NOW[0]; y++) years.push(y);
    const pattern = hatch(c);
    const font = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

    const data = items.map(it => ({
      value: [warp(dec(it.r.s)), warp(dec(it.e, true)), rowY(it)],
      it,
    }));

    const laneLabel = (lane, y) => [
      { type: "text", left: 0, top: y, style: { text: t[lane][0], fill: c.text, font: `500 14px ${font}` } },
      { type: "text", left: 0, top: y + 20, style: { text: t[lane][1], fill: c.muted, font: `400 12px ${font}`, width: left - 16, overflow: "break" } },
    ];
    const outTop = laneTop.out;

    return {
      animationDuration: 500,
      textStyle: { fontFamily: font },
      grid: { left, right, top: 0, bottom: AXIS, containLabel: false },
      xAxis: {
        type: "value", min: 0, max: warp(end), position: "bottom",
        splitLine: { show: false }, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: {
          customValues: [0, ...years.map(warp)],
          formatter: v => (v === 0 ? "2004" : String(Math.round(v - EARLY_UNITS - GAP + BREAK))),
          color: c.muted, fontSize: 11, fontFamily: font,
        },
      },
      yAxis: { type: "value", min: 0, max: height - AXIS, inverse: true, show: false },
      tooltip: {
        trigger: "item", backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderWidth: 1,
        padding: [10, 12], textStyle: { color: c.text, fontFamily: font, fontSize: 12 },
        extraCssText: "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);",
        formatter: p => {
          const it = p.data.it, endTxt = it.r.e ? fmtDate(it.r.e, t) : t.present;
          return `<div style="font-weight:600;font-size:13px">${it.r.co}</div>` +
            `<div style="color:${c.secondary};margin-top:2px">${it.role}</div>` +
            `<div style="color:${c.muted};margin-top:6px">${fmtDate(it.r.s, t)} ${t.to} ${endTxt} · ${it.dur}</div>` +
            `<div style="color:${c.accent};margin-top:2px">${t[it.r.lane][0]}</div>`;
        },
      },
      graphic: [
        ...laneLabel("direct", laneTop.direct + 4),
        { type: "line", shape: { x1: 0, y1: outTop - LANE_GAP / 2, x2: width - right, y2: outTop - LANE_GAP / 2 }, style: { stroke: c.grid, lineWidth: 1 } },
        ...laneLabel("out", outTop + 4),
        { type: "text", right, top: 4, style: { text: t.total(total), fill: c.secondary, font: `500 13px ${font}`, align: "right" } },
        { type: "text", left: left + EARLY_UNITS * pxPerUnit - 2, top: height - AXIS + 12, style: { text: "//", fill: c.muted, font: `400 12px ${font}` } },
      ],
      series: [
        {
          type: "custom", silent: true, data: [0, ...years.map(warp)].map(v => [v]),
          renderItem: (params, api) => {
            const x = api.coord([api.value(0), 0])[0];
            return { type: "line", shape: { x1: x, y1: TOP - 10, x2: x, y2: height - AXIS - 8 }, style: { stroke: c.grid, lineWidth: 1 } };
          },
          z: 1,
        },
        {
          type: "custom", silent: true, z: 1.5, data: data.filter(d => d.it.depth > 0).map(d => ({ value: d.value, it: d.it })),
          encode: { x: [0, 1], y: 2 },
          renderItem: (params, api) => {
            const it = api.value(0) !== undefined && data.filter(d => d.it.depth > 0)[params.dataIndex].it;
            const p1 = api.coord([api.value(0), api.value(2)]), p2 = api.coord([api.value(1), api.value(2)]);
            const ax = (it.alignRight ? p2[0] - 2 : p1[0] + 2) + 0.5;
            const y1 = it.side === "below" ? it.barY + BAR_H : it.lblY + LBL_H - 6;
            const y2 = it.side === "below" ? it.lblY + 4 : it.barY;
            return { type: "line", shape: { x1: ax, y1, x2: ax, y2 }, style: { stroke: c.muted, opacity: 0.5, lineWidth: 1 } };
          },
        },
        {
          type: "custom", data, z: 2,
          encode: { x: [0, 1], y: 2 },
          renderItem: (params, api) => {
            const it = data[params.dataIndex].it;
            const out = it.r.lane === "out";
            const p1 = api.coord([api.value(0), api.value(2)]);
            const p2 = api.coord([api.value(1), api.value(2)]);
            const x = p1[0] + 2, y = p1[1], w = Math.max(p2[0] - p1[0] - 4, 6), h = BAR_H;
            const kids = [{
              type: "rect", shape: { x, y, width: w, height: h, r: 4 },
              style: out ? { fill: pattern, stroke: c.accent, lineWidth: 1 } : { fill: c.accent },
              emphasis: { style: out ? { lineWidth: 2 } : { shadowBlur: 12, shadowColor: c.accent } },
            }];
            // A role held at the same time as another one is drawn inside
            // that bar as an outlined segment, on the same row.
            if (it.r.concurrent) kids[0] = {
              type: "rect", shape: { x: x + 2, y: y + 3, width: w - 4, height: h - 6, r: 3 },
              style: { fill: c.bg, stroke: c.bg, lineWidth: 2 },
              emphasis: { style: { fill: c.secondary } },
            };
            const ax = it.alignRight ? x + w : x, align = it.alignRight ? "right" : "left";
            const ly = it.lblY;
            const tx = it.depth > 0 ? ax + (it.alignRight ? -6 : 6) : ax;
            kids.push({ type: "text", style: { x: tx, y: ly + 9, text: `{h|${it.r.co}}  {d|${it.dur}}`, align, verticalAlign: "middle",
              backgroundColor: c.bg, padding: [1, 4],
              rich: { h: { fill: c.text, font: headFont }, d: { fill: c.muted, font: durFont } } } });
            kids.push({ type: "text", style: { x: tx, y: ly + 25, text: it.role, fill: c.muted, font: roleFont, align, verticalAlign: "middle", backgroundColor: c.bg, padding: [1, 4] } });
            return { type: "group", children: kids };
          },
        },
      ],
    };
  }

  function mount(el, lang) {
    if (!window.echarts || !el) return;
    let chart = window.echarts.getInstanceByDom(el) || window.echarts.init(el, null, { renderer: "canvas" });
    const draw = () => { chart.dispatchAction({ type: "hideTip" }); chart.setOption(build(chart, lang), { notMerge: true, lazyUpdate: false }); };
    draw();
    if (!el._tlResize) {
      el._tlResize = true;
      let raf = 0;
      window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { chart.resize(); draw(); }); });
    }
    el._tlDraw = draw;
  }

  window.renderCareerTimeline = mount;
})();
