// Signal-Radar – Oberfläche. Keine Abhängigkeiten, alles inline-SVG.

import { $, $$, FNG_DE, QUAD, WA_ICON, ago, arrow, compact, dayLabels, dirCls, esc, fmt, hideTip, lineChart, linePath, nf, ok, pct, priceFmt, safeUrl, scaleFn, showTip, spark, state, store, themeById, tipEl, toast, limitList, moreBtn, toggleMore, growList, growClick, googleNews } from "./ui.js";
import { initPlan, renderPlan } from "./plan.js";
import { renderCheck, renderSignals, initSignalControls, showView, initGoalPicker } from "./heute.js";
import { hypeInfo } from "./signals.js";
import { renderMeta, applyPrefs, renderPrefs, renderTrends, renderLevers, renderFitness, initBackup, renderUsage } from "./trust.js";
import { renderEvents, renderResearch, renderSourcesTable, renderRealEstate, initRealEstateForm, initMode, renderInstruments, renderInsiders, renderMacro, initMietspiegel, renderMood, renderOfficialMood, renderKpis, renderCommodities, commodityShareText } from "./insights.js";
import { openDetailFor } from "./detail.js";
import { initPersonal, renderDepot, renderSummary, goTo } from "./personal.js";
import { initSearch } from "./search.js";
import { setTechKind } from "./trust.js";
import { initSync } from "./sync.js";
import { renderMyRadar, renderFacts, initPersonas } from "./personas.js";
import { renderReadiness } from "./situation.js";
import { renderAssets, renderGems, renderProfis, renderCnn, renderLexikon, shareImage } from "./extras.js";

// ---------- Matcher (für live nachgeladene Meldungen) ----------
let matchers = { themes: [], signals: [] };
function buildMatchers(kw) {
  const W = "a-z0-9äöüß";
  const mk = (list) => new RegExp(list.map((k) => { const e = k.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return k.trim().length < 5 ? `(?<![${W}])${e}(?![${W}])` : `(?<![${W}])${e}`; }).join("|"), "i");
  try {
    matchers = {
      themes: Object.entries(kw?.themes || {}).map(([id, l]) => [id, mk(l)]),
      signals: Object.entries(kw?.signals || {}).map(([id, l]) => [id, mk(l)]),
    };
  } catch { /* alter Browser ohne Lookbehind: Live-Zuordnung entfällt */ }
}
const normTitle = (t) => t.toLowerCase().replace(/[^a-z0-9äöüß ]/g, "").replace(/\s+/g, " ").trim().slice(0, 70);

// ---------- Briefing & Teilen ----------
function ruleBriefing(d) {
  const lines = [];
  const b = d.bubble;
  const drivers = [...b.components].filter((c) => ok(c.score)).sort((x, y) => y.score - x.score).slice(0, 2).map((c) => c.label).join(" und ");
  lines.push(["🌡️", "Gesamtlage", `Blasen-Meter bei ${fmt(b.score)}/100 (${b.zone}). Am heißesten: ${drivers || "–"}.`]);
  const th = d.themes.filter((t) => ok(t.scores.hype) && ok(t.scores.momentum));
  const strongest = [...th].sort((a, c) => c.scores.hype + c.scores.momentum - (a.scores.hype + a.scores.momentum))[0];
  if (strongest) lines.push(["🔥", "Stärkstes Thema", `${strongest.name}: Hype ${fmt(strongest.scores.hype)}, Momentum ${fmt(strongest.scores.momentum)}, ${strongest.etf} 3 Monate ${pct(strongest.price?.chg3m, 0)}.`]);
  const quiet = th.filter((t) => t.scores.quadrant === "quiet").sort((a, c) => c.scores.momentum - a.scores.momentum)[0];
  lines.push(quiet
    ? ["🌱", "Unterschätzt", `${quiet.name} steigt (${quiet.etf} 3 M ${pct(quiet.price?.chg3m, 0)}), aber kaum jemand redet darüber (Hype ${fmt(quiet.scores.hype)}).`]
    : ["🌱", "Unterschätzt", "Gerade kein Thema im „stillen Aufstieg“. Was steigt, ist schon entdeckt."]);
  const hot = th.filter((t) => t.scores.quadrant === "overheated").sort((a, c) => c.scores.heat - a.scores.heat)[0]
    || th.filter((t) => t.scores.quadrant === "noise").sort((a, c) => c.scores.hype - a.scores.hype)[0];
  lines.push(hot
    ? ["⚠️", "Warnsignal", hot.scores.quadrant === "overheated"
      ? `${hot.name} ist überhitzt (${fmt(hot.scores.heat)}/100, ${pct(hot.price?.ext200, 0)} über der 200-Tage-Linie).`
      : `${hot.name}: viel Hype (${fmt(hot.scores.hype)}), aber der Kurs zieht nicht mit.`]
    : ["✅", "Warnsignal", "Kein Thema über der Überhitzungs-Schwelle von 75."]);
  const ipo = [...(d.ipoWatch || [])].sort((a, c) => c.ipoNews7d - a.ipoNews7d)[0];
  if (ipo) {
    const mk = ipo.markets?.[0];
    lines.push(["🦄", "IPO-Radar", `${ipo.name}: ${ipo.ipoNews7d} Schlagzeile${ipo.ipoNews7d === 1 ? "" : "n"} zu Börsengang/Bewertung in 7 Tagen${mk ? `, Wettmarkt: ${fmt(mk.prob * 100)} % für „${mk.question}“` : ""}.`]);
  }
  return lines;
}
function briefingLines(d) {
  if (d.aiBriefing?.text) {
    const ls = d.aiBriefing.text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 6);
    return ls.map((l) => {
      const m = l.match(/^(\p{Extended_Pictographic}️?|\S{1,3})\s+(.*)$/u);
      const body = m ? m[2] : l;
      const k = body.match(/^\*\*(.+?)\*\*[:\s–-]*(.*)$/);
      return [m ? m[1] : "•", k ? k[1] : "", k ? k[2] : body];
    });
  }
  return ruleBriefing(d);
}
const pageUrl = () => location.href.split("#")[0];
function shareText() {
  const d = state.data;
  const date = new Date(d.generatedAt).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  const lines = briefingLines(d).map(([i, k, t]) => `${i} ${k ? `*${k}:* ` : ""}${t}`);
  const amp = d.risk ? `🚦 *Markt-Ampel: ${d.risk.level.toUpperCase()}* · Blasen-Meter ${fmt(d.bubble.score)}/100\n` : "";
  return `📡 *Signal-Radar* · ${date}\n${amp}\n${lines.join("\n")}\n\n👉 Live ansehen (ohne Login): ${pageUrl()}\n_Keine Anlageberatung._`;
}
async function share(text) {
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(wa, "_blank", "noopener");
}

// ---------- Rendering ----------
function renderStamp() {
  const d = state.data;
  const t = Date.parse(d.generatedAt);
  const when = new Date(t).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const live = state.lastLive ? ` · live geprüft ${ago(state.lastLive)}` : "";
  $("#stamp").textContent = `Daten von ${when} Uhr${live}`;
}

function renderGauge() {
  const b = state.data.bubble, v = ok(b.score) ? b.score : 0;
  const cx = 160, cy = 150, R = 124, T = 20;
  const zones = [["var(--div-cool)", 0, 20], ["var(--div-cool-2)", 20, 40], ["var(--div-mid)", 40, 60], ["var(--div-warm-2)", 60, 80], ["var(--div-warm)", 80, 100]];
  const ang = (p) => Math.PI * (1 - p / 100);
  const pt = (p, r) => [cx + r * Math.cos(ang(p)), cy - r * Math.sin(ang(p))];
  const arc = (a, b2, r) => { const [x1, y1] = pt(a, r), [x2, y2] = pt(b2, r); return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
  const segs = zones.map(([c, a, z], i) => `<path d="${arc(a + (i ? 0.6 : 0), z - (i < 4 ? 0.6 : 0), R)}" stroke="${c}" stroke-width="${T}" fill="none" stroke-linecap="${i === 0 || i === 4 ? "round" : "butt"}"/>`).join("");
  const [nx, ny] = pt(v, R - T / 2 - 10);
  const labels = [["Angst", 0, "start", -T / 2], ["Neutral", 50, "middle", 0], ["Blase", 100, "end", T / 2]].map(([l, p, a, dx]) => { const [x, y] = pt(p, R); return `<text class="gauge-tick" x="${x + dx}" y="${p === 50 ? y - T / 2 - 8 : y + 26}" text-anchor="${a}">${l}</text>`; }).join("");
  $("#gauge").innerHTML = `<svg viewBox="0 0 320 236" role="img" aria-label="Blasen-Meter ${fmt(b.score)} von 100, ${esc(b.zone)}">
    ${segs}${labels}
    <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="var(--ink)" stroke-width="3.5" stroke-linecap="round" class="needle"/>
    <circle cx="${cx}" cy="${cy}" r="7" fill="var(--ink)"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="var(--surface)"/>
    <text class="gauge-num" x="${cx}" y="${cy + 62}" text-anchor="middle">${fmt(b.score)}</text>
    <text class="gauge-zone" x="${cx}" y="${cy + 84}" text-anchor="middle">${esc(b.zone)}</text>
  </svg>`;
  // Veränderung
  const h = state.history.filter((x) => ok(x.bubble));
  const back = (days) => { const target = Date.now() - days * 86400000; const e = [...h].reverse().find((x) => Date.parse(x.date) <= target); return e?.bubble; };
  const w = back(7), m = back(30);
  const part = (old, txt) => (ok(old) && ok(b.score) ? `<span class="${dirCls(b.score - old)}">${arrow(b.score - old)}${fmt(Math.abs(b.score - old))}</span> ggü. ${txt}` : "");
  $("#gaugeDelta").innerHTML = [part(w, "Vorwoche"), part(m, "Vormonat")].filter(Boolean).join(" · ") || (h.length < 2 ? "Verlauf wird ab heute täglich aufgezeichnet." : "");
  const hv = h.slice(-120);
  if (hv.length >= 3) lineChart($("#bubbleHist"), hv.map((x) => x.bubble), { labels: hv.map((x) => new Date(x.date).toLocaleDateString("de-DE")), fmtV: (v2) => `Blasen-Meter ${fmt(v2)}`, color: "var(--div-warm)", h: 46, axis: false });
  else $("#bubbleHist").innerHTML = "";
  $("#components").innerHTML = b.components.map((c) => {
    const s = ok(c.score) ? c.score : null;
    const col = s === null ? "var(--axis)" : s >= 80 ? "var(--div-warm)" : s >= 60 ? "var(--serious)" : s >= 40 ? "var(--muted)" : "var(--div-cool)";
    return `<li title="${esc(c.hint)}" data-tip="${esc(`<b>${esc(c.label)}</b><br>${esc(c.hint)}`)}"><span class="lbl">${esc(c.label)}</span><span class="bar"><i style="width:${s ?? 0}%;background:${col}"></i></span><span class="val">${s === null ? "–" : fmt(s)}</span></li>`;
  }).join("");
}

function renderBriefing() {
  const d = state.data;
  $("#briefing").innerHTML = briefingLines(d).map(([i, k, t]) => `<li><span class="ico">${esc(i)}</span><span>${k ? `<b>${esc(k)}:</b> ` : ""}${esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")}</span></li>`).join("");
  $("#briefSource").textContent = d.aiBriefing?.text ? `von Claude · ${ago(Date.parse(d.aiBriefing.generatedAt))}` : "automatisch aus den Daten";
}

function renderMarket() {
  const tiles = state.data.market.map((m) => {
    const live = m.sym === "BTC-USD" && state.liveBtc;
    const last = live ? state.liveBtc.usd : m.last, chg = live ? state.liveBtc.chg / 100 : m.chg1d;
    const col = m.sym === "^VIX" ? "var(--muted)" : chg >= 0 ? "var(--good)" : "var(--crit)";
    return `<div class="tile" role="button" tabindex="0" data-detail="mkt:${esc(m.sym)}" data-tip="${esc(`<b>${esc(m.name)}</b><br>1 Woche ${pct(m.chg1w)} · 1 Monat ${pct(m.chg1m)}<br>3 Monate ${pct(m.chg3m)} · 1 Jahr ${pct(m.chg1y)}`)}">
      <div class="nm"><span>${esc(m.name)}</span>${live ? '<span class="livebadge">LIVE</span>' : ""}</div>
      <div class="px">${priceFmt(m, last)}</div>
      <div class="ch ${m.sym === "^VIX" ? "flat" : dirCls(chg)}">${arrow(chg)}${pct(chg, 2)} heute</div>
      ${spark(m.spark, { w: 140, h: 30, color: col, label: `${m.name} letzte 6 Monate` })}</div>`;
  });
  $("#market").innerHTML = tiles.join("");
}

function historyPoint(id, days = 7) {
  const target = Date.now() - days * 86400000;
  const e = [...state.history].reverse().find((x) => Date.parse(x.date) <= target && x.themes?.[id]);
  return e?.themes[id];
}

function renderScatter() {
  const el = $("#scatter");
  const W = 640, H = 460, L = 44, R = 14, T = 14, B = 40;
  const sx = scaleFn(0, 100, L, W - R), sy = scaleFn(0, 100, H - B, T);
  const themes = state.data.themes.filter((t) => ok(t.scores.hype) && ok(t.scores.momentum));
  const q = (x0, y0, x1, y1, tint) => `<rect x="${sx(x0)}" y="${sy(y1)}" width="${sx(x1) - sx(x0)}" height="${sy(y0) - sy(y1)}" fill="var(${tint})"/>`;
  const qlbl = (x, y, anchor, text) => `<text class="qlbl" x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;
  // Spuren: wohin hat sich das Thema in 7 Tagen bewegt?
  const trails = themes.map((t) => {
    const p = historyPoint(t.id); if (!p || !ok(p[0]) || !ok(p[1])) return "";
    return `<line x1="${sx(p[0])}" y1="${sy(p[1])}" x2="${sx(t.scores.hype)}" y2="${sy(t.scores.momentum)}" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="2 3"/><circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="2.5" fill="var(--muted)"/>`;
  }).join("");
  // Beschriftungen ohne Überlappung (gierig)
  const boxes = themes.map((t) => ({ x: sx(t.scores.hype) - 9, y: sy(t.scores.momentum) - 9, w: 18, h: 18 }));
  const labels = themes.map((t) => {
    const x = sx(t.scores.hype), y = sy(t.scores.momentum), w = t.short.length * 7 + 4, h = 14;
    const cands = [[x + 11, y + 4, "start"], [x - 11, y + 4, "end"], [x, y - 12, "middle"], [x, y + 20, "middle"], [x + 11, y - 9, "start"], [x - 11, y + 17, "end"]];
    for (const [lx, ly, a] of cands) {
      const bx = a === "start" ? lx : a === "end" ? lx - w : lx - w / 2, by = ly - 11;
      const clash = boxes.some((b) => bx < b.x + b.w && bx + w > b.x && by < b.y + b.h && by + h > b.y) || bx < L || bx + w > W - R || by < T;
      if (!clash) { boxes.push({ x: bx, y: by, w, h }); return `<text class="lbl" x="${lx}" y="${ly}" text-anchor="${a}">${esc(t.short)}</text>`; }
    }
    return "";
  }).join("");
  const dots = themes.map((t) => {
    const x = sx(t.scores.hype), y = sy(t.scores.momentum), watched = state.watch.has(t.id), hot = t.scores.quadrant === "overheated";
    return `<g class="pt" data-id="${esc(t.id)}" tabindex="0" role="button" aria-label="${esc(t.name)}: Hype ${fmt(t.scores.hype)}, Momentum ${fmt(t.scores.momentum)}">
      <circle cx="${x}" cy="${y}" r="18" fill="transparent"/>
      ${hot ? `<circle cx="${x}" cy="${y}" r="11.5" fill="none" stroke="var(--crit)" stroke-width="2"/>` : ""}
      <circle cx="${x}" cy="${y}" r="${watched ? 8 : 7}" fill="${watched ? "var(--s1)" : "var(--ink-2)"}" stroke="var(--surface)" stroke-width="2"/></g>`;
  }).join("");
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hype-Karte: Themen nach Aufmerksamkeit und Kursdynamik">
    ${q(0, 50, 50, 100, "--q-quiet")}${q(50, 50, 100, 100, "--q-hot")}${q(50, 0, 100, 50, "--q-noise")}${q(0, 0, 50, 50, "--q-forgot")}
    ${[0, 25, 50, 75, 100].map((v) => `<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${H - B}" stroke="var(--grid)" ${v === 50 ? 'stroke="var(--axis)" stroke-dasharray="4 4"' : ""}/><line x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)" ${v === 50 ? 'stroke="var(--axis)" stroke-dasharray="4 4"' : ""}/>`).join("")}
    ${qlbl(sx(2), sy(97), "start", "🌱 Stiller Aufstieg")}${qlbl(sx(98), sy(97), "end", "🔥 Heißes Momentum")}${qlbl(sx(98), sy(2) - 4, "end", "📣 Hype ohne Kurs")}${qlbl(sx(2), sy(2) - 4, "start", "🧊 Vergessen")}
    <text class="axis" x="${(L + W - R) / 2}" y="${H - 8}" text-anchor="middle">Hype / Aufmerksamkeit →</text>
    <text class="axis" x="12" y="${(T + H - B) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(T + H - B) / 2})">Kurs-Momentum →</text>
    ${trails}${dots}${labels}
  </svg>`;
  $$(".pt", el).forEach((g) => {
    const t = themeById(g.dataset.id);
    const html = `<b>${esc(t.name)}</b> · ${QUAD[t.scores.quadrant].icon} ${QUAD[t.scores.quadrant].label}<br>Hype ${fmt(t.scores.hype)} · Momentum ${fmt(t.scores.momentum)} · Überhitzung ${fmt(t.scores.heat)}<br>${esc(t.etf)}: 1 M ${pct(t.price?.chg1m, 0)}, 3 M ${pct(t.price?.chg3m, 0)} · ${t.news7d} News/7 T`;
    g.addEventListener("pointerenter", (e) => showTip(e, html));
    g.addEventListener("pointermove", (e) => showTip(e, html));
    g.addEventListener("pointerleave", hideTip);
    g.addEventListener("click", () => { hideTip(); openTheme(t.id); });
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTheme(t.id); } });
  });
  // Erklär-Kästen
  const order = ["quiet", "hot", "noise", "forgotten", "overheated"];
  $("#quadGuide").innerHTML = order.map((k) => {
    const list = state.data.themes.filter((t) => t.scores.quadrant === k);
    if (k === "overheated" && !list.length) return "";
    return `<div class="qbox" style="${QUAD[k].tint ? `background:var(${QUAD[k].tint})` : ""}"><h4>${QUAD[k].icon} ${QUAD[k].label} <span class="count">${list.length}</span></h4><p>${QUAD[k].desc}</p>
      <div class="names">${list.map((t) => `<button type="button" data-open="${esc(t.id)}">${esc(t.short)}</button>`).join("") || '<span class="count">–</span>'}</div></div>`;
  }).join("");
}

function metricCell(v, color, cls = "") {
  return `<div class="metric ${cls}"><span>${ok(v) ? fmt(v) : "–"}</span><span class="bar"><i style="width:${ok(v) ? v : 0}%;background:${color}"></i></span></div>`;
}
function renderThemes() {
  const key = state.sort;
  const val = (t) => (key === "news7d" ? t.news7d : t.scores[key]) ?? -1;
  const list = [...state.data.themes].sort((a, b) => (state.watch.has(b.id) - state.watch.has(a.id)) || val(b) - val(a));
  const head = `<div class="trow head" role="presentation"><span></span><span>Thema</span><span class="c-spark">Aufmerksamkeit 60 T</span><span>Hype</span><span class="c-mom">Momentum</span><span>Überhitzung</span><span class="c-news">News 7 T</span><span></span></div>`;
  $("#themeList").innerHTML = head + list.map((t) => {
    const qd = QUAD[t.scores.quadrant] || QUAD.unknown;
    const w = state.watch.has(t.id);
    return `<div class="trow" role="listitem" data-open="${esc(t.id)}" tabindex="0">
      <button class="star ${w ? "on" : ""}" type="button" data-star="${esc(t.id)}" aria-label="${w ? "Von Merkliste entfernen" : "Auf Merkliste"}" aria-pressed="${w}">${w ? "★" : "☆"}</button>
      <div class="tname">${esc(t.name)}${hypeInfo(t) ? `<span class="hype" data-tip="${esc(`<b>Warum Hype?</b><br>${esc(hypeInfo(t))}`)}">⚡ Hype</span>` : ""}<small><span class="badge ${qd.cls}">${qd.icon} ${qd.label}</span> ${esc(t.etf)} 3 M <span class="${dirCls(t.price?.chg3m)}">${pct(t.price?.chg3m, 0)}</span></small></div>
      <div class="c-spark">${spark(t.attention?.spark, { label: `Wikipedia-Aufrufe ${t.name}` })}</div>
      ${metricCell(t.scores.hype, "var(--s1)")}
      ${metricCell(t.scores.momentum, "var(--s3)", "c-mom")}
      ${metricCell(t.scores.heat, ok(t.scores.heat) && t.scores.heat >= 75 ? "var(--crit)" : "var(--s2)")}
      <div class="metric c-news"><span>${t.news7d}</span><span class="count" style="font-size:11.5px;font-weight:500">${ok(t.newsAccel) ? (t.newsAccel >= 1.2 ? "▲ zieht an" : t.newsAccel <= 0.8 ? "▼ ruhiger" : "stabil") : ""}</span></div>
      <span class="chev">›</span></div>`;
  }).join("");
}

function renderIpo() {
  const d = state.data;
  const comp = d.bubble.components.find((c) => c.id === "ipo");
  const total = d.ipoWatch.reduce((s, w) => s + (w.ipoNews7d || 0), 0);
  const ipoEtf = d.themes.find((t) => t.id === "ipo")?.price;
  $("#ipoMeter").innerHTML = `<div class="big">${ok(comp?.score) ? fmt(comp.score) : "–"}<span class="count">/100</span></div>
    <p><b>IPO-Fieber.</b> ${total} Schlagzeilen über Börsengänge und Bewertungen der großen Privatfirmen in 7 Tagen · IPO-ETF 3 Monate <span class="${dirCls(ipoEtf?.chg3m)}">${pct(ipoEtf?.chg3m, 0)}</span>. Je höher, desto später im Zyklus.</p>`;
  $("#ipoGrid").innerHTML = d.ipoWatch.map((w, i) => {
    const mom = w.attention?.mom;
    return `<article class="ipo ${i === 0 ? "lead" : ""}">
      <h3><span>${esc(w.name)}</span>${ok(mom) ? `<span class="chip ${dirCls(mom)}" title="Wikipedia-Aufrufe 7 Tage vs. Vormonat">${arrow(mom)}${pct(mom, 0)}</span>` : ""}</h3>
      <div class="kpis"><div><b>${w.ipoNews7d}</b>IPO-News 7 T</div><div><b>${w.news7d}</b>News gesamt</div><div><b>${compact(w.attention?.last7)}</b>Aufrufe/Tag</div></div>
      ${spark(w.attention?.spark, { w: 300, h: 36, color: "var(--s2)", label: `Aufmerksamkeit ${w.name}` })}
      ${(w.markets || []).map((m) => `<div class="odds" title="${esc(m.question)}"><span>${fmt(m.prob * 100)} %</span><span class="bar"><i style="width:${m.prob * 100}%;background:var(--s1)"></i></span></div><div class="meta"><a href="${safeUrl(m.url)}" target="_blank" rel="noopener">${esc(m.question)}</a></div>`).join("")}
      ${growList(ipoNews(w).map((n) => `<div><a href="${safeUrl(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a><div class="meta">${esc(n.source)} · ${ago(n.published)}</div></div>`), { n: 2, step: 5, tag: "div", cls: "ipo-news" }) || '<div class="empty">Gerade keine Meldungen.</div>'}
    </article>`;
  }).join("");
}

function renderPoly() {
  const p = state.data.polymarket || [];
  $("#poly").innerHTML = p.length ? limitList("poly", p, 8).map((m) => `<li><a href="${safeUrl(m.url)}" target="_blank" rel="noopener">${esc(m.question)}</a><span class="pct">${fmt(m.prob * 100)} %</span>
    <span class="bar"><i style="width:${m.prob * 100}%;background:var(--s1)"></i></span>
    <span class="meta">Einsatz ${compact(m.volume)} $${m.endDate ? ` · endet ${new Date(m.endDate).toLocaleDateString("de-DE")}` : ""}</span></li>`).join("") + (p.length > 8 ? `<li class="more-li">${moreBtn("poly", p.length, 8, "Wettmärkte")}</li>` : "")
    : '<li class="empty">Gerade keine passenden Wettmärkte gefunden.</li>';
}

function renderFng() {
  const f = state.data.fearGreed;
  if (!f) { $("#fng").innerHTML = '<div class="empty">Keine Daten.</div>'; return; }
  $("#fng").innerHTML = `<div class="big">${fmt(f.value)}<small>${esc(FNG_DE[f.label] || f.label)}</small></div><div id="fngChart"></div>`;
  lineChart($("#fngChart"), f.spark, { labels: dayLabels(f.spark.length), fmtV: (v) => `${fmt(v)} Fear & Greed`, color: "var(--s2)", h: 70, mid: 50, axis: false });
  const tr = state.data.cryptoTrending || [];
  $("#trending").innerHTML = tr.map((c) => `<li class="chip" title="Marktkapitalisierungs-Rang ${c.rank ?? "–"}">🔎 ${esc(c.name)} <span class="${dirCls(c.chg24h)}">${ok(c.chg24h) ? pct(c.chg24h / 100, 0) : ""}</span></li>`).join("");
}

/** All headlines of a theme: live + collected feed (newest first), the collector's picks as fallback. */
function themeNews(t) {
  const seen = new Set();
  return [...state.live, ...(state.data.news || []), ...(t.top || [])].filter((n) => n?.title && (n.themes?.includes(t.id) || t.top?.includes(n)) && !seen.has(n.title) && seen.add(n.title));
}
/** All headlines about one IPO candidate: the collector's picks plus every match in the full feed. */
function ipoNews(w) {
  const word = String(w.name || "").split(/[ (]/)[0].toLowerCase(), seen = new Set();
  return [...(w.top || []), ...state.live, ...(state.data.news || [])]
    .filter((n) => n?.title && (w.top?.includes(n) || (word.length >= 3 && n.title.toLowerCase().includes(word))) && !seen.has(n.title) && seen.add(n.title));
}
function feedItems() {
  const all = [...state.live, ...state.data.news];
  const q = state.q.trim().toLowerCase();
  return all.filter((n) => (state.theme === "all" || (state.theme === "watch" ? n.themes.some((t) => state.watch.has(t)) : n.themes.includes(state.theme)))
    && (!state.onlySignals || n.signals?.length)
    && (!q || `${n.title} ${n.source}`.toLowerCase().includes(q)));
}
function renderChips() {
  const d = state.data;
  const opts = [["all", "Alle"], ...(state.watch.size ? [["watch", "★ Merkliste"]] : []), ...d.themes.map((t) => [t.id, t.short])];
  $("#themeChips").innerHTML = opts.map(([id, l]) => `<button type="button" data-chip="${id}" class="${state.theme === id ? "on" : ""}">${esc(l)}</button>`).join("");
}
const REACH = { both: ["Fach- und Leitmedien", "Erst Fachpresse, jetzt auch große Medien: Die Geschichte ist in der breiten Öffentlichkeit angekommen."], official: ["Amtlich", "Kommt direkt von einer Behörde oder Notenbank."], specialist: ["nur Fachpresse", "Bisher nur in Fachmedien: früh dran, aber noch unbestätigt in der breiten Presse."] };
/** "📰 5 Portale" + where the story has spread. */
function echoBadge(n) {
  const who = (n.outlets || []).join(", ");
  const r = REACH[n.reach];
  return `${n.echo > 1 ? `<span class="echo ${n.echo >= 4 ? "wide" : ""}" title="${esc(who ? `Berichten: ${who}` : "So viele Portale berichten")}">📰 ${n.echo} Portale</span>` : ""}${r && n.echo > 1 ? `<span class="reach" title="${esc(r[1])}">${esc(r[0])}</span>` : ""}`;
}
/** Top stories of the last 24 h by number of outlets, with what that pattern means. */
function renderWideStories() {
  const day = Date.now() - 24 * 3600e3;
  const top = [...(state.data.news || [])].filter((n) => n.echo >= 3 && (n.published || 0) > day).sort((a, b) => b.echo - a.echo).slice(0, 12);
  $("#wideStories").innerHTML = top.length ? `<div class="wide-box"><h3>📰 Worüber gerade viele berichten <span class="fine">(24 Std.)</span></h3>
    ${growList(top.map((n) => `<div class="wide-row"><a href="${safeUrl(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a><div class="m">${echoBadge(n)}</div></div>`), { n: 4, step: 8, tag: "div", cls: "wide-list" })}
    <details class="evid"><summary>Was bedeutet das für Anleger?</summary><p>Viele Berichte heißen: Die Nachricht ist bekannt und meist schon im Kurs. Aktien mit wenig Presse brachten im Schnitt sogar mehr Rendite als viel beachtete (Fang &amp; Peress 2009, Journal of Finance). Stark negative Presse drückt Kurse oft kurzfristig, danach erholen sie sich teilweise (Tetlock 2007, Journal of Finance). Früh dran ist, was erst in der Fachpresse steht.</p></details></div>` : "";
}
function renderFeed(freshKeys = new Set()) {
  safe(renderWideStories);
  const items = feedItems();
  const short = Object.fromEntries(state.data.themes.map((t) => [t.id, t.short]));
  $("#feedCount").textContent = `${items.length} Meldungen`;
  $("#feedList").innerHTML = items.slice(0, state.shown).map((n) => `<li class="${freshKeys.has(normTitle(n.title)) ? "fresh" : ""}">
      <a class="t" href="${safeUrl(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a>
      <button class="share" type="button" data-share="${esc(n.title)}" data-url="${esc(n.url)}" aria-label="Meldung in WhatsApp teilen">${WA_ICON}</button>
      <div class="m">${n.live ? '<span class="live-tag">LIVE</span>' : ""}<span>${esc(n.source)}</span><span>${ago(n.published)}</span>${echoBadge(n)}${n.points ? `<span>▲ ${fmt(Number(n.points))}</span>` : ""}
      ${(n.signals || []).map((s) => `<span class="sig ${esc(s)}">${esc(s)}</span>`).join("")}${(n.themes || []).slice(0, 3).map((t) => `<span class="tt">${esc(short[t] || t)}</span>`).join("")}</div></li>`).join("") || '<li class="empty">Keine Treffer.</li>';
  const rest = items.length - state.shown;
  $("#moreBtn").hidden = rest <= 0;
  $("#moreBtn").textContent = `Mehr laden (${rest} weitere)`;
  const q = state.q.trim() || (state.theme !== "all" && state.theme !== "watch" ? state.data.themes.find((t) => t.id === state.theme)?.name : "") || "Börse Wirtschaft";
  $("#feedOutside").innerHTML = rest <= 0 ? `Alle ${items.length} Meldungen geladen. <a href="${googleNews(q)}" target="_blank" rel="noopener">Noch mehr zu „${esc(q)}“ bei Google News ↗</a>` : "";
}

function renderSources() {
  const s = state.data.sources || [];
  const good = s.filter((x) => x.ok).length;
  $("#sourceSummary").textContent = `Quellen-Status: ${good} von ${s.length} erreichbar`;
  $("#sourceList").innerHTML = s.map((x) => `<li class="${x.ok ? "" : "bad"}">${x.ok ? "✓" : "✗"} ${esc(x.source)}${x.ok ? "" : ` (${esc(x.error || "Fehler")})`}</li>`).join("");
}

function renderBanner() {
  const b = $("#banner");
  if (state.data.demo) { b.hidden = false; b.innerHTML = "<b>Demo-Daten.</b> Diese Ansicht zeigt erfundene Beispielwerte. Echte Daten erscheinen, sobald der Sammler (GitHub Action) einmal gelaufen ist."; }
  else if (Date.now() - Date.parse(state.data.generatedAt) > 2 * 3600e3) { b.hidden = false; b.innerHTML = `<b>Stand der Daten: ${ago(Date.parse(state.data.generatedAt))}.</b> GitHub startet den Datensammler bei kostenlosen Konten oft nur alle paar Stunden. Krypto-Kurse und Tech-News oben laufen trotzdem live.`; }
  else b.hidden = true;
}

function safe(fn) { try { fn(); } catch (e) { console.error(fn.name, e); } }
function renderAll() {
  [renderBanner, renderStamp, renderCheck, renderSignals, renderEvents, renderResearch, renderRealEstate, renderInsiders, renderMacro, renderMood, renderOfficialMood, renderCommodities, renderTrends, renderUsage, renderLevers, renderGauge, renderBriefing, renderMarket, renderPlan, renderAssets, renderScatter, renderThemes, renderGems, renderProfis, renderIpo, renderPoly, renderCnn, renderFng, renderChips, () => renderFeed(), renderSources, renderDepot, renderSummary, renderMyRadar, renderReadiness].forEach(safe);
}

// ---------- Detail-Ansicht ----------
function openTheme(id, push = true) {
  const t = themeById(id); if (!t) return;
  const qd = QUAD[t.scores.quadrant] || QUAD.unknown;
  const p = t.price || {};
  $("#drawerBody").innerHTML = `<h2 id="drawerTitle">${esc(t.name)}</h2>
    <span class="badge ${qd.cls}">${qd.icon} ${qd.label}</span>
    <p class="sub">${qd.desc}</p>
    <div class="kpi-grid">
      <div class="kpi"><span>Hype</span><b>${fmt(t.scores.hype)}</b></div>
      <div class="kpi"><span>Momentum</span><b>${fmt(t.scores.momentum)}</b></div>
      <div class="kpi"><span>Überhitzung</span><b>${fmt(t.scores.heat)}</b></div>
      <div class="kpi"><span>${esc(t.etf)} 1 Monat</span><b class="${dirCls(p.chg1m)}">${pct(p.chg1m)}</b></div>
      <div class="kpi"><span>${esc(t.etf)} 3 Monate</span><b class="${dirCls(p.chg3m)}">${pct(p.chg3m)}</b></div>
      <div class="kpi"><span>vs. 200-Tage-Linie</span><b class="${dirCls(p.ext200)}">${pct(p.ext200, 0)}</b></div>
      <div class="kpi"><span>RSI (14)</span><b>${fmt(p.rsi)}</b></div>
      <div class="kpi"><span>Wiki-Aufrufe/Tag</span><b>${compact(t.attention?.last7)}</b></div>
      <div class="kpi"><span>News 7 T / 48 h</span><b>${t.news7d} / ${t.news48h}</b></div>
    </div>
    <div class="chart"><h4>${esc(t.etf)} – Kurs, ca. 6 Monate</h4><div id="dPrice"></div></div>
    <div class="chart"><h4>Aufmerksamkeit (Wikipedia-Aufrufe pro Tag, 60 Tage)</h4><div id="dAttn"></div></div>
    ${t.tickers?.length ? `<h3>Bekannte Werte</h3><table class="tick-table"><thead><tr><th>Wert</th><th>Kurs</th><th>Heute</th><th>3 M</th><th>vs. 200 T</th></tr></thead><tbody>
      ${t.tickers.map((k) => `<tr><td>${esc(k.sym)}</td><td>${ok(k.last) ? fmt(k.last, 2) : "–"}</td><td class="${dirCls(k.chg1d)}">${pct(k.chg1d)}</td><td class="${dirCls(k.chg3m)}">${pct(k.chg3m, 0)}</td><td class="${dirCls(k.ext200)}">${pct(k.ext200, 0)}</td></tr>`).join("")}</tbody></table>` : ""}
    <h3>Aktuelle Schlagzeilen</h3>
    ${growList(themeNews(t).map((n) => `<li><a class="t" href="${safeUrl(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a><div class="m"><span>${esc(n.source)}</span><span>${ago(n.published)}</span></div></li>`), { n: 6, step: 10 }) || '<ul class="feed"><li class="empty">Keine.</li></ul>'}
    <a class="btn btn-ghost btn-sm" href="${googleNews(t.name)}" target="_blank" rel="noopener">Noch mehr bei Google News ↗</a>
    <button class="btn btn-wa btn-wide" type="button" id="shareTheme" style="margin-top:12px">${WA_ICON}<span>Thema in WhatsApp teilen</span></button>`;
  $("#drawer").hidden = false;
  document.body.style.overflow = "hidden";
  const end = p.sparkEnd || Date.now();
  if (p.spark) lineChart($("#dPrice"), p.spark, { labels: dayLabels(p.spark.length, end, 2), fmtV: (v) => fmt(v, 2) });
  if (t.attention?.spark) lineChart($("#dAttn"), t.attention.spark, { labels: dayLabels(t.attention.spark.length, Date.now() - 86400000), fmtV: (v) => `${fmt(v)} Aufrufe`, color: "var(--s2)" });
  $("#shareTheme").addEventListener("click", () => share(`📡 *${t.name}* – ${qd.icon} ${qd.label}\nHype ${fmt(t.scores.hype)} · Momentum ${fmt(t.scores.momentum)} · Überhitzung ${fmt(t.scores.heat)}\n${t.etf} 3 Monate ${pct(p.chg3m, 0)}\n\n👉 ${pageUrl()}#thema=${t.id}\n_Keine Anlageberatung._`));
  if (push) history.replaceState(null, "", `#thema=${t.id}`);
  $(".drawer-close").focus();
}
function closeDrawer() {
  $("#drawer").hidden = true; document.body.style.overflow = "";
  if (location.hash.startsWith("#thema=")) history.replaceState(null, "", location.pathname + location.search);
}

// ---------- Daten laden & Live ----------
async function loadData(initial = false) {
  try {
    const [d, h] = await Promise.all([
      fetch(`data/data.json?t=${Date.now()}${initial ? "&fast=1" : ""}`, { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`data/history.json?t=${Date.now()}${initial ? "&fast=1" : ""}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]);
    const changed = !state.data || state.data.generatedAt !== d.generatedAt;
    state.data = d; state.history = Array.isArray(h) ? h : []; state.lastLoad = Date.now();
    if (changed) {
      buildMatchers(d.keywords);
      const known = new Set(d.news.map((n) => normTitle(n.title)));
      state.live = state.live.filter((n) => !known.has(normTitle(n.title)));
      renderAll();
      if (!initial) toast("Neue Daten geladen");
      else setTimeout(() => loadData(false), 1200); // the first view may come from the stored copy: fetch fresh data right after
    } else safe(renderStamp);
  } catch (e) {
    if (initial) {
      $("#banner").hidden = false;
      $("#banner").innerHTML = "<b>Noch keine Daten.</b> Der Sammler braucht beim ersten Lauf ein paar Minuten. Lade die Seite gleich neu.";
      $("#stamp").textContent = "keine Daten";
    }
  }
}

async function pollBtc() {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true");
    const j = await r.json();
    if (ok(j?.bitcoin?.usd)) { state.liveBtc = { usd: j.bitcoin.usd, chg: j.bitcoin.usd_24h_change }; state.lastLive = Date.now(); safe(renderMarket); return; }
    throw new Error("leer");
  } catch {
    try { // Ersatz: Binance (ebenfalls frei abrufbar)
      const j = await (await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT")).json();
      if (ok(+j.lastPrice)) { state.liveBtc = { usd: +j.lastPrice, chg: +j.priceChangePercent }; state.lastLive = Date.now(); safe(renderMarket); }
    } catch { /* offline – egal */ }
  }
}

async function pollHn() {
  if (!state.data || !matchers.themes.length) return;
  try {
    const since = Math.floor(Date.now() / 1000) - 6 * 3600;
    const r = await fetch(`https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=80&numericFilters=created_at_i>${since}`);
    const j = await r.json();
    const known = new Set([...state.data.news, ...state.live].map((n) => normTitle(n.title)));
    const fresh = new Set();
    for (const h of j.hits || []) {
      if (!h.title) continue;
      const k = normTitle(h.title);
      if (known.has(k)) continue;
      const themes = matchers.themes.filter(([, re]) => re.test(h.title)).map(([id]) => id);
      if (!themes.length) continue;
      const signals = matchers.signals.filter(([, re]) => re.test(h.title)).map(([id]) => id);
      state.live.unshift({ title: h.title, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`, source: "Hacker News", published: h.created_at_i * 1000, themes, signals, live: true, points: h.points });
      fresh.add(k); known.add(k);
    }
    state.live = state.live.slice(0, 60);
    if (fresh.size) safe(() => renderFeed(fresh));
  } catch { /* egal */ }
}

// Jede Minute: neue Sammler-Daten prüfen (alle 15 Min. neu), Bitcoin/Ethereum und Tech-News live holen.
const PERIOD = 60000;
let nextAt = 0, busy = false;
async function refreshAll(manual = false) {
  if (busy) return;
  busy = true;
  const btn = $("#refreshBtn"); btn.classList.add("spin");
  await Promise.allSettled([loadData(), pollBtc(), pollHn()]);
  state.lastLive = Date.now();
  safe(renderStamp);
  btn.classList.remove("spin");
  nextAt = Date.now() + PERIOD;
  busy = false;
  if (manual) toast("Aktualisiert");
}
function startLive() {
  const ring = $("#refreshRing"), text = $("#refreshText"), C = 2 * Math.PI * 15;
  ring.style.strokeDasharray = C;
  $("#refreshBtn").addEventListener("click", () => refreshAll(true));
  nextAt = Date.now() + PERIOD;
  pollBtc(); pollHn();
  setInterval(() => {
    const left = Math.max(0, nextAt - Date.now());
    ring.style.strokeDashoffset = C * (left / PERIOD);
    text.textContent = busy ? "Lädt …" : `in ${Math.ceil(left / 1000)} s`;
    if (left <= 0 && document.visibilityState === "visible") refreshAll();
  }, 1000);
  setInterval(() => safe(renderStamp), 15000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && Date.now() - state.lastLoad > PERIOD) refreshAll(); });
}

// ---------- Ereignisse ----------
function bindEvents() {
  const shareBrief = () => state.data && share(shareText());
  $("#shareBtn").addEventListener("click", shareBrief);
  $("#shareBtn2").addEventListener("click", shareBrief);
  $("#imgBtn").addEventListener("click", () => state.data && shareImage(briefingLines(state.data)).catch(() => toast("Bild konnte nicht erstellt werden")));
  $("#lexSearch").addEventListener("input", (e) => renderLexikon(e.target.value));
  $("#copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(shareText()); toast("Briefing kopiert"); } catch { toast("Kopieren nicht möglich"); }
  });
  $("#themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; store.set("theme", next);
    safe(renderScatter);
  });
  $("#sortSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-sort]"); if (!b) return;
    state.sort = b.dataset.sort; $$("#sortSeg button").forEach((x) => x.classList.toggle("on", x === b)); safe(renderThemes);
  });
  document.addEventListener("click", (e) => {
    const star = e.target.closest("[data-star]");
    if (star) {
      e.stopPropagation();
      const id = star.dataset.star;
      state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
      store.set("watch", [...state.watch]);
      [renderThemes, renderScatter, renderChips].forEach(safe);
      return;
    }
    const det = e.target.closest("[data-detail]");
    if (det) { openDetailFor(det.dataset.detail); return; }
    if (growClick(e)) return;
    const mb = e.target.closest("[data-more]");
    if (mb) {
      const k = mb.dataset.more; toggleMore(k);
      const RE = { trend: renderTrends, paper: renderResearch, study: renderResearch, ins: renderInsiders, cons: renderProfis, voices: renderProfis, poly: renderPoly };
      safe(RE[k.split(":")[0]] || renderAll);
      return;
    }
    const tk = e.target.closest("[data-tech]");
    if (tk) { setTechKind(tk.dataset.tech); safe(renderTrends); return; }
    const open = e.target.closest("[data-open]");
    if (open) { openTheme(open.dataset.open); return; }
    const chip = e.target.closest("[data-chip]");
    if (chip) { state.theme = chip.dataset.chip; state.shown = 40; renderChips(); renderFeed(); return; }
    const sh = e.target.closest("[data-share]");
    if (sh) { share(`${sh.dataset.share}\n${sh.dataset.url}\n\n📡 Mehr Signale: ${pageUrl()}`); return; }
    if (e.target.closest("[data-close]")) { closeDrawer(); return; }
    if (e.target.closest("#allTargets")) { state.allTargets = !state.allTargets; safe(renderProfis); return; }
    const pop = e.target.closest("[data-pop]");
    if (pop) { const p = document.getElementById(pop.dataset.pop); p.hidden = !p.hidden; }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#drawer").hidden) closeDrawer();
    if ((e.key === "Enter") && e.target.matches(".trow[data-open]")) openTheme(e.target.dataset.open);
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-detail][tabindex]")) { e.preventDefault(); openDetailFor(e.target.dataset.detail); }
  });
  // Tooltips für Elemente mit data-tip (Märkte, Bausteine)
  document.addEventListener("pointerover", (e) => { const t = e.target.closest("[data-tip]"); if (t) showTip(e, t.dataset.tip); });
  document.addEventListener("pointermove", (e) => { const t = e.target.closest("[data-tip]"); if (t) showTip(e, t.dataset.tip); });
  document.addEventListener("pointerout", (e) => { if (e.target.closest("[data-tip]") && !e.relatedTarget?.closest?.("[data-tip]")) hideTip(); });
  let st;
  $("#search").addEventListener("input", (e) => { clearTimeout(st); st = setTimeout(() => { state.q = e.target.value; state.shown = 40; renderFeed(); }, 150); });
  $("#onlySignals").addEventListener("change", (e) => { state.onlySignals = e.target.checked; renderFeed(); });
  $("#moreBtn").addEventListener("click", () => { state.shown += 40; renderFeed(); });
  // load the next 40 automatically when the user scrolls to the end of the list
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting) && !$("#moreBtn").hidden) { state.shown += 40; renderFeed(); } }, { rootMargin: "300px" }).observe($("#moreBtn"));
  let rt, lastW = innerWidth; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (!state.data || Math.abs(innerWidth - lastW) < 40) return; lastW = innerWidth; [renderGauge, renderFng, renderCnn, renderPlan].forEach(safe); }, 250); });
}

// ---------- Start ----------
const savedTheme = store.get("theme", null);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$("#gauge").innerHTML = '<div class="skel" style="height:170px"></div>';
bindEvents();
initPlan();
initSignalControls();
initGoalPicker(() => state.data && [renderCheck, renderSignals].forEach(safe));
initRealEstateForm();
initMietspiegel();
safe(renderMeta);
safe(applyPrefs);
safe(renderFitness);
safe(initBackup);
const openPrefs = () => { renderPrefs(() => state.data && [renderSignals, renderCheck].forEach(safe)); $("#prefsPanel").hidden = false; };
$("#prefsBtn").addEventListener("click", openPrefs);
initPersonal({ openPrefs, onGoto: goTo });
safe(() => initSync({ openPrefs }));
safe(renderFacts);
safe(renderReadiness);
safe(renderMyRadar);
initPersonas(() => safe(renderSummary));
document.addEventListener("click", (e) => { if (e.target.closest("[data-close-prefs]")) $("#prefsPanel").hidden = true; });
$("#planForm").addEventListener("input", () => setTimeout(() => safe(renderLevers), 200));
$("#shareCom").addEventListener("click", () => state.data && share(commodityShareText(state.data, pageUrl())));
renderSourcesTable();
renderInstruments();
renderKpis();
initMode(() => state.data && [renderPlan, renderRealEstate].forEach(safe));
const onShow = (v) => { if (!state.data) return; if (v === "plan") safe(renderPlan); if (v === "entdecken") [renderFng, renderCnn, renderRealEstate].forEach(safe); if (v === "heute") safe(renderGauge); };
addEventListener("hashchange", () => { if (location.hash.startsWith("#thema=")) { showView(); const id = location.hash.slice(7); if (themeById(id)) openTheme(id, false); return; } showView(onShow); });
showView();
renderLexikon();
initSearch(openDetailFor);
// Als App installierbar machen (PWA) und Offline-Modus
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
let installEvt = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; $("#installBtn").hidden = false; });
$("#installBtn").addEventListener("click", async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $("#installBtn").hidden = true; });
addEventListener("appinstalled", () => { $("#installBtn").hidden = true; toast("Installiert – du findest das Radar jetzt bei deinen Apps"); });

await loadData(true);
if (state.data) {
  const m = location.hash.match(/^#thema=([\w-]+)/);
  if (m) openTheme(m[1], false);
  startLive();
}
