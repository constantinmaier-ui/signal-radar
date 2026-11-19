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
    .filter((it) => !it.published || it.published > now - (RESEARCH_FEEDS.find((f) => f.name === it.source)?.journal ? 60 : 21) * DAY)
    .map((it) => ({ title: it.title.replace(/\s*\(arXiv:[^)]*\)\s*$/, ""), url: it.url, source: it.source, journal: !!RESEARCH_FEEDS.find((f) => f.name === it.source)?.journal, published: it.published, summary: (it.summary || "").replace(/^arXiv:\S+\s+Announce Type:\s*\w+\s*Abstract:\s*/i, "").slice(0, 400), lang: "en" }))
    .sort((a, b) => Number(b.journal) - Number(a.journal) || (b.published || 0) - (a.published || 0))
    .slice(0, 30);
}

// ---------- Peer-reviewed research via OpenAlex ----------
/** Rebuilds plain text from OpenAlex's abstract_inverted_index. */
export function openAlexAbstract(inv) {
  if (!inv || typeof inv !== "object") return "";
  const words = [];
  for (const [w, pos] of Object.entries(inv)) for (const i of pos) words[i] = w;
  return words.filter(Boolean).join(" ");
}
/** OpenAlex work → compact paper record. */
export function mapOpenAlexWork(w) {
  const loc = w.primary_location || {};
  const abs = openAlexAbstract(w.abstract_inverted_index);
  return {
    title: String(w.display_name || w.title || "").replace(/<[^>]+>/g, "").trim(),
    url: w.doi || loc.landing_page_url || w.id,
    oa: w.open_access?.oa_url || null,
    journal: loc.source?.display_name || "",
    date: w.publication_date || null,
    published: w.publication_date ? Date.parse(w.publication_date) : null,
    cites: w.cited_by_count ?? 0,
    fwci: Number.isFinite(w.fwci) ? Math.round(w.fwci * 10) / 10 : null,
    authors: (w.authorships || []).slice(0, 3).map((a) => a.author?.display_name).filter(Boolean),
    moreAuthors: Math.max(0, (w.authorships || []).length - 3),
    summary: abs.length > 420 ? abs.slice(0, 400).replace(/\s+\S*$/, "") + " …" : abs,
    lang: "en",
  };
}
/**
 * Two lists from peer-reviewed top journals: most cited of the last 24 months
 * and newest of the last 120 days. Refreshed every 6 h (OpenAlex daily budget).
 */
export async function fetchJournalResearch({ get }, journals, prev, now = Date.now()) {
  if (prev?.checkedAt && now - Date.parse(prev.checkedAt) < 6 * 3600e3 && prev.top?.length) return prev;
  const key = process.env.OPENALEX_API_KEY ? `&api_key=${encodeURIComponent(process.env.OPENALEX_API_KEY)}` : "";
  const issn = journals.map((j) => j.issn).join("|");
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  const sel = "id,doi,display_name,publication_date,cited_by_count,fwci,primary_location,authorships,open_access,abstract_inverted_index";
  const q = (from, sort) => `https://api.openalex.org/works?filter=primary_location.source.issn:${issn},from_publication_date:${from},type:article&sort=${sort}&per-page=40&select=${sel}${key}`;
  const [topJ, newJ] = await Promise.all([
    get(q(day(now - 730 * DAY), "cited_by_count:desc"), { type: "json", label: "OpenAlex: meistzitierte Top-Journal-Studien", timeout: 25000 }),
    get(q(day(now - 120 * DAY), "publication_date:desc"), { type: "json", label: "OpenAlex: neue Top-Journal-Studien", timeout: 25000 }),
  ]);
  if (!topJ && !newJ) return prev || null;
  const clean = (j) => (j?.results || []).map(mapOpenAlexWork).filter((p) => p.title && !/^(front matter|back matter|issue information|erratum|corrigendum|editorial)/i.test(p.title));
  return { checkedAt: new Date(now).toISOString(), top: topJ ? clean(topJ) : prev?.top || [], recent: newJ ? clean(newJ) : prev?.recent || [] };
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

// ---------- Official sentiment measures ----------
// EU Economic Sentiment Indicator (European Commission surveys; long-run mean 100, sd 10),
// University of Michigan consumer sentiment (FRED UMCSENT), Gilchrist–Zakrajšek excess bond premium (Fed).
const ESI = (geo, indic = "BS-ESI-I") => `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ei_bssi_m_r2?format=JSON&lang=DE&geo=${geo}&indic=${indic}&s_adj=SA&sinceTimePeriod=${new Date(Date.now() - 3 * 365 * 86400000).toISOString().slice(0, 7)}`;
export const SENTIMENT_SOURCES = {
  esiDE: ESI("DE"), esiEA: ESI("EA20"), consDE: ESI("DE", "BS-CSMCI"),
  umich: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=UMCSENT",
  ebp: "https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv",
};
/** Fed CSV with columns date, gz_spread, ebp, est_prob (column order may change). */
export function parseEbpCsv(csv) {
  if (!csv) return null;
  const [head, ...rows] = csv.trim().split(/\r?\n/);
  const cols = head.toLowerCase().split(",").map((c) => c.trim().replace(/"/g, ""));
  const iD = cols.indexOf("date"), iE = cols.indexOf("ebp"), iP = cols.indexOf("est_prob"), iG = cols.indexOf("gz_spread");
  if (iD < 0 || iE < 0) return null;
  const pts = rows.map((r) => r.split(",")).map((c) => ({ date: c[iD]?.replace(/"/g, ""), ebp: Number(c[iE]), prob: iP >= 0 ? Number(c[iP]) : null, gz: iG >= 0 ? Number(c[iG]) : null })).filter((p) => p.date && Number.isFinite(p.ebp));
  return pts.length ? pts : null;
}
const pctRank = (vals, v) => Math.round((vals.filter((x) => x < v).length / vals.length) * 100);
export async function fetchSentimentOfficial({ get }) {
  const [deJ, eaJ, consJ, umCsv, ebpCsv] = await Promise.all([
    get(SENTIMENT_SOURCES.esiDE, { type: "json", label: "EU-Kommission: Wirtschaftsstimmung DE (Eurostat)", timeout: 20000 }),
    get(SENTIMENT_SOURCES.esiEA, { type: "json", label: "EU-Kommission: Wirtschaftsstimmung Euroraum (Eurostat)", timeout: 20000 }),
    get(SENTIMENT_SOURCES.consDE, { type: "json", label: "EU-Kommission: Verbrauchervertrauen DE (Eurostat)", timeout: 20000 }),
    get(SENTIMENT_SOURCES.umich, { label: "FRED UMCSENT (Uni Michigan)", timeout: 20000 }),
    get(SENTIMENT_SOURCES.ebp, { label: "US-Notenbank: Excess Bond Premium", timeout: 20000 }),
  ]);
  const js = (j) => { const r = parseJsonStat(j); if (!r) return null; const p = r.points, last = p[p.length - 1]; return { value: last.value, period: last.period, ago1y: p[p.length - 13]?.value ?? null, series: p.map((x) => x.value) }; };
  const out = { esiDE: js(deJ), esiEA: js(eaJ), consDE: js(consJ) };
  const um = parseFredCsv(umCsv);
  if (um) { const last = um[um.length - 1]; out.umich = { value: last.value, date: last.date, pct: pctRank(um.map((p) => p.value), last.value), since: um[0].date.slice(0, 4), series: um.slice(-36).map((p) => p.value) }; }
  const ebp = parseEbpCsv(ebpCsv);
  if (ebp) { const last = ebp[ebp.length - 1]; out.ebp = { value: last.ebp, prob: last.prob, gz: last.gz, date: last.date, ago1y: ebp[ebp.length - 13]?.ebp ?? null, series: ebp.slice(-36).map((p) => p.ebp) }; }
  return Object.values(out).some(Boolean) ? out : null;
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

// ---------- Tech-Trends: Was explodiert gerade bei KI-Software? ----------
import { AI_ORGS } from "./config.mjs";
export async function fetchTechTrends({ get, status }, now = Date.now()) {
  const since = new Date(now - 30 * DAY).toISOString().slice(0, 10);
  const gh = await get(`https://api.github.com/search/repositories?q=${encodeURIComponent(`created:>${since}`)}&sort=stars&order=desc&per_page=30`, {
    type: "json", label: "GitHub: schnellst wachsende Projekte",
    headers: { Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
  });
  const hf = await get("https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=30", { type: "json", label: "Hugging Face: Trend-KI-Modelle" });
  const owner = (full) => String(full || "").split("/")[0].toLowerCase();
  const repos = (gh?.items || []).map((r) => ({ name: r.full_name, url: r.html_url, stars: r.stargazers_count, desc: (r.description || "").slice(0, 140), lang: r.language, ticker: AI_ORGS[owner(r.full_name)] || null }));
  const models = (Array.isArray(hf) ? hf : []).map((m) => ({ name: m.id || m.modelId, url: `https://huggingface.co/${m.id || m.modelId}`, likes: m.likes, downloads: m.downloads, task: m.pipeline_tag || "", ticker: AI_ORGS[owner(m.id || m.modelId)] || null }));
  if (!repos.length && !models.length) status.push({ source: "Tech-Trends", ok: false, error: "GitHub und Hugging Face nicht erreichbar" });
  return { repos, models };
}

// ---------- Nutzungs-Signale (PyPI + npm), Krypto-Liquidität (DefiLlama), Strompreis (Energy-Charts) ----------
import { ADOPTION } from "./config.mjs";
export async function fetchAdoption({ get, pool, status }) {
  const res = await pool(ADOPTION, 3, async (a) => {
    const [py, npmNow, npmRange] = await Promise.all([
      a.pypi ? get(`https://pypistats.org/api/packages/${encodeURIComponent(a.pypi)}/recent`, { type: "json" }) : null,
      a.npm ? get(`https://api.npmjs.org/downloads/point/last-week/${a.npm}`, { type: "json" }) : null,
      a.npm ? get(`https://api.npmjs.org/downloads/range/last-month/${a.npm}`, { type: "json" }) : null,
    ]);
    const week = (py?.data?.last_week || 0) + (npmNow?.downloads || 0);
    const month = (py?.data?.last_month || 0);
    // npm-Tagesreihe: letzte 7 Tage gegen die 7 Tage davor → Wachstum
    const days = (npmRange?.downloads || []).map((d) => d.downloads);
    const npmGrowth = days.length >= 14 ? days.slice(-7).reduce((x, y) => x + y, 0) / Math.max(1, days.slice(-14, -7).reduce((x, y) => x + y, 0)) - 1 : null;
    const pyGrowth = py?.data?.last_week && month ? py.data.last_week / (month / 4.3) - 1 : null;
    return week ? { ...a, week, growth: npmGrowth ?? pyGrowth } : null;
  });
  const out = res.filter(Boolean).sort((x, y) => y.week - x.week);
  status.push({ source: `KI-Nutzung: PyPI + npm (${out.length}/${ADOPTION.length})`, ok: out.length > 0 });
  return out;
}

export async function fetchCryptoFlows({ get, status }) {
  const [stables, tvl] = await Promise.all([
    get("https://stablecoins.llama.fi/stablecoincharts/all", { type: "json", label: "DefiLlama Stablecoins", timeout: 20000 }),
    get("https://api.llama.fi/v2/historicalChainTvl", { type: "json", label: "DefiLlama DeFi-Kapital (TVL)", timeout: 20000 }),
  ]);
  const series = (arr, f) => (Array.isArray(arr) ? arr.map((x) => ({ t: Number(x.date) * 1000, v: f(x) })).filter((p) => Number.isFinite(p.v) && p.v > 0) : []);
  const st = series(stables, (x) => x.totalCirculatingUSD?.peggedUSD ?? x.totalCirculating?.peggedUSD);
  const tv = series(tvl, (x) => Number(x.tvl));
  const summary = (pts) => {
    if (pts.length < 40) return null;
    const last = pts[pts.length - 1], back = (d) => pts.filter((p) => p.t <= last.t - d * 864e5).pop()?.v;
    return { value: last.v, chg30: back(30) ? last.v / back(30) - 1 : null, chg90: back(90) ? last.v / back(90) - 1 : null, spark: pts.slice(-180).filter((_, i) => i % 3 === 0).map((p) => Math.round(p.v / 1e6)) };
  };
  return { stablecoins: summary(st), tvl: summary(tv) };
}

export async function fetchPower({ get, status }) {
  const end = new Date(), start = new Date(Date.now() - 45 * 864e5);
  const d = (x) => x.toISOString().slice(0, 10);
  const j = await get(`https://api.energy-charts.info/price?bzn=DE-LU&start=${d(start)}&end=${d(end)}`, { type: "json", label: "Energy-Charts Strompreis DE", timeout: 20000 });
  if (!j?.unix_seconds?.length || !j?.price?.length) return null;
  const byDay = new Map();
  j.unix_seconds.forEach((t, i) => { const v = j.price[i]; if (!Number.isFinite(v)) return; const k = new Date(t * 1000).toISOString().slice(0, 10); const a = byDay.get(k) || []; a.push(v); byDay.set(k, a); });
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ day: k, avg: v.reduce((x, y) => x + y, 0) / v.length, min: Math.min(...v), max: Math.max(...v) }));
  if (days.length < 7) return null;
  const last = days[days.length - 1], avg30 = days.slice(-30).reduce((x, y) => x + y.avg, 0) / Math.min(30, days.length);
  return { unit: j.unit || "EUR/MWh", day: last.day, avg: last.avg, min: last.min, max: last.max, avg30, series: days.map((x) => Math.round(x.avg * 10) / 10) };
}
