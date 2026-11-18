// Zusatzquellen: Superinvestoren (SEC 13F), Analysten-Konsens (Yahoo), Analysten-Stimmen (News),
// Aktien-Angst&Gier (CNN), EZB-Zins, Anlageklassen und die Suche nach „versteckten Perlen“.
import { ASSETS, INVESTORS, ANALYST_QUERIES, PEOPLE, UNIVERSE } from "./config.mjs";
import { parse13F, diff13F, parseFeed, tone, extractQuote, makeMatcher, dedupe, scale, blend } from "./lib.mjs";

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// ---------------- SEC 13F ----------------
export async function fetchSuperinvestors({ get, sleep, status }) {
  const UA = process.env.SEC_USER_AGENT || "SignalRadar research-dashboard (open source; github.com)";
  const sec = (url, type = "json") => get(url, { type, headers: { "User-Agent": UA, "Accept-Encoding": "gzip, deflate" }, timeout: 20000 });
  const out = [];
  for (const inv of INVESTORS) {
    try {
      const sub = await sec(`https://data.sec.gov/submissions/CIK${String(inv.cik).padStart(10, "0")}.json`);
      await sleep(150);
      if (!sub?.filings?.recent) throw new Error("keine Einreichungen");
      if (!String(sub.name || "").toLowerCase().includes(inv.kw)) throw new Error(`Name passt nicht (${sub.name})`);
      const r = sub.filings.recent;
      const idx = r.form.map((f, i) => (f === "13F-HR" ? i : -1)).filter((i) => i >= 0).slice(0, 2);
      if (!idx.length) throw new Error("kein 13F");
      const tables = [];
      for (const i of idx) {
        const acc = r.accessionNumber[i].replace(/-/g, "");
        const dir = await sec(`https://www.sec.gov/Archives/edgar/data/${inv.cik}/${acc}/index.json`);
        await sleep(150);
        const file = dir?.directory?.item?.map((x) => x.name).find((n) => /\.xml$/i.test(n) && !/primary_doc/i.test(n));
        if (!file) throw new Error("Tabelle fehlt");
        const xml = await sec(`https://www.sec.gov/Archives/edgar/data/${inv.cik}/${acc}/${file}`, "text");
        await sleep(150);
        if (!xml) throw new Error("Tabelle nicht lesbar");
        tables.push({ ...parse13F(xml), reportDate: r.reportDate[i], filingDate: r.filingDate[i] });
      }
      const [cur, prev] = tables;
      out.push({
        id: inv.id, person: inv.person, fund: inv.fund, style: inv.style, secName: sub.name,
        quarter: cur.reportDate, filed: cur.filingDate, total: cur.total, positions: cur.holdings.length,
        top: cur.holdings.slice(0, 10).map((h) => ({ name: h.name, weight: h.weight })),
        moves: prev ? diff13F(cur, prev).slice(0, 12) : [],
        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${inv.cik}&type=13F-HR`,
      });
    } catch (e) {
      status.push({ source: `SEC 13F ${inv.person}`, ok: false, error: String(e.message || e).slice(0, 80) });
    }
  }
  status.push({ source: `SEC 13F Superinvestoren (${out.length}/${INVESTORS.length})`, ok: out.length > 0 });

  // Konsens: Was kaufen/verkaufen mehrere Große gleichzeitig?
  const tally = new Map();
  for (const inv of out) for (const m of inv.moves) {
    const k = m.name.toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\b(INC|CORP|CORPORATION|CO|LTD|PLC|HLDGS|HOLDINGS|GROUP|CL A|CL B|COM|NEW)\b/g, "").replace(/\s+/g, " ").trim();
    const t = tally.get(k) || { name: m.name, buy: [], sell: [] };
    const side = m.type === "neu" || m.type === "aufgestockt" ? t.buy : t.sell;
    if (!side.includes(inv.person)) side.push(inv.person);
    tally.set(k, t);
  }
  const list = [...tally.values()];
  return {
    investors: out,
    consensusBuys: list.filter((t) => t.buy.length >= 2).sort((a, b) => b.buy.length - a.buy.length).slice(0, 10),
    consensusSells: list.filter((t) => t.sell.length >= 2).sort((a, b) => b.sell.length - a.sell.length).slice(0, 10),
  };
}

// ---------------- Yahoo Analysten-Konsens ----------------
async function yahooSession() {
  try {
    const r = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": BROWSER_UA }, redirect: "manual" });
    const raw = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie")].filter(Boolean);
    const cookie = raw.map((c) => c.split(";")[0]).join("; ");
    const cr = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", { headers: { "User-Agent": BROWSER_UA, Cookie: cookie } });
    const crumb = (await cr.text()).trim();
    if (!cr.ok || !crumb || crumb.includes("<") || crumb.length > 40) return null;
    return { cookie, crumb };
  } catch { return null; }
}
const raw = (o) => (o && typeof o === "object" ? o.raw : o);

export async function fetchConsensus({ get, pool, status }, symbols) {
  const s = await yahooSession();
  if (!s) { status.push({ source: "Yahoo Analysten-Konsens", ok: false, error: "kein Zugang (Crumb)" }); return {}; }
  const res = await pool(symbols, 4, async (sym) => {
    const j = await get(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=financialData,summaryDetail,price,defaultKeyStatistics&crumb=${encodeURIComponent(s.crumb)}`, { type: "json", headers: { "User-Agent": BROWSER_UA, Cookie: s.cookie } });
    const r = j?.quoteSummary?.result?.[0];
    if (!r) return [sym, null];
    const f = r.financialData || {}, sd = r.summaryDetail || {}, p = r.price || {}, ks = r.defaultKeyStatistics || {};
    const price = raw(f.currentPrice) ?? raw(p.regularMarketPrice);
    const target = raw(f.targetMeanPrice);
    return [sym, {
      name: p.shortName || p.longName || sym, currency: p.currency || "",
      price, target, targetLow: raw(f.targetLowPrice), targetHigh: raw(f.targetHighPrice),
      upside: price && target ? target / price - 1 : null,
      rating: raw(f.recommendationMean), ratingKey: f.recommendationKey || null, analysts: raw(f.numberOfAnalystOpinions) || 0,
      pe: raw(sd.trailingPE) ?? null, fpe: raw(sd.forwardPE) ?? raw(ks.forwardPE) ?? null,
      divYield: raw(sd.dividendYield) ?? null, mcap: raw(p.marketCap) ?? raw(sd.marketCap) ?? null,
      revGrowth: raw(f.revenueGrowth) ?? null, margin: raw(f.profitMargins) ?? null,
    }];
  });
  const out = Object.fromEntries(res.filter(([, v]) => v));
  status.push({ source: `Yahoo Analysten-Konsens (${Object.keys(out).length}/${symbols.length})`, ok: Object.keys(out).length > 0 });
  return out;
}

// ---------------- Analysten- & Profi-Stimmen aus Schlagzeilen ----------------
export async function fetchAnalystVoices({ get, pool, status }, NOW) {
  const peopleM = PEOPLE.map((p) => [p, makeMatcher([p])]);
  const res = await pool(ANALYST_QUERIES, 5, async (aq) => {
    const loc = aq.lang === "de" ? "hl=de&gl=DE&ceid=DE:de" : "hl=en-US&gl=US&ceid=US:en";
    const xml = await get(`https://news.google.com/rss/search?q=${encodeURIComponent(aq.q + " when:3d")}&${loc}`, { label: `Analysten-Stimmen ${aq.lang.toUpperCase()}: ${aq.q.slice(0, 28)}…`, timeout: 12000 });
    return xml ? parseFeed(xml, "Google News").map((it) => ({ ...it, lang: aq.lang })) : [];
  });
  const items = dedupe(res.flat().map((it) => ({ ...it, themes: [] })))
    .filter((it) => !it.published || it.published > NOW - 4 * 86400000)
    .map((it) => ({
      title: it.title, url: it.url, source: it.source, published: it.published, lang: it.lang,
      tone: tone(it.title), quote: extractQuote(it.title),
      who: peopleM.find(([, m]) => m(it.title))?.[0] || null,
    }))
    .filter((it) => it.who || it.quote || it.tone !== "neutral")
    .sort((a, b) => (b.who ? 1 : 0) + (b.quote ? 1 : 0) - ((a.who ? 1 : 0) + (a.quote ? 1 : 0)) || (b.published || 0) - (a.published || 0));
  const bull = items.filter((i) => i.tone === "bullish").length, bear = items.filter((i) => i.tone === "bearish").length;
  return { items: items.slice(0, 60), bull, bear };
}

// ---------------- Stimmung & Zinsen ----------------
export async function fetchCnnFearGreed({ get }) {
  const j = await get("https://production.dataviz.cnn.io/index/fearandgreed/graphdata", { type: "json", label: "CNN Fear & Greed (Aktien)", headers: { "User-Agent": BROWSER_UA, Referer: "https://edition.cnn.com/", Origin: "https://edition.cnn.com" } });
  const f = j?.fear_and_greed;
  if (!f || !Number.isFinite(+f.score)) return null;
  const hist = (j.fear_and_greed_historical?.data || []).slice(-90).map((d) => Math.round(d.y));
  return { value: Math.round(+f.score), rating: f.rating, weekAgo: Math.round(+f.previous_1_week), monthAgo: Math.round(+f.previous_1_month), spark: hist };
}

export async function fetchEcbRate({ get }) {
  const j = await get("https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR.LEV?lastNObservations=1&format=jsondata", { type: "json", label: "EZB-Einlagenzins", headers: { Accept: "application/json" } });
  try {
    const series = Object.values(j.dataSets[0].series)[0];
    const obs = Object.values(series.observations)[0];
    return Number(obs[0]) / 100;
  } catch { return null; }
}

// ---------------- Anlageklassen ----------------
export async function fetchAssets({ fetchSeries, priceStats, pool, status }) {
  const res = await pool(ASSETS, 5, async (a) => {
    let s = await fetchSeries(a.sym, null);
    let used = a.sym;
    if (!s && a.alt) { s = await fetchSeries(a.alt, null); used = a.alt; }
    const st = s ? priceStats(s.closes, s.ts) : null;
    return st ? { ...a, sym: used, currency: s.currency, ...st } : { ...a, missing: true };
  });
  const okN = res.filter((a) => !a.missing).length;
  status.push({ source: `Anlageklassen (${okN}/${ASSETS.length})`, ok: okN > 0 });
  return res;
}

// ---------------- Markt-Risiko-Ampel ----------------
export function marketRisk({ bubble, prices, cnn, universePrices }) {
  const vix = prices["^VIX"]?.last;
  const above = Object.values(universePrices).filter((p) => Number.isFinite(p.ext200));
  const breadth = above.length ? above.filter((p) => p.ext200 > 0).length / above.length : null;
  const stress = Math.round(blend([[scale(vix, 13, 35), 0.5], [scale(breadth, 0.75, 0.3), 0.3], [scale(cnn?.value, 60, 10), 0.2]]));
  const euphoria = bubble;
  let level = "gelb";
  if (Number.isFinite(euphoria) && Number.isFinite(stress)) {
    if (euphoria >= 75 || stress >= 70) level = "rot";
    else if (euphoria < 60 && stress < 45) level = "grün";
  }
  return { level, euphoria, stress: Number.isFinite(stress) ? stress : null, breadth, vix: vix ?? null };
}

// ---------------- Versteckte Perlen ----------------
// Regelbasiert und nachvollziehbar: Aufwärtstrend ohne Überhitzung, stärker als der Markt,
// Analysten sehen deutliches Potenzial, Bewertung nicht extrem. Kein Versprechen – ein Startpunkt für eigene Recherche.
export function findGems({ universePrices, consensus, benchmark3m }) {
  const out = [];
  for (const [sym, p] of Object.entries(universePrices)) {
    const c = consensus[sym];
    if (!p || !c || !Number.isFinite(p.ext200)) continue;
    const reasons = [], score = [];
    const up = c.upside, n = c.analysts || 0;
    if (!(Number.isFinite(up) && up >= 0.12 && n >= 5 && Number.isFinite(c.rating) && c.rating <= 2.3)) continue;
    if (p.ext200 < -0.05 || p.ext200 > 0.35 || p.rsi > 75) continue;
    score.push([scale(up, 0.1, 0.5), 0.35]);
    reasons.push(`${n} Analysten sehen im Schnitt ${Math.round(up * 100)} % Luft bis zum Kursziel. Ihre Note: ${c.rating.toFixed(1).replace(".", ",")} (1 = stark kaufen, 5 = verkaufen).`);
    const rs = Number.isFinite(benchmark3m) && Number.isFinite(p.chg3m) ? p.chg3m - benchmark3m : null;
    if (Number.isFinite(rs)) { score.push([scale(rs, -0.1, 0.25), 0.25]); if (rs > 0.03) reasons.push(`Stärker als der Gesamtmarkt: ${Math.round(p.chg3m * 100)} % in 3 Monaten (Markt ${Math.round(benchmark3m * 100)} %).`); }
    score.push([100 - Math.abs(p.ext200 - 0.08) * 400, 0.2]);
    reasons.push(p.ext200 >= 0 ? `Im Aufwärtstrend, aber nicht überhitzt (${Math.round(p.ext200 * 100)} % über der 200-Tage-Linie).` : "Knapp unter der 200-Tage-Linie: Trend noch nicht bestätigt.");
    const pe = c.fpe ?? c.pe;
    if (Number.isFinite(pe) && pe > 0) { score.push([scale(pe, 45, 12), 0.2]); reasons.push(`Bewertung: KGV ${Math.round(pe)} ${pe < 18 ? "(günstig)" : pe < 30 ? "(normal)" : "(teuer)"}.`); }
    const s = blend(score);
    out.push({ sym, name: c.name, score: Math.round(s), price: c.price, currency: c.currency, target: c.target, upside: up, analysts: n, rating: c.rating, pe, chg3m: p.chg3m, ext200: p.ext200, riskClass: p.riskClass, vol: p.vol, maxDD: p.maxDD, spark: p.spark, reasons });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}

export { UNIVERSE, ASSETS };
