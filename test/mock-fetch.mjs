import { INVESTORS } from "../collector/config.mjs";
// Ersetzt fetch() durch realistisch geformte Antworten – für den Offline-Test des Sammlers.
const DAY = 86400000, now = Date.now();
let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { "content-type": "application/json" } });
const text = (t) => new Response(t, { status: 200 });
const rss = (titles) => `<?xml version="1.0"?><rss><channel>${titles.map((t, i) => `<item><title>${t} - Testquelle</title><link>https://example.com/${encodeURIComponent(t)}</link><pubDate>${new Date(now - i * 5 * 3600e3).toUTCString()}</pubDate><source url="https://example.com">Testquelle</source></item>`).join("")}</channel></rss>`;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes("api.anthropic.com") && opts?.body && String(opts.body).includes("json_schema")) {
    const items = JSON.parse(JSON.parse(String(opts.body)).messages[0].content).map((x) => ({ i: x.i, de: "Demo-Übersetzung: " + x.text }));
    return json({ id: "msg_t", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ items }) }], usage: { input_tokens: 1, output_tokens: 1 } });
  }
  if (u.includes("api.anthropic.com")) return json({ id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", content: [{ type: "text", text: "🌡️ **Gesamtlage** Testzeile eins.\n🔥 **Stärkstes Thema** Testzeile zwei." }], usage: { input_tokens: 1, output_tokens: 1 } });
  if (u.includes("example.invalid")) return new Response("", { status: 404 });
  if (u.includes("fc.yahoo.com")) return text("");
  if (u.includes("getcrumb")) return text("TestCrumb123");
  if (u.includes("quoteSummary")) {
    const price = 50 + rnd() * 200;
    return json({ quoteSummary: { result: [{ financialData: { currentPrice: { raw: price }, targetMeanPrice: { raw: price * (0.9 + rnd() * 0.6) }, targetLowPrice: { raw: price * 0.7 }, targetHighPrice: { raw: price * 1.8 }, recommendationMean: { raw: 1.5 + rnd() * 2 }, recommendationKey: "buy", numberOfAnalystOpinions: { raw: Math.round(3 + rnd() * 40) }, revenueGrowth: { raw: 0.1 }, profitMargins: { raw: 0.2 } }, summaryDetail: { trailingPE: { raw: 10 + rnd() * 50 }, forwardPE: { raw: 10 + rnd() * 40 } }, price: { shortName: "Demo-Firma " + u.split("quoteSummary/")[1].split("?")[0], currency: "USD" } }] } });
  }
  if (u.includes("data.sec.gov/submissions")) {
    const cik = Number(u.match(/CIK(\d+)/)[1]); const inv = INVESTORS.find((i) => i.cik === cik);
    return json({ name: inv.fund.toUpperCase() + " LP", filings: { recent: { form: ["4", "13F-HR", "SC 13G", "13F-HR"], accessionNumber: ["0-0-1", "0001-26-000002", "0-0-3", "0001-26-000001"], reportDate: ["", "2026-09-30", "", "2026-06-30"], filingDate: ["", "2026-11-14", "", "2026-08-14"] } } });
  }
  if (u.includes("sec.gov/Archives") && u.endsWith("index.json")) return json({ directory: { item: [{ name: "primary_doc.xml" }, { name: "infotable.xml" }] } });
  if (u.includes("sec.gov/Archives") && u.endsWith(".xml")) {
    const names = ["DEMO FIRMA A", "DEMO FIRMA B", "DEMO FIRMA C", "DEMO FIRMA D", "DEMO FIRMA E", "DEMO FIRMA F", "DEMO FIRMA G", "DEMO FIRMA H", "DEMO FIRMA I", "DEMO FIRMA J"];
    const pick = names.filter(() => rnd() > 0.25);
    return text(`<informationTable xmlns="http://www.sec.gov/edgar/document/thirteenf/informationtable">${pick.map((n, i) => `<infoTable><nameOfIssuer>${n}</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>C${i}${n.length}</cusip><value>${Math.round(rnd() * 1e9)}</value><shrsOrPrnAmt><sshPrnamt>${Math.round(rnd() * 1e7)}</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt></infoTable>`).join("")}</informationTable>`);
  }
  if (u.includes("cnn.io")) return json({ fear_and_greed: { score: 62.4, rating: "greed", previous_1_week: 55, previous_1_month: 48 }, fear_and_greed_historical: { data: Array.from({ length: 120 }, (_, i) => ({ y: 40 + (i % 40) })) } });
  if (u.includes("data-api.ecb.europa.eu")) return json({ dataSets: [{ series: { "0:0:0:0:0:0:0": { observations: { "0": [2.0] } } } }] });
  if (u.includes("finance.yahoo.com/v8")) {
    if (u.includes("HAG.DE")) return new Response("", { status: 404 }); // Ausfall simulieren
    const n = 252; let p = 100; const closes = [];
    for (let i = 0; i < n; i++) { p *= 1 + (rnd() - 0.47) * 0.03; closes.push(p); }
    return json({ chart: { result: [{ meta: { currency: "USD", regularMarketPrice: p }, timestamp: closes.map((_, i) => Math.floor((now - (n - i) * DAY) / 1000)), indicators: { quote: [{ close: closes }] } }] } });
  }
  if (u.includes("stooq.com")) return text("Keine Daten");
  if (u.includes("wikimedia.org")) {
    return json({ items: Array.from({ length: 94 }, (_, i) => ({ timestamp: new Date(now - (94 - i) * DAY).toISOString().slice(0, 10).replace(/-/g, "") + "00", views: Math.round(5000 + rnd() * 2000 + (i > 86 ? 4000 : 0)) })) });
  }
  if (u.includes("news.google.com")) return text(rss(["Demo: Anthropic-Börsengang Thema in Medien", "Demo: Chipkonzern Nvidia meldet Rekordumsatz", "Demo: Goldpreis auf Rekordhoch", "Demo: Uran-Aktien springen an", "Demo: OpenAI Bewertung steigt", "Demo: Rüstungskonzern erhält Großauftrag", "Demo: Bitcoin fällt unter Marke", "Demo-Bank hebt Kursziel für Demo-Firma", "Demo: Strategist says stocks could rally into year-end", "Demo: „Die Märkte sind zu sorglos“, warnt ein Bank-Chef"]));
  if (u.includes("reddit.com")) return new Response("", { status: 403 });
  if (u.includes("hn.algolia.com")) {
    if (u.includes("hitsPerPage=0")) return json({ nbHits: Math.round(rnd() * 80), hits: [] });
    return json({ hits: [{ title: "Demo: Quantum computing simulator", url: "https://example.com/q", created_at_i: Math.floor(now / 1000) - 3600, points: 120, num_comments: 40, objectID: "1" }] });
  }
  if (u.includes("alternative.me")) return json({ data: Array.from({ length: 60 }, (_, i) => ({ value: String(40 + (i % 30)), value_classification: "Greed" })) });
  if (u.includes("coingecko")) return json({ coins: [{ item: { name: "Bitcoin", symbol: "BTC", market_cap_rank: 1, data: { price_change_percentage_24h: { eur: 1.2 } } } }] });
  if (u.includes("polymarket")) return json({ events: [{ title: "Demo: Anthropic IPO?", slug: "demo", markets: [{ id: "m1", question: "Demo: Anthropic IPO before 2028?", outcomes: '["Yes","No"]', outcomePrices: '["0.41","0.59"]', volume: "123456", closed: false }] }] });
  if (u.includes("gdeltproject")) return json({ timeline: [{ data: Array.from({ length: 90 }, (_, i) => ({ value: 0.01 + (i > 83 ? 0.02 : 0) + rnd() * 0.005 })) }] });
  // allgemeine Feeds
  return text(rss(["Demo: Fed signalisiert Zinssenkung", "Demo: SpaceX IPO Gerüchte", "Demo: Cyberangriff auf Konzern"]));
};
