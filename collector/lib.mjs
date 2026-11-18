// Reine Hilfsfunktionen (ohne Netzwerk) – damit sie sich testen lassen.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", bdquo: "„", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", euro: "€" };

export function decodeEntities(s = "") {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => (n in ENTITIES ? ENTITIES[n] : m));
}
function safeChar(cp) {
  try { return String.fromCodePoint(cp); } catch { return ""; }
}

export function cleanText(s = "") {
  let t = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  t = decodeEntities(t); // Feeds kodieren HTML oft doppelt
  t = t.replace(/<[^>]+>/g, " ");
  t = decodeEntities(t);
  return t.replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}
function attr(block, name, attribute) {
  const re = new RegExp(`<${name}\\b([^>]*)/?>`, "gi");
  let m;
  while ((m = re.exec(block))) {
    const rel = m[1].match(/rel="([^"]+)"/);
    if (rel && rel[1] !== "alternate") continue;
    const a = m[1].match(new RegExp(`${attribute}="([^"]+)"`));
    if (a) return a[1];
  }
  return "";
}

/** Parst RSS 2.0 und Atom. Gibt [{title, url, published (ms), source, summary}] zurück. */
export function parseFeed(xml, fallbackSource = "") {
  const items = [];
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    let title = cleanText(tag(b, "title"));
    if (!title) continue;
    let url = isAtom ? attr(b, "link", "href") : cleanText(tag(b, "link"));
    if (!url) url = cleanText(tag(b, "guid"));
    const dateStr = cleanText(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
    const published = Date.parse(dateStr);
    let source = cleanText(tag(b, "source")) || fallbackSource;
    // Google News hängt " - Quelle" an den Titel
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim();
    const summary = cleanText(tag(b, "description") || tag(b, "summary") || tag(b, "content")).slice(0, 280);
    items.push({ title, url: decodeEntities(url), published: Number.isFinite(published) ? published : null, source, summary });
  }
  return items;
}

const WORD = "a-z0-9äöüß";
/** Baut einen Matcher: kurze Wörter (<5 Zeichen) brauchen Wortgrenzen auf beiden Seiten, längere nur vorne. */
export function makeMatcher(keywords) {
  const parts = keywords.map((k) => {
    const e = k.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return k.trim().length < 5 ? `(?<![${WORD}])${e}(?![${WORD}])` : `(?<![${WORD}])${e}`;
  });
  const re = new RegExp(parts.join("|"), "i");
  return (text) => re.test(text.toLowerCase());
}

export function normTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9äöüß ]/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
}

/** Entfernt Dubletten (gleicher normalisierter Titel), bevorzugt Einträge mit mehr Themen/früherem Datum. */
export function dedupe(items) {
  const map = new Map();
  for (const it of items) {
    const k = normTitle(it.title);
    if (!k) continue;
    const prev = map.get(k);
    if (!prev) { map.set(k, { ...it, themes: [...(it.themes || [])], echo: 1 }); continue; }
    prev.echo += 1;
    for (const t of it.themes || []) if (!prev.themes.includes(t)) prev.themes.push(t);
    if (it.published && (!prev.published || it.published < prev.published)) prev.published = it.published;
  }
  return [...map.values()];
}

// ---------- Statistik ----------
export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
export function std(a) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}
export function sma(a, n) {
  if (a.length < n) return NaN;
  return mean(a.slice(-n));
}
export function rsi(closes, n = 14) {
  if (closes.length < n + 1) return NaN;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= n; loss /= n;
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
  }
  if (loss === 0) return 100;
  return 100 - 100 / (1 + gain / loss);
}
export function ret(closes, back) {
  if (closes.length <= back) return NaN;
  const a = closes[closes.length - 1 - back], b = closes[closes.length - 1];
  return a ? b / a - 1 : NaN;
}

/** Kennzahlen aus einer Tageskurs-Reihe. */
export function priceStats(closes, timestamps) {
  const c = closes.filter((x) => Number.isFinite(x));
  if (c.length < 30) return null;
  const last = c[c.length - 1];
  const s200 = c.length >= 200 ? sma(c, 200) : sma(c, Math.min(c.length, 150));
  const hi = Math.max(...c.slice(-252));
  return {
    last,
    chg1d: ret(c, 1), chg1w: ret(c, 5), chg1m: ret(c, 21), chg3m: ret(c, 63), chg1y: ret(c, Math.min(251, c.length - 1)),
    ext200: s200 ? last / s200 - 1 : NaN,
    rsi: rsi(c.slice(-120)),
    fromHigh: last / hi - 1,
    vol: volatility(c), maxDD: maxDrawdown(c.slice(-252)), riskClass: riskClass(volatility(c)),
    spark: downsample(c.slice(-130), 65),
    sparkEnd: timestamps ? timestamps[timestamps.length - 1] : null,
  };
}

export function downsample(a, n) {
  if (a.length <= n) return a.map(round4);
  const out = [];
  for (let i = 0; i < n; i++) out.push(round4(a[Math.round((i * (a.length - 1)) / (n - 1))]));
  return out;
}
const round4 = (x) => (Number.isFinite(x) ? Math.round(x * 1e4) / 1e4 : null);

/** Linear auf 0..100 abbilden, begrenzt. lo kann > hi sein (invertiert). */
export function scale(x, lo, hi) {
  if (!Number.isFinite(x)) return NaN;
  const t = (x - lo) / (hi - lo);
  return Math.max(0, Math.min(100, t * 100));
}

/** Gewichteter Mittelwert, fehlende Werte werden ausgelassen und Gewichte neu verteilt. */
export function blend(parts) {
  let s = 0, w = 0;
  for (const [v, wt] of parts) if (Number.isFinite(v)) { s += v * wt; w += wt; }
  return w ? s / w : NaN;
}

/** Aufmerksamkeit aus täglichen Seitenaufrufen (ältester zuerst). */
export function attentionStats(daily) {
  const d = daily.filter((x) => Number.isFinite(x));
  if (d.length < 21) return null;
  const last7 = mean(d.slice(-7));
  const base = d.slice(0, -7);
  const prev28 = mean(base.slice(-28));
  const m = mean(base), s = std(base);
  return {
    last7: Math.round(last7),
    mom: prev28 ? last7 / prev28 - 1 : NaN,
    z: s ? (last7 - m) / s : 0,
    spark: downsample(d.slice(-60), 60).map((x) => Math.round(x)),
  };
}

export function themeScores({ attention, newsAccel, price, hnRatio }) {
  const hype = blend([
    [scale(attention?.z, -1.5, 2.5), 0.35],
    [scale(attention?.mom, -0.4, 0.8), 0.25],
    [scale(newsAccel, 0.4, 2.2), 0.25],
    [scale(hnRatio, 0.4, 2.5), 0.15],
  ]);
  const momentum = blend([
    [scale(price?.chg3m, -0.2, 0.4), 0.5],
    [scale(price?.chg1m, -0.1, 0.15), 0.35],
    [scale(price?.ext200, -0.15, 0.3), 0.15],
  ]);
  const heat = blend([
    [scale(price?.ext200, -0.05, 0.45), 0.4],
    [scale(price?.rsi, 40, 82), 0.25],
    [hype, 0.35],
  ]);
  return { hype: r1(hype), momentum: r1(momentum), heat: r1(heat), quadrant: quadrant(hype, momentum, heat) };
}
const r1 = (x) => (Number.isFinite(x) ? Math.round(x * 10) / 10 : null);

export function quadrant(hype, mom, heat) {
  if (!Number.isFinite(hype) || !Number.isFinite(mom)) return "unknown";
  if (heat >= 75) return "overheated";
  if (hype < 50 && mom >= 50) return "quiet";
  if (hype >= 50 && mom >= 50) return "hot";
  if (hype >= 50 && mom < 50) return "noise";
  return "forgotten";
}

export const BUBBLE_ZONES = [
  [20, "Angst"], [40, "Vorsicht"], [60, "Neutral"], [80, "Euphorie"], [101, "Blasen-Alarm"],
];
export const zoneLabel = (v) => (Number.isFinite(v) ? BUBBLE_ZONES.find(([lim]) => v < lim)[1] : "–");

// ---------- Risiko ----------
/** Annualisierte Volatilität aus Tageskursen (log-Renditen). */
export function volatility(closes, days = 252) {
  const c = closes.filter((x) => Number.isFinite(x) && x > 0).slice(-(days + 1));
  if (c.length < 30) return NaN;
  const r = [];
  for (let i = 1; i < c.length; i++) r.push(Math.log(c[i] / c[i - 1]));
  return std(r) * Math.sqrt(252);
}
/** Größter Verlust vom Hoch (negativ, z. B. -0.25). */
export function maxDrawdown(closes) {
  let peak = -Infinity, dd = 0;
  for (const x of closes) { if (!Number.isFinite(x)) continue; peak = Math.max(peak, x); dd = Math.min(dd, x / peak - 1); }
  return dd;
}
/** EU-Risikoklasse 1–7 (SRRI-Logik nach Volatilität). */
export function riskClass(vol) {
  if (!Number.isFinite(vol)) return null;
  const lims = [0.005, 0.02, 0.05, 0.10, 0.15, 0.25];
  const i = lims.findIndex((l) => vol < l);
  return i === -1 ? 7 : i + 1;
}

// ---------- 13F (US-Börsenaufsicht) ----------
/** Parst eine 13F-Informationstabelle und fasst Zeilen pro Wertpapier (CUSIP) zusammen. Optionen werden ignoriert. */
export function parse13F(xml) {
  const rows = xml.match(/<(?:\w+:)?infoTable>[\s\S]*?<\/(?:\w+:)?infoTable>/gi) || [];
  const get = (b, n) => { const m = b.match(new RegExp(`<(?:\\w+:)?${n}>([\\s\\S]*?)</(?:\\w+:)?${n}>`, "i")); return m ? cleanText(m[1]) : ""; };
  const by = new Map();
  for (const b of rows) {
    if (get(b, "putCall")) continue;
    const cusip = get(b, "cusip");
    const value = Number(get(b, "value")) || 0;
    const shares = Number(get(b, "sshPrnamt")) || 0;
    const prev = by.get(cusip) || { name: get(b, "nameOfIssuer"), cusip, value: 0, shares: 0, cls: get(b, "titleOfClass") };
    prev.value += value; prev.shares += shares;
    by.set(cusip, prev);
  }
  const list = [...by.values()].sort((a, b) => b.value - a.value);
  const total = list.reduce((s, x) => s + x.value, 0);
  return { total, holdings: list.map((h) => ({ ...h, weight: total ? h.value / total : 0 })) };
}
/** Vergleicht zwei Quartale: neu, aufgestockt, reduziert, verkauft. */
export function diff13F(cur, prev) {
  const p = new Map(prev.holdings.map((h) => [h.cusip, h]));
  const c = new Map(cur.holdings.map((h) => [h.cusip, h]));
  const moves = [];
  for (const h of cur.holdings) {
    const o = p.get(h.cusip);
    if (!o) moves.push({ type: "neu", name: h.name, weight: h.weight, change: 1 });
    else if (o.shares > 0) {
      const ch = h.shares / o.shares - 1;
      if (ch > 0.1) moves.push({ type: "aufgestockt", name: h.name, weight: h.weight, change: ch });
      else if (ch < -0.1) moves.push({ type: "reduziert", name: h.name, weight: h.weight, change: ch });
    }
  }
  for (const o of prev.holdings) if (!c.has(o.cusip) && o.weight > 0.002) moves.push({ type: "verkauft", name: o.name, weight: o.weight, change: -1 });
  return moves.sort((a, b) => b.weight - a.weight);
}

// ---------- Analysten-Stimmen ----------
const BULL = ["upgrade", "hochgestuft", "raises price target", "raises target", "hebt kursziel", "kursziel erhöht", "erhöht kursziel", "outperform", "overweight", "buy rating", "kaufempfehlung", "kaufen", "bullish", "optimistisch", "rally", "aufwärtspotenzial", "upside"];
const BEAR = ["downgrade", "abgestuft", "cuts price target", "cuts target", "senkt kursziel", "kursziel gesenkt", "underweight", "underperform", "sell rating", "verkaufen", "bearish", "warnt", "warns", "bubble", "blase", "crash", "correction", "korrektur", "pessimistisch", "rezession", "recession"];
const bullM = makeMatcher(BULL), bearM = makeMatcher(BEAR);
export function tone(text) {
  const b = bullM(text), s = bearM(text);
  return b && !s ? "bullish" : s && !b ? "bearish" : "neutral";
}
/** Holt ein wörtliches Zitat aus einer Schlagzeile („…“, "…", '…'). */
export function extractQuote(title) {
  const m = title.match(/[„“"«»‘'](.{12,160}?)[“”"«»’']/);
  return m ? m[1].trim() : null;
}
