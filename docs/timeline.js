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
    { co: "IFMG", lane: "direct", s: [2015, 5], e: [2016, 4], role: { en: "Professor, Data Structures", pt: "Professor, Estrutura de Dados" } },
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

  function build(chart, lang) {
    const t = TEXT[lang] || TEXT.en;
    const c = themeColors();
    const width = chart.getWidth();
    const left = width < 900 ? 128 : 170, right = 24;
    const end = dec(NOW, true) + 0.2;
    const pxPerUnit = (width - left - right) / warp(end);
    const X = y => left + warp(y) * pxPerUnit;
    const fontPx = width < 900 ? 11 : 12;
    const textW = (s, px) => s.length * px * 0.56;

    // Lay out rows so labels never collide: a label that does not fit inside
    // its bar goes to the right, or to the left near the right edge.
    const items = ROWS.map((r, i) => {
      const e = r.e || NOW, n = months(r.s, e);
      const role = r.role[lang] || r.role.en, dur = fmtDur(n, t);
      const x1 = X(dec(r.s)), x2 = X(dec(e, true));
      const head = textW(r.co, fontPx) + 10 + textW(dur, fontPx - 1);
      const inside = head + 20 < x2 - x1;
      const nameOnly = !inside && textW(r.co, fontPx) + 20 < x2 - x1;
      const need = Math.max(head, textW(role, fontPx - 1));
      const placeLeft = !inside && !nameOnly && x2 + 8 + need > width - right;
      const from = placeLeft ? x1 - 10 - need : x1;
      const to = (inside || nameOnly) ? Math.max(x2, x1 + 10 + Math.max(textW(role, fontPx - 1), nameOnly ? textW(r.co, fontPx) + 10 + textW(dur, fontPx - 1) : 0)) : placeLeft ? x2 : x2 + 10 + need;
      return { i, r, e, n, role, dur, inside, nameOnly, placeLeft, from, to };
    });
    const lanes = { direct: [], out: [] };
    for (const it of items) {
      const rows = lanes[it.r.lane];
      let k = rows.findIndex(endPx => it.from >= endPx + 12);
      if (k < 0) { rows.push(it.to); k = rows.length - 1; } else rows[k] = it.to;
      it.row = k;
    }
    const directRows = lanes.direct.length, outRows = lanes.out.length;
    const ROW_H = 54, LANE_GAP = 30, TOP = 60, AXIS = 40;
    const rowY = it => TOP + (it.r.lane === "direct" ? it.row : directRows + it.row) * ROW_H + (it.r.lane === "out" ? LANE_GAP : 0);
    const height = TOP + (directRows + outRows) * ROW_H + LANE_GAP + AXIS;
    chart.getDom().style.height = height + "px";
    chart.resize();

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
    const outTop = TOP + directRows * ROW_H + LANE_GAP;

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
        ...laneLabel("direct", TOP + 4),
        { type: "line", shape: { x1: 0, y1: outTop - LANE_GAP / 2, x2: width - right, y2: outTop - LANE_GAP / 2 }, style: { stroke: c.grid, lineWidth: 1 } },
        ...laneLabel("out", outTop + 4),
        { type: "text", right, top: 8, style: { text: t.total(total), fill: c.secondary, font: `500 13px ${font}`, align: "right" } },
        { type: "text", left: left + EARLY_UNITS * pxPerUnit - 2, top: height - AXIS + 12, style: { text: "//", fill: c.muted, font: `400 12px ${font}` } },
      ],
      series: [
        {
          type: "custom", silent: true, data: [0, ...years.map(warp)].map(v => [v]),
          renderItem: (params, api) => {
            const x = api.coord([api.value(0), 0])[0];
            return { type: "line", shape: { x1: x, y1: TOP - 18, x2: x, y2: height - AXIS - 8 }, style: { stroke: c.grid, lineWidth: 1 } };
          },
          z: 1,
        },
        {
          type: "custom", data, z: 2,
          encode: { x: [0, 1], y: 2 },
          renderItem: (params, api) => {
            const it = data[params.dataIndex].it;
            const out = it.r.lane === "out";
            const p1 = api.coord([api.value(0), api.value(2)]);
            const p2 = api.coord([api.value(1), api.value(2)]);
            const x = p1[0] + 1, y = p1[1], w = Math.max(p2[0] - p1[0] - 2, 5), h = 28;
            const kids = [{
              type: "rect", shape: { x, y, width: w, height: h, r: 6 },
              style: out ? { fill: pattern, stroke: c.accent, lineWidth: 1 } : { fill: c.accent },
              emphasis: { style: out ? { lineWidth: 2 } : { shadowBlur: 14, shadowColor: c.accent, opacity: 0.95 } },
            }];
            const headFont = `600 ${fontPx}px ${font}`, durFont = `500 ${fontPx - 1}px ${font}`, roleFont = `400 ${fontPx - 1}px ${font}`;
            if (it.nameOnly) {
              kids.push({ type: "text", style: { x: x + 9, y: y + h / 2, text: it.r.co, fill: c.onBar, font: headFont, verticalAlign: "middle" } });
              kids.push({ type: "text", style: { x: x + 9, y: y + h + 13, text: `{d|${it.dur}}  {r|${it.role}}`, verticalAlign: "middle", rich: { d: { fill: c.secondary, font: durFont }, r: { fill: c.muted, font: roleFont } } } });
            } else if (it.inside) {
              const tc = out ? c.text : c.onBar, dc = out ? c.secondary : c.onBarMuted;
              kids.push({ type: "text", style: { x: x + 9, y: y + h / 2, text: it.r.co, fill: tc, font: headFont, verticalAlign: "middle" } });
              kids.push({ type: "text", style: { x: x + w - 9, y: y + h / 2, text: it.dur, fill: dc, font: durFont, align: "right", verticalAlign: "middle" } });
              kids.push({ type: "text", style: { x: x + 9, y: y + h + 13, text: it.role, fill: c.muted, font: roleFont, verticalAlign: "middle" } });
            } else {
              const lx = it.placeLeft ? x - 9 : x + w + 9, align = it.placeLeft ? "right" : "left";
              kids.push({ type: "text", style: { x: lx, y: y + h / 2, text: `{h|${it.r.co}}  {d|${it.dur}}`, align, verticalAlign: "middle",
                rich: { h: { fill: c.text, font: headFont }, d: { fill: c.muted, font: durFont } } } });
              kids.push({ type: "text", style: { x: lx, y: y + h + 13, text: it.role, fill: c.muted, font: roleFont, align, verticalAlign: "middle" } });
            }
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
