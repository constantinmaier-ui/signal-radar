// Nachrichten-Wirkung, neue Forschung und Immobilien-Daten.
import { EVENTS, RESEARCH_FEEDS, REAL_ESTATE } from "./config.mjs";
import { makeMatcher, parseFeed, tone, mean } from "./lib.mjs";

const DAY = 86400000;

/** Ordnet Meldungen Ereignis-Arten zu und misst, wie stark gerade darüber berichtet wird. */
export function computeEvents(news, now = Date.now(), events = EVENTS) {
  return events.map((ev) => {
    const m = makeMatcher(ev.kw);
    const hits = news.filter((n) => m(n.title));
    const in7 = hits.filter((n) => n.published && n.published > now - 7 * DAY);
    const in2 = in7.filter((n) => n.published > now - 2 * DAY);
    const accel = in7.length >= 4 ? (in2.length / 2) / (in7.length / 7) : null; // >1 = mehr als sonst
    const tones = in7.map((n) => tone(n.title));
    return {
      id: ev.id, name: ev.name, icon: ev.icon, impact: ev.impact, why: ev.why, evidence: ev.evidence,
      n48h: in2.length, n7d: in7.length, accel,
      bull: tones.filter((t) => t === "bullish").length, bear: tones.filter((t) => t === "bearish").length,
      top: in7.sort((a, b) => (b.echo || 1) - (a.echo || 1) || b.published - a.published).slice(0, 3)
        .map((n) => ({ title: n.title, url: n.url, source: n.source, published: n.published })),
    };
  }).sort((a, b) => b.n48h * 2 + b.n7d - (a.n48h * 2 + a.n7d));
}

export async function fetchResearch({ get, pool }, now = Date.now()) {
  const res = await pool(RESEARCH_FEEDS, 2, async (f) => {
    const xml = await get(f.url, { label: `Forschung: ${f.name}`, timeout: 15000 });
    return xml ? parseFeed(xml, f.name).map((it) => ({ ...it, source: f.name })) : [];
  });
  return res.flat()
    .filter((it) => !it.published || it.published > now - 21 * DAY)
    .map((it) => ({ title: it.title.replace(/\s*\(arXiv:[^)]*\)\s*$/, ""), url: it.url, source: it.source, published: it.published, summary: (it.summary || "").replace(/^arXiv:\S+\s+Announce Type:\s*\w+\s*Abstract:\s*/i, "").slice(0, 400), lang: "en" }))
    .slice(0, 30);
}

// ---------- Offizielle Statistik ----------
/** JSON-stat 2.0 (Eurostat) → [{period, value}] in zeitlicher Reihenfolge. */
export function parseJsonStat(j) {
  const time = j?.dimension?.time?.category?.index;
  if (!time || !j.value) return null;
  const byIdx = Object.entries(time).sort((a, b) => a[1] - b[1]);
  const pts = byIdx.map(([period, i]) => ({ period, value: j.value[i] ?? j.value[String(i)] })).filter((p) => Number.isFinite(p.value));
  return pts.length ? { label: j.label || "", points: pts } : null;
}
/** EZB SDMX-JSON → [{period, value}] der ersten Reihe. */
export function parseEcb(j) {
  try {
    const series = Object.values(j.dataSets[0].series)[0];
    const periods = j.structure.dimensions.observation[0].values.map((v) => v.id || v.name);
    const pts = Object.entries(series.observations).map(([i, o]) => ({ period: periods[+i], value: Number(o[0]) }))
      .filter((p) => Number.isFinite(p.value)).sort((a, b) => String(a.period).localeCompare(String(b.period)));
    const title = series.attributes ? "" : "";
    return pts.length ? { label: j.structure?.name || title, points: pts } : null;
  } catch { return null; }
}

export async function fetchRealEstate({ get, fetchSeries, priceStats, status }) {
  const [hpiJ, mortJ, bundJ] = await Promise.all([
    get(REAL_ESTATE.hpi, { type: "json", label: "Eurostat Hauspreisindex DE", timeout: 20000 }),
    get(REAL_ESTATE.mortgage, { type: "json", label: "EZB Bauzinsen DE", headers: { Accept: "application/json" } }),
    get(REAL_ESTATE.bund10, { type: "json", label: "EZB Rendite 10 Jahre", headers: { Accept: "application/json" } }),
  ]);
  const hpi = parseJsonStat(hpiJ), mortgage = parseEcb(mortJ), bund = parseEcb(bundJ);
  const stocks = {};
  for (const sym of REAL_ESTATE.stocks) {
    const s = await fetchSeries(sym, null);
    const st = s ? priceStats(s.closes, s.ts) : null;
    if (st) stocks[sym] = { ...st, currency: s.currency };
  }
  const last = (x) => x?.points?.[x.points.length - 1];
  const out = {
    // Eurostat liefert die Veränderung zum Vorjahr in Prozent
    hpi: hpi ? { label: hpi.label, yoy: last(hpi).value / 100, period: last(hpi).period, series: hpi.points.slice(-16) } : null,
    mortgage: mortgage ? { rate: last(mortgage).value / 100, period: last(mortgage).period, series: mortgage.points.slice(-36), yearAgo: mortgage.points.length > 12 ? mortgage.points[mortgage.points.length - 13].value / 100 : null } : null,
    bund10: bund ? { rate: last(bund).value / 100, period: last(bund).period, avg30: mean(bund.points.slice(-22).map((p) => p.value)) / 100 } : null,
    stocks,
  };
  // Plausibilitäts-Schutz: unrealistische Werte verwerfen statt falsch anzeigen
  if (out.mortgage && !(out.mortgage.rate > 0 && out.mortgage.rate < 0.15)) out.mortgage = null;
  if (out.bund10 && !(out.bund10.rate > -0.02 && out.bund10.rate < 0.12)) out.bund10 = null;
  if (out.hpi && !(Math.abs(out.hpi.yoy) < 0.5)) out.hpi = null;
  status.push({ source: `Immobilien-Daten (${["hpi", "mortgage", "bund10"].filter((k) => out[k]).length}/3)`, ok: !!(out.hpi || out.mortgage) });
  return out;
}

// ---------- Konjunktur-Frühwarnsystem (FRED, US-Notenbank St. Louis; frei, ohne Schlüssel) ----------
export const FRED_SERIES = {
  curve: "T10Y3M",        // Zinskurve: 10 Jahre minus 3 Monate (Prozentpunkte)
  hy: "BAMLH0A0HYM2",     // Risikoaufschlag Hochzinsanleihen (Prozentpunkte)
  sahm: "SAHMREALTIME",   // Sahm-Regel (Prozentpunkte)
};
export function parseFredCsv(csv) {
  if (!csv || !/^\s*(observation_date|DATE)/i.test(csv)) return null;
  const pts = csv.trim().split(/\r?\n/).slice(1).map((l) => l.split(",")).map(([d, v]) => ({ date: d, value: Number(v) })).filter((p) => p.date && Number.isFinite(p.value));
  return pts.length ? pts : null;
}
export async function fetchMacro({ get }) {
  const start = new Date(Date.now() - 3 * 365 * 86400000).toISOString().slice(0, 10);
  const out = {};
  for (const [k, id] of Object.entries(FRED_SERIES)) {
    const pts = parseFredCsv(await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${start}`, { label: `FRED ${id}`, timeout: 20000 }));
    if (!pts) continue;
    const last = pts[pts.length - 1];
    const back = (days) => { const t = Date.parse(last.date) - days * 86400000; return [...pts].reverse().find((p) => Date.parse(p.date) <= t)?.value ?? null; };
    out[k] = { id, value: last.value, date: last.date, ago3m: back(91), ago1y: back(365), min1y: Math.min(...pts.filter((p) => Date.parse(p.date) > Date.parse(last.date) - 365 * 86400000).map((p) => p.value)), series: pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 120)) === 0).map((p) => p.value) };
  }
  return out;
}

// ---------- Rohstoff-Monitor ----------
import { COMMODITIES } from "./config.mjs";
export function rangeStats(closes) {
  const c = closes.filter((x) => Number.isFinite(x)).slice(-252);
  if (c.length < 20) return null;
  const lo = Math.min(...c), hi = Math.max(...c), last = c[c.length - 1];
  return { low52: lo, high52: hi, pos52: hi > lo ? (last - lo) / (hi - lo) : 0.5 };
}
export async function fetchCommodities({ fetchSeries, priceStats, pool, status }) {
  const res = await pool(COMMODITIES, 5, async (c) => {
    const s = await fetchSeries(c.sym, null);
    if (!s) return { ...c, missing: true };
    const st = priceStats(s.closes, s.ts);
    return st ? { ...c, ...st, ...rangeStats(s.closes) } : { ...c, missing: true };
  });
  const okN = res.filter((c) => !c.missing).length;
  status.push({ source: `Rohstoffe (${okN}/${COMMODITIES.length})`, ok: okN > 0 });
  return res;
}
