// Detailed portfolio positions: pick a real ETF, stock or any crypto coin, enter the number of units,
// and the value follows the live price. Everything stays in the browser.
import { $, esc, fmt, ok, state } from "./ui.js";

const REF_RE = /^(y:[A-Za-z0-9.\-^=]{1,15}|cg:[a-z0-9-]{1,60})$/;
export const validRef = (r) => typeof r === "string" && REF_RE.test(r);

/** Price in euro from a quote in its own currency. EUR/USD comes from the collected market data. Pure. */
export function toEur(price, currency, eurusd) {
  if (!ok(price)) return null;
  if (!currency || currency === "EUR") return price;
  if (currency === "USD") return ok(eurusd) && eurusd > 0 ? price / eurusd : null;
  return null; // other currencies: no reliable rate in the data, value stays manual
}

/** Everything with a price the user can pick: popular ETFs, DAX and US stocks, theme stocks, asset classes. */
export function catalog(d = state.data || {}) {
  const out = new Map(), add = (sym, name, kind, cat, last, currency, chg1d, isin = "") => {
    if (!sym || out.has(sym)) return;
    out.set(sym, { ref: `y:${sym}`, sym, name: name || sym, kind, cat, last, currency, chg1d, isin });
  };
  for (const i of d.instruments || []) add(i.sym, i.name, i.kind, i.cat, i.last, i.currency, i.chg1d, i.isin);
  for (const t of d.themes || []) {
    add(t.etf, `${t.name} (ETF)`, "etf", "themes", t.price?.last, t.price?.currency, t.price?.chg1d);
    for (const k of t.tickers || []) add(k.sym, (d.analysts || []).find((a) => a.sym === k.sym)?.name || k.sym, "stock", "themes", k.last, k.currency, k.chg1d);
  }
  for (const a of d.analysts || []) add(a.sym, a.name, "stock", "themes", a.price, a.currency, null);
  return [...out.values()];
}
export const optionLabel = (i) => `${i.name} · ${i.sym}${i.isin ? ` · ${i.isin}` : ""}`;

// ---------- Crypto: every coin via CoinGecko (public API, no key) ----------
let coins = null, coinLoad = null;
const coinPx = new Map(); let pxAt = 0;
export async function loadCoins() {
  if (coins) return coins;
  try { const c = JSON.parse(sessionStorage.getItem("radar:coins") || "null"); if (c && Date.now() - c.at < 3600e3) return (coins = c.list); } catch { /* private mode */ }
  coinLoad ||= fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=250&page=1")
    .then((r) => (r.ok ? r.json() : [])).then((j) => (Array.isArray(j) ? j : []).map((c) => ({ ref: `cg:${c.id}`, sym: String(c.symbol || "").toUpperCase(), name: c.name, kind: "crypto", cat: "btc", last: c.current_price, currency: "EUR", chg1d: ok(c.price_change_percentage_24h) ? c.price_change_percentage_24h / 100 : null })))
    .catch(() => []);
  coins = await coinLoad;
  for (const c of coins) coinPx.set(c.ref, { last: c.last, chg1d: c.chg1d });
  pxAt = Date.now();
  try { sessionStorage.setItem("radar:coins", JSON.stringify({ at: Date.now(), list: coins })); } catch { /* ignore */ }
  return coins;
}
/** Search all coins (also small ones outside the top 250). */
export async function searchCoins(q) {
  try {
    const j = await (await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`)).json();
    return (j.coins || []).slice(0, 15).map((c) => ({ ref: `cg:${c.id}`, sym: String(c.symbol || "").toUpperCase(), name: c.name, kind: "crypto", cat: "btc" }));
  } catch { return []; }
}
/** Current euro prices for the coins the user holds (refreshed at most every 60 s). */
export async function refreshCoinPrices(refs) {
  const ids = [...new Set(refs.filter((r) => r?.startsWith("cg:")).map((r) => r.slice(3)))];
  if (!ids.length || Date.now() - pxAt < 60e3 && ids.every((id) => coinPx.has(`cg:${id}`))) return false;
  try {
    const j = await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.map(encodeURIComponent).join(",")}&vs_currencies=eur&include_24hr_change=true`)).json();
    for (const id of ids) if (j[id]?.eur) coinPx.set(`cg:${id}`, { last: j[id].eur, chg1d: ok(j[id].eur_24h_change) ? j[id].eur_24h_change / 100 : null });
    pxAt = Date.now(); return true;
  } catch { return false; }
}

/** Live euro quote for a position's reference, or null. */
export function quoteOf(ref, d = state.data || {}) {
  if (!validRef(ref)) return null;
  if (ref.startsWith("cg:")) return coinPx.get(ref) || null;
  const i = catalog(d).find((x) => x.ref === ref); if (!i) return null;
  const eurusd = (d.market || []).find((m) => m.sym === "EURUSD=X")?.last;
  const last = toEur(i.last, i.currency, eurusd);
  return ok(last) ? { last, chg1d: i.chg1d } : null;
}
/** Value in euro: units × live price when both are known, otherwise the entered value. Pure given the quote. */
export function positionValue(p, quote) {
  return quote && ok(quote.last) && p.qty > 0 ? p.qty * quote.last : p.value;
}

// ---------- editor support ----------
/** <datalist> with all instruments; crypto coins are added when loaded. */
export function ensureDatalist() {
  let dl = $("#dpInstr");
  if (!dl) { dl = document.createElement("datalist"); dl.id = "dpInstr"; document.body.appendChild(dl); }
  const items = [...catalog(), ...(coins || [])];
  dl.innerHTML = items.map((i) => `<option value="${esc(optionLabel(i))}">${i.kind === "crypto" ? "Krypto" : i.kind === "etf" ? "ETF" : "Aktie"}</option>`).join("");
  return dl;
}
/** Finds the instrument for what the user typed or picked (label, ticker, ISIN or exact name). */
export function matchInstrument(text, extra = []) {
  const t = String(text || "").trim().toLowerCase(); if (!t) return null;
  const all = [...catalog(), ...(coins || []), ...extra];
  return all.find((i) => optionLabel(i).toLowerCase() === t) || all.find((i) => i.sym.toLowerCase() === t || (i.isin && i.isin.toLowerCase() === t)) || all.find((i) => i.name.toLowerCase() === t) || null;
}
const found = new Map(); // coins found by search, so they can be matched later
export async function suggestCoins(input) {
  const q = input.value.trim(); if (q.length < 3 || matchInstrument(q)) return;
  const list = await searchCoins(q);
  const dl = ensureDatalist();
  for (const c of list) { found.set(c.ref, c); if (![...dl.options].some((o) => o.value === optionLabel(c))) dl.insertAdjacentHTML("beforeend", `<option value="${esc(optionLabel(c))}">Krypto</option>`); }
}
export const matchAny = (text) => matchInstrument(text, [...found.values()]);
export const fmtEur = (x) => (ok(x) ? `${fmt(x, x < 100 ? 2 : 0)} €` : "–");
