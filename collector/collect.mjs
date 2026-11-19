#!/usr/bin/env node
// Signal-Radar – Datensammler.
// Läuft in GitHub Actions (stündlich), holt alle Quellen serverseitig (kein CORS-Problem)
// und schreibt site/data/data.json + site/data/history.json.
//
//   node collector/collect.mjs            # echte Daten
//   PAGES_URL=https://…/  node …          # vorherige Historie von der Live-Seite übernehmen
//   ANTHROPIC_API_KEY=…   node …          # zusätzlich Claude-Lagebericht (optional)

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES, IPO_WATCH, MARKETS, BUBBLE_TICKERS, FEEDS, SIGNAL_WORDS, UNIVERSE, EVENTS } from "./config.mjs";
import { computeEvents, fetchResearch, fetchRealEstate } from "./insights.mjs";
import { fetchSuperinvestors, fetchConsensus, fetchAnalystVoices, fetchCnnFearGreed, fetchEcbRate, fetchAssets, marketRisk, findGems } from "./extra.mjs";
import {
  parseFeed, makeMatcher, dedupe, priceStats, attentionStats, themeScores,
  scale, blend, zoneLabel, mean,
} from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(process.env.RADAR_OUT_DIR || path.resolve(here, "../site/data"));
const UA = "Mozilla/5.0 (compatible; SignalRadar/1.0; +https://github.com/)";
const NOW = Date.now();
const DAY = 86400000;
const status = []; // Quellen-Status für Transparenz im Dashboard

// ---------------- Netzwerk ----------------
async function get(url, { type = "text", timeout = 15000, headers = {}, label } = {}) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA, Accept: "*/*", ...headers } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = type === "json" ? await res.json() : await res.text();
    if (label) status.push({ source: label, ok: true, ms: Date.now() - t0 });
    return body;
  } catch (e) {
    if (label) status.push({ source: label, ok: false, error: String(e.message || e).slice(0, 80) });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Führt Aufgaben mit begrenzter Parallelität aus. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- Kurse ----------------
async function fetchSeries(sym, stooqSym) {
  const y = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`, { type: "json" });
  const r = y?.chart?.result?.[0];
  if (r?.indicators?.quote?.[0]?.close) {
    const closes = r.indicators.quote[0].close;
    const ts = r.timestamp.map((t) => t * 1000);
    const live = r.meta?.regularMarketPrice;
    if (Number.isFinite(live)) closes[closes.length - 1] = live;
    return { closes, ts, currency: r.meta?.currency || "" };
  }
  if (stooqSym !== null) {
    const s = stooqSym || `${sym.toLowerCase()}.us`;
    const csv = await get(`https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`);
    if (csv && csv.startsWith("Date")) {
      const rows = csv.trim().split("\n").slice(1).slice(-260).map((l) => l.split(","));
      return { closes: rows.map((r) => +r[4]), ts: rows.map((r) => Date.parse(r[0])), currency: "" };
    }
  }
  return null;
}

async function fetchAllPrices() {
  const syms = new Map();
  for (const m of MARKETS) syms.set(m.sym, m.stooq);
  for (const t of BUBBLE_TICKERS) syms.set(t, undefined);
  syms.set("^TNX", null);
  for (const t of UNIVERSE) if (!syms.has(t)) syms.set(t, t.includes(".") ? null : undefined);
  for (const th of THEMES) { syms.set(th.etf, undefined); for (const t of th.tickers) syms.set(t, t.includes(".") ? null : undefined); }
  const entries = [...syms.entries()];
  const res = await pool(entries, 6, async ([sym, stq]) => [sym, await fetchSeries(sym, stq)]);
  const out = {};
  for (const [sym, s] of res) if (s) { const st = priceStats(s.closes, s.ts); if (st) out[sym] = { ...st, currency: s.currency }; }
  const missing = entries.map(([sym]) => sym).filter((sym) => !out[sym]);
  status.push({ source: `Kurse Yahoo/Stooq (${entries.length - missing.length}/${entries.length})`, ok: missing.length < entries.length / 2, ...(missing.length ? { error: `fehlt: ${missing.join(", ")}` } : {}) });
  return out;
}

// ---------------- Aufmerksamkeit (Wikipedia) ----------------
const ymd = (ms) => new Date(ms).toISOString().slice(0, 10).replace(/-/g, "");
async function pageviews(article) {
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(article)}/daily/${ymd(NOW - 95 * DAY)}/${ymd(NOW - DAY)}`;
  const j = await get(url, { type: "json", headers: { "Api-User-Agent": UA } });
  if (!j?.items) return null;
  return j.items.map((it) => ({ d: it.timestamp.slice(0, 8), v: it.views }));
}
async function fetchAttention() {
  const articles = [...new Set([...THEMES.flatMap((t) => t.wiki), ...IPO_WATCH.map((w) => w.wiki)])];
  const res = await pool(articles, 8, async (a) => [a, await pageviews(a)]);
  const ok = res.filter(([, v]) => v).length;
  status.push({ source: `Wikipedia-Aufrufe (${ok}/${articles.length} Artikel)`, ok: ok > articles.length / 2 });
  const byArticle = Object.fromEntries(res.filter(([, v]) => v));
  const sumDaily = (list) => {
    const acc = new Map();
    for (const a of list) for (const { d, v } of byArticle[a] || []) acc.set(d, (acc.get(d) || 0) + v);
    return [...acc.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  };
  return { sumDaily, byArticle };
}

// ---------------- Nachrichten ----------------
function gnewsUrl(q, lang) {
  const loc = lang === "de" ? "hl=de&gl=DE&ceid=DE:de" : "hl=en-US&gl=US&ceid=US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:7d")}&${loc}`;
}
async function fetchNews() {
  const jobs = [];
  for (const th of THEMES) th.news.forEach((q, i) => jobs.push({ kind: "theme", theme: th.id, url: gnewsUrl(q, i === 0 ? "en" : "de"), label: `Google News: ${th.short} ${i === 0 ? "EN" : "DE"}` }));
  for (const w of IPO_WATCH) jobs.push({ kind: "ipo", ipo: w.id, url: gnewsUrl(w.query, "en"), label: `Google News: ${w.name}` });
  // Politik, Notenbanken, Konjunktur: eigene Suchen, damit die Ereignis-Analyse genug Meldungen hat
  for (const ev of EVENTS) ev.q.forEach((q, i) => jobs.push({ kind: "event", url: gnewsUrl(q, i === 0 ? "de" : "en"), label: `Google News: ${ev.name} ${i === 0 ? "DE" : "EN"}` }));
  for (const f of FEEDS) jobs.push({ kind: "feed", feed: f, url: f.url, label: f.name });

  const results = await pool(jobs, 8, async (j) => {
    const xml = await get(j.url, { label: j.label, timeout: 12000 });
    return { job: j, items: xml ? parseFeed(xml, j.feed?.name || "") : [] };
  });

  // Hacker News Titelseite (Tech-Szene)
  const hn = await get("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=60", { type: "json", label: "Hacker News Titelseite" });
  const hnItems = (hn?.hits || []).map((h) => ({
    title: h.title, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    published: h.created_at_i * 1000, source: "Hacker News", points: h.points, comments: h.num_comments, social: true,
  }));
  return { results, hnItems };
}

const themeMatchers = THEMES.map((t) => [t.id, makeMatcher(t.kw)]);
const signalMatchers = SIGNAL_WORDS.map((s) => [s.tag, makeMatcher(s.kw)]);
const ipoMatchers = IPO_WATCH.map((w) => [w.id, makeMatcher(w.kw)]);
const tagThemes = (text) => themeMatchers.filter(([, m]) => m(text)).map(([id]) => id);
const tagSignals = (text) => signalMatchers.filter(([, m]) => m(text)).map(([tag]) => tag);

// Hacker-News-Erwähnungen pro Thema: letzte 7 Tage vs. Tagesschnitt der 28 Tage davor
async function fetchHnRatios() {
  const t7 = Math.floor((NOW - 7 * DAY) / 1000), t35 = Math.floor((NOW - 35 * DAY) / 1000);
  const res = await pool(THEMES, 6, async (th) => {
    const q = encodeURIComponent(th.hn);
    const [a, b] = await Promise.all([
      get(`https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=0&numericFilters=created_at_i>${t7}`, { type: "json" }),
      get(`https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=0&numericFilters=created_at_i>${t35},created_at_i<=${t7}`, { type: "json" }),
    ]);
    if (!a || !b) return [th.id, null];
    const prevPerWeek = b.nbHits / 4;
    return [th.id, { last7: a.nbHits, ratio: prevPerWeek ? a.nbHits / prevPerWeek : null }];
  });
  const ok = res.filter(([, v]) => v).length;
  status.push({ source: `Hacker-News-Suche (${ok}/${THEMES.length})`, ok: ok > 0 });
  return Object.fromEntries(res);
}

// ---------------- Stimmung & Prognosemärkte ----------------
async function fetchFearGreed() {
  const j = await get("https://api.alternative.me/fng/?limit=60", { type: "json", label: "Krypto Fear & Greed" });
  if (!j?.data?.length) return null;
  const d = j.data.map((x) => +x.value).reverse();
  return { value: d[d.length - 1], label: j.data[0].value_classification, spark: d };
}

async function fetchCrypto() {
  const j = await get("https://api.coingecko.com/api/v3/search/trending", { type: "json", label: "CoinGecko Trends" });
  return (j?.coins || []).slice(0, 7).map((c) => ({ name: c.item.name, symbol: c.item.symbol, rank: c.item.market_cap_rank, chg24h: c.item.data?.price_change_percentage_24h?.eur ?? null }));
}

async function fetchPolymarket() {
  const queries = ["Anthropic IPO", "OpenAI IPO", "SpaceX IPO", "AI bubble", "Nvidia"];
  const seen = new Set(), out = [];
  for (const q of queries) {
    const j = await get(`https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(q)}&limit_per_type=6&events_status=active`, { type: "json", label: `Polymarket: ${q}` });
    for (const ev of j?.events || []) {
      for (const m of ev.markets || []) {
        if (m.closed || seen.has(m.id)) continue;
        let outcomes, prices;
        try { outcomes = JSON.parse(m.outcomes); prices = JSON.parse(m.outcomePrices).map(Number); } catch { continue; }
        const yes = outcomes.findIndex((o) => /^yes$/i.test(o));
        if (yes < 0 || !Number.isFinite(prices[yes])) continue;
        const text = `${ev.title} ${m.question}`.toLowerCase();
        if (!/ipo|public|bubble|market cap|largest company|valuation|nvidia|anthropic|openai|spacex/.test(text)) continue;
        seen.add(m.id);
        out.push({
          question: m.question, prob: prices[yes], volume: Math.round(+m.volume || 0),
          endDate: m.endDate || null, url: `https://polymarket.com/event/${ev.slug}`,
          topic: q,
        });
      }
    }
    await sleep(250);
  }
  return out.sort((a, b) => b.volume - a.volume).slice(0, 12);
}

// GDELT: Anteil der weltweiten Berichterstattung über "Blase" (Medien-Temperatur)
async function fetchBubbleChatter() {
  const q = encodeURIComponent('("ai bubble" OR "tech bubble" OR "stock market bubble" OR "KI-Blase")');
  const j = await get(`https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=timelinevol&format=json&timespan=90d`, { type: "json", label: "GDELT Blasen-Berichterstattung", timeout: 25000 });
  const data = j?.timeline?.[0]?.data;
  if (!data?.length) return null;
  const v = data.map((d) => d.value);
  const last7 = mean(v.slice(-7)), base = v.slice(0, -7);
  const m = mean(base);
  const sd = Math.sqrt(mean(base.map((x) => (x - m) ** 2))) || 1;
  return { z: (last7 - m) / sd, ratio: m ? last7 / m : null, spark: v.slice(-60).map((x) => Math.round(x * 1e4) / 1e4) };
}

// ---------------- Historie & optionaler Claude-Bericht ----------------
async function loadPrevious() {
  const base = process.env.PAGES_URL;
  const local = async (f) => { try { return JSON.parse(await readFile(path.join(OUT_DIR, f), "utf8")); } catch { return null; } };
  if (!base) return { history: (await local("history.json")) || [], prevData: await local("data.json") };
  const u = base.endsWith("/") ? base : base + "/";
  const [history, prevData] = await Promise.all([
    get(`${u}data/history.json?t=${NOW}`, { type: "json" }),
    get(`${u}data/data.json?t=${NOW}`, { type: "json" }),
  ]);
  return { history: Array.isArray(history) ? history : [], prevData: prevData && !prevData.demo ? prevData : null };
}

async function claudeBriefing(data, prevData) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const prev = prevData?.aiBriefing;
  const everyH = Number(process.env.BRIEFING_EVERY_HOURS || 6);
  if (prev?.generatedAt && NOW - Date.parse(prev.generatedAt) < everyH * 3600e3) return prev;
  let Anthropic;
  try { ({ default: Anthropic } = await import("@anthropic-ai/sdk")); } catch { status.push({ source: "Claude-Lagebericht", ok: false, error: "SDK fehlt (npm ci)" }); return prev || null; }
  const compact = {
    datum: new Date(NOW).toISOString().slice(0, 10),
    blasenMeter: { wert: data.bubble.score, zone: data.bubble.zone, bausteine: data.bubble.components.map((c) => [c.label, c.score]) },
    themen: data.themes.map((t) => ({ thema: t.name, hype: t.scores.hype, momentum: t.scores.momentum, ueberhitzung: t.scores.heat, quadrant: t.scores.quadrant, etf3M: t.price?.chg3m, news7T: t.news7d })),
    ipoRadar: data.ipoWatch.map((w) => ({ name: w.name, news7T: w.news7d, aufmerksamkeitTrend: w.attention?.mom })),
    prognosemaerkte: data.polymarket.slice(0, 6).map((p) => [p.question, p.prob]),
    schlagzeilen: data.news.filter((n) => n.signals.length).slice(0, 40).map((n) => `${n.title} (${n.source})`),
    nachrichtenLage: (data.events || []).slice(0, 5).map((e) => ({ art: e.name, meldungen48h: e.n48h, beispiele: e.top.map((t) => t.title) })),
  };
  try {
    const client = new Anthropic();
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system:
        "Du schreibst das tägliche Briefing für ein Investment-Signal-Dashboard, gelesen von Privatanlegern in WhatsApp-Gruppen. " +
        "Deutsch, klar, ohne Fachchinesisch, max. 170 Wörter. Format: genau 5 Zeilen, jede beginnt mit einem passenden Emoji und einem fettgedruckten Stichwort (**so**), danach ein Satz. " +
        "Zeile 1: Gesamtlage/Blasen-Meter. Zeile 2: stärkstes Thema. Zeile 3: unterschätztes Thema (Quadrant 'quiet' = Kurs steigt, wenig Hype). Zeile 4: Warnsignal (beziehe die nachrichtenLage ein: welche Ereignisse wie Zinsen, Zölle oder Krisen bewegen gerade den Markt und was bedeutet das). Zeile 5: IPO-/Claude-Radar. " +
        "Nur Aussagen, die aus den gelieferten Daten folgen; keine erfundenen Zahlen oder Nachrichten. Keine Kauf- oder Verkaufsempfehlungen – beschreibe Beobachtungen.",
      messages: [{ role: "user", content: `Daten (JSON):\n${JSON.stringify(compact)}` }],
    });
    if (res.stop_reason === "refusal") throw new Error("abgelehnt");
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) throw new Error("leer");
    status.push({ source: "Claude-Lagebericht", ok: true });
    return { text, model: res.model, generatedAt: new Date(NOW).toISOString() };
  } catch (e) {
    status.push({ source: "Claude-Lagebericht", ok: false, error: String(e.message || e).slice(0, 80) });
    return prev || null;
  }
}

// Englische Analysten-Schlagzeilen ins Deutsche (optional, nur mit API-Schlüssel; bereits übersetzte werden wiederverwendet)
async function claudeTranslate(items, prevItems = []) {
  const cache = new Map((prevItems || []).filter((v) => v.de).map((v) => [v.title, v.de]));
  for (const v of items) if (cache.has(v.title)) v.de = cache.get(v.title);
  const todo = items.map((v, i) => ({ v, i })).filter(({ v }) => v.lang === "en" && !v.de).slice(0, 16);
  if (!todo.length || !process.env.ANTHROPIC_API_KEY) return;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: { type: "object", additionalProperties: false, required: ["items"], properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["i", "de"], properties: { i: { type: "integer" }, de: { type: "string" } } } } } } },
      },
      system: "Übersetze Finanz-Schlagzeilen sinngetreu in natürliches, einfaches Deutsch. Namen, Firmen und Zahlen unverändert. Wörtliche Zitate bleiben Zitate. Nichts hinzufügen.",
      messages: [{ role: "user", content: JSON.stringify(todo.map(({ v, i }) => ({ i, text: v.quote || v.title }))) }],
    });
    if (res.stop_reason === "refusal") throw new Error("abgelehnt");
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    for (const { i, de } of JSON.parse(text).items || []) if (items[i] && typeof de === "string" && de.length < 400) items[i].de = de;
    status.push({ source: "Claude-Übersetzung Analysten-Stimmen", ok: true });
  } catch (e) {
    status.push({ source: "Claude-Übersetzung Analysten-Stimmen", ok: false, error: String(e.message || e).slice(0, 80) });
  }
}

// ---------------- Zusammenbau ----------------
async function main() {
  const [prices, attention, newsRaw, hnRatios, fearGreed, cryptoTrending, polymarket, previous] = await Promise.all([
    fetchAllPrices(), fetchAttention(), fetchNews(), fetchHnRatios(), fetchFearGreed(), fetchCrypto(), fetchPolymarket(), loadPrevious(),
  ]);
  const chatter = await fetchBubbleChatter();
  const ctx = { get, pool, sleep, status, fetchSeries, priceStats };
  const [research, realEstate] = await Promise.all([fetchResearch({ get, pool }, NOW), fetchRealEstate({ get, fetchSeries, priceStats, status })]);
  const [superinvestors, consensus, voices, cnnFearGreed, ecbRate, assets] = await Promise.all([
    fetchSuperinvestors(ctx), fetchConsensus(ctx, UNIVERSE), fetchAnalystVoices(ctx, NOW), fetchCnnFearGreed(ctx), fetchEcbRate(ctx), fetchAssets(ctx),
  ]);
  const universePrices = Object.fromEntries(UNIVERSE.filter((t) => prices[t]).map((t) => [t, prices[t]]));
  const gems = findGems({ universePrices, consensus, benchmark3m: prices["^GSPC"]?.chg3m });
  const analysts = Object.entries(consensus).map(([sym, c]) => ({ sym, ...c, chg3m: prices[sym]?.chg3m ?? null, riskClass: prices[sym]?.riskClass ?? null }))
    .filter((c) => c.analysts > 0).sort((a, b) => (b.upside ?? -9) - (a.upside ?? -9));

  // Nachrichten zusammenführen, verschlagworten, Dubletten entfernen
  let all = [];
  for (const { job, items } of newsRaw.results) {
    for (const it of items) {
      const text = `${it.title} ${it.summary || ""}`;
      const themes = new Set(tagThemes(it.title));
      if (job.kind === "theme" && themes.size === 0) themes.add(job.theme); // Suchtreffer gehört zum Thema
      all.push({ ...it, source: it.source || job.feed?.name || "Google News", social: !!job.feed?.social, themes: [...themes], signals: tagSignals(text), ipoHint: job.ipo || null });
    }
  }
  for (const it of newsRaw.hnItems) all.push({ ...it, themes: tagThemes(it.title), signals: tagSignals(it.title) });
  all = all.filter((n) => !n.published || n.published > NOW - 8 * DAY);
  const news = dedupe(all)
    .map((n) => ({ ...n, signals: [...new Set(n.signals)] }))
    .sort((a, b) => (b.published || 0) - (a.published || 0));

  const within = (n, days) => n.published && n.published > NOW - days * DAY;
  const themes = THEMES.map((th) => {
    const daily = attention.sumDaily(th.wiki);
    const att = attentionStats(daily);
    const mine = news.filter((n) => n.themes.includes(th.id));
    const n7 = mine.filter((n) => within(n, 7)).length;
    const n2 = mine.filter((n) => within(n, 2)).length;
    const newsAccel = n7 >= 5 ? (n2 / 2) / (n7 / 7) : null; // Tempo der letzten 48 h vs. Wochenschnitt
    const price = prices[th.etf] || null;
    const scores = themeScores({ attention: att, newsAccel, price, hnRatio: hnRatios[th.id]?.ratio });
    return {
      id: th.id, name: th.name, short: th.short, etf: th.etf,
      price, attention: att, news7d: n7, news48h: n2, newsAccel, hn: hnRatios[th.id] || null,
      tickers: th.tickers.map((t) => ({ sym: t, ...(prices[t] ? { last: prices[t].last, chg1d: prices[t].chg1d, chg3m: prices[t].chg3m, ext200: prices[t].ext200, currency: prices[t].currency } : {}) })),
      scores,
      top: mine.slice(0, 6).map((n) => ({ title: n.title, url: n.url, source: n.source, published: n.published })),
    };
  });

  const ipoWatch = IPO_WATCH.map((w) => {
    const att = attentionStats((attention.byArticle[w.wiki] || []).map((x) => x.v));
    const m = ipoMatchers.find(([id]) => id === w.id)[1];
    const mine = news.filter((n) => m(n.title));
    const ipoTalk = mine.filter((n) => n.signals.includes("IPO") || n.signals.includes("Finanzierung"));
    return {
      id: w.id, name: w.name, attention: att,
      news7d: mine.filter((n) => within(n, 7)).length,
      ipoNews7d: ipoTalk.filter((n) => within(n, 7)).length,
      top: (ipoTalk.length ? ipoTalk : mine).slice(0, 4).map((n) => ({ title: n.title, url: n.url, source: n.source, published: n.published })),
      markets: polymarket.filter((p) => p.question.toLowerCase().includes(w.id === "xai" ? "xai" : w.name.split(" ")[0].toLowerCase())).slice(0, 3),
    };
  });

  // Blasen-Meter
  const ipoHeat = blend([
    [scale(prices["IPO"]?.chg3m, -0.15, 0.35), 0.5],
    [scale(ipoWatch.reduce((s, w) => s + w.ipoNews7d, 0), 3, 60), 0.5],
  ]);
  const components = [
    { id: "fng", label: "Krypto-Gier", hint: "Crypto Fear & Greed Index (0 = Panik, 100 = Gier)", score: fearGreed?.value ?? NaN, weight: 0.15 },
    { id: "nasdaq", label: "Tech-Überdehnung", hint: "Nasdaq 100 (QQQ) über/unter seiner 200-Tage-Linie", score: scale(prices["QQQ"]?.ext200, -0.05, 0.22), raw: prices["QQQ"]?.ext200, weight: 0.2 },
    { id: "nvda", label: "KI-Leitwert Nvidia", hint: "Abstand Nvidia zur 200-Tage-Linie", score: scale(prices["NVDA"]?.ext200, -0.1, 0.5), raw: prices["NVDA"]?.ext200, weight: 0.15 },
    { id: "spec", label: "Spekulation", hint: "ARK Innovation (ARKK), 3-Monats-Performance – Barometer für Zocker-Laune", score: scale(prices["ARKK"]?.chg3m, -0.2, 0.45), raw: prices["ARKK"]?.chg3m, weight: 0.15 },
    { id: "vix", label: "Sorglosigkeit", hint: "VIX niedrig = Markt erwartet kaum Risiko", score: scale(prices["^VIX"]?.last, 32, 12), raw: prices["^VIX"]?.last, weight: 0.15 },
    { id: "ipo", label: "IPO-Fieber", hint: "IPO-ETF (3M) + Schlagzeilen über Mega-Börsengänge (Anthropic, OpenAI, SpaceX …)", score: ipoHeat, weight: 0.12 },
    { id: "chatter", label: "Blasen-Gerede", hint: "Anteil der Weltpresse, die über eine Blase schreibt (GDELT) – viel Gerede heißt oft: noch nicht ganz oben", score: scale(chatter?.z, -1, 3), raw: chatter?.ratio, weight: 0.08 },
  ].map((c) => ({ ...c, score: Number.isFinite(c.score) ? Math.round(c.score) : null }));
  const bubbleScore = Math.round(blend(components.map((c) => [c.score ?? NaN, c.weight])));

  const market = MARKETS.map((m) => ({ ...m, ...(prices[m.sym] || {}) }));
  const data = {
    version: 1,
    demo: process.env.RADAR_DEMO === "1",
    generatedAt: new Date(NOW).toISOString(),
    bubble: { score: Number.isFinite(bubbleScore) ? bubbleScore : null, zone: zoneLabel(bubbleScore), components, chatter },
    market, fearGreed, cryptoTrending, polymarket,
    themes, ipoWatch,
    assets, superinvestors, voices, analysts, gems, cnnFearGreed, research, realEstate,
    events: computeEvents(news, NOW),
    rates: { ecb: ecbRate, us10y: prices["^TNX"]?.last > 0 && prices["^TNX"].last < 20 ? prices["^TNX"].last / 100 : null },
    risk: marketRisk({ bubble: bubbleScore, prices, cnn: cnnFearGreed, universePrices }),
    news: news.slice(0, 400).map(({ summary, ipoHint, ...n }) => n),
    sources: status.sort((a, b) => Number(a.ok) - Number(b.ok)),
    // Schlagwörter, damit die Seite live nachgeladene Meldungen selbst zuordnen kann
    keywords: { themes: Object.fromEntries(THEMES.map((t) => [t.id, t.kw])), signals: Object.fromEntries(SIGNAL_WORDS.map((s) => [s.tag, s.kw])) },
  };
  data.aiBriefing = await claudeBriefing(data, previous.prevData);
  await claudeTranslate(data.voices.items, previous.prevData?.voices?.items);
  await claudeTranslate(data.research, previous.prevData?.research);
  data.sources = status.sort((a, b) => Number(a.ok) - Number(b.ok));

  // Historie: ein Eintrag pro Tag (der neueste Lauf des Tages gewinnt), 365 Tage
  const today = new Date(NOW).toISOString().slice(0, 10);
  const hist = previous.history.filter((h) => h.date !== today);
  hist.push({ date: today, bubble: data.bubble.score, themes: Object.fromEntries(themes.map((t) => [t.id, [t.scores.hype, t.scores.momentum, t.scores.heat]])) });
  const history = hist.slice(-365);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "data.json"), JSON.stringify(data));
  await writeFile(path.join(OUT_DIR, "history.json"), JSON.stringify(history));
  const okCount = status.filter((s) => s.ok).length;
  console.log(`Signal-Radar: ${news.length} Meldungen, ${Object.keys(prices).length} Kurse, Quellen ${okCount}/${status.length} ok, Blasen-Meter ${data.bubble.score} (${data.bubble.zone}).`);
  if (okCount === 0) { console.error("Keine einzige Quelle erreichbar – breche ab, damit die alte Seite stehen bleibt."); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
