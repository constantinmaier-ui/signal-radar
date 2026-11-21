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
  if (u.includes("hiring-lab/ai-tracker")) {
    const rows = ["date,jobcountry,AI_share_postings"];
    for (let i = 730; i >= 0; i -= 3) { const d = new Date(now - i * 864e5).toISOString().slice(0, 10); rows.push(`${d},DE,${(4 + (730 - i) / 365).toFixed(3)}`, `${d},US,${(5 + (730 - i) / 300).toFixed(3)}`); }
    return text(rows.join("\n"));
  }
  if (u.includes("example.invalid")) return new Response("", { status: 404 });
  if (u.includes("fc.yahoo.com")) return text("");
  if (u.includes("getcrumb")) return text("TestCrumb123");
  if (u.includes("quoteSummary")) {
    const price = 50 + rnd() * 200;
    return json({ quoteSummary: { result: [{ financialData: { currentPrice: { raw: price }, targetMeanPrice: { raw: price * (0.9 + rnd() * 0.6) }, targetLowPrice: { raw: price * 0.7 }, targetHighPrice: { raw: price * 1.8 }, recommendationMean: { raw: 1.5 + rnd() * 2 }, recommendationKey: "buy", numberOfAnalystOpinions: { raw: Math.round(3 + rnd() * 40) }, revenueGrowth: { raw: 0.1 }, profitMargins: { raw: 0.2 } }, summaryDetail: { trailingPE: { raw: 10 + rnd() * 50 }, forwardPE: { raw: 10 + rnd() * 40 } }, price: { shortName: "Demo-Firma " + u.split("quoteSummary/")[1].split("?")[0], currency: "USD" } }] } });
  }
  if (u.includes("company_tickers.json")) return json({ 0: { cik_str: 320193, ticker: "AAPL", title: "Demo Apple" }, 1: { cik_str: 1045810, ticker: "NVDA", title: "Demo Nvidia" } });
  if (u.includes("data.sec.gov/submissions") && !INVESTORS.some((i) => u.includes(String(i.cik).padStart(10, "0")))) {
    return json({ name: "DEMO FIRMA INC", filings: { recent: { form: ["4", "4", "10-Q"], accessionNumber: ["0000-26-1", "0000-26-2", "x"], filingDate: [new Date(now - 3 * 86400000).toISOString().slice(0, 10), new Date(now - 5 * 86400000).toISOString().slice(0, 10), "2026-01-01"], primaryDocument: ["xslF345X05/form4.xml", "xslF345X05/form4b.xml", "q.htm"] } } });
  }
  if (u.includes("/form4")) {
    const who = u.includes("form4b") ? "Demo Vorständin" : "Demo Vorstand";
    return text(`<ownershipDocument><issuer><issuerName>DEMO FIRMA</issuerName></issuer><reportingOwner><reportingOwnerId><rptOwnerName>${who}</rptOwnerName></reportingOwnerId><reportingOwnerRelationship><isDirector>0</isDirector><isOfficer>1</isOfficer><officerTitle>CFO</officerTitle></reportingOwnerRelationship></reportingOwner><nonDerivativeTable><nonDerivativeTransaction><transactionDate><value>2026-11-15</value></transactionDate><transactionCoding><transactionCode>P</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>1000</value></transactionShares><transactionPricePerShare><value>150</value></transactionPricePerShare><transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode></transactionAmounts></nonDerivativeTransaction></nonDerivativeTable></ownershipDocument>`);
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
  if (u.includes("pypistats.org")) return json({ data: { last_day: 1e5, last_week: 7.5e5, last_month: 3e6 } });
  if (u.includes("api.npmjs.org/downloads/point")) return json({ downloads: 4e5 });
  if (u.includes("api.npmjs.org/downloads/range")) return json({ downloads: Array.from({ length: 30 }, (_, i) => ({ day: `d${i}`, downloads: 50000 + i * 1500 })) });
  if (u.includes("stablecoins.llama.fi")) return json(Array.from({ length: 200 }, (_, i) => ({ date: String(Math.floor((now - (200 - i) * 864e5) / 1000)), totalCirculatingUSD: { peggedUSD: 2.4e11 + i * 3e8 } })));
  if (u.includes("api.llama.fi")) return json(Array.from({ length: 200 }, (_, i) => ({ date: Math.floor((now - (200 - i) * 864e5) / 1000), tvl: 9e10 + Math.sin(i / 20) * 5e9 })));
  if (u.includes("energy-charts.info")) { const n = 45 * 24; return json({ unix_seconds: Array.from({ length: n }, (_, i) => Math.floor((now - (n - i) * 3600e3) / 1000)), price: Array.from({ length: n }, (_, i) => 80 + 30 * Math.sin(i / 6)), unit: "EUR / MWh" }); }
  if (u.includes("api.github.com/search")) return json({ items: [{ full_name: "meta-llama/demo-agent", html_url: "https://example.com/r1", stargazers_count: 12000, description: "Demo-Projekt", language: "Python" }, { full_name: "demo-org/tool", html_url: "https://example.com/r2", stargazers_count: 8000, description: "Demo", language: "TypeScript" }] });
  if (u.includes("huggingface.co/api/models")) return json([{ id: "Qwen/Demo-Model", likes: 900, downloads: 120000, pipeline_tag: "text-generation" }, { id: "demo-lab/vision", likes: 300, downloads: 5000, pipeline_tag: "image-to-text" }]);
  if (u.includes("api.openalex.org/works")) {
    const recent = u.includes("publication_date:desc");
    const mk = (i) => ({ id: `https://openalex.org/W${i}`, doi: `https://doi.org/10.0000/demo.${i}`, display_name: recent ? `Demo: Neue Journal-Studie ${i} über Anlegerverhalten` : `Demo: Vielzitierte Studie ${i} über Faktorprämien`, publication_date: new Date(now - (recent ? i * 9 : 60 + i * 40) * DAY).toISOString().slice(0, 10), cited_by_count: recent ? i : 400 - i * 30, fwci: recent ? null : 6.5 - i * 0.4, primary_location: { landing_page_url: "https://example.com/p" + i, source: { display_name: ["Journal of Finance", "Review of Financial Studies", "Journal of Financial Economics"][i % 3] } }, authorships: [{ author: { display_name: "Demo Autorin" } }, { author: { display_name: "Demo Autor" } }], open_access: { oa_url: i % 2 ? "https://example.com/pdf" + i : null }, abstract_inverted_index: { Demo: [0], Zusammenfassung: [1], "der": [2], Studie: [3] } });
    return json({ meta: { count: 12 }, results: Array.from({ length: 12 }, (_, i) => mk(i + 1)) });
  }
  if (u.includes("onlinelibrary.wiley.com") || u.includes("sciencedirect.com")) return text(`<rss><channel><item><title>Demo: Journal-Artikel über Faktorprämien</title><link>https://example.com/j1</link><pubDate>${new Date(now - 10 * 86400000).toUTCString()}</pubDate></item></channel></rss>`);
  if (u.includes("fred.stlouisfed.org")) {
    const id = u.match(/id=([A-Z0-9]+)/)[1], base = { T10Y3M: -0.3, BAMLH0A0HYM2: 3.1, SAHMREALTIME: 0.3, UMCSENT: 64 }[id];
    return text("observation_date," + id + "\n" + Array.from({ length: 400 }, (_, i) => `${new Date(now - (400 - i) * 86400000).toISOString().slice(0, 10)},${i % 50 === 7 ? "." : (base + Math.sin(i / 40) * 0.4).toFixed(2)}`).join("\n"));
  }
  if (u.includes("ei_bssi_m_r2")) {
    const base = u.includes("BS-CSMCI") ? -18 : u.includes("EA20") ? 95 : 92, idx = {}, value = {};
    for (let i = 0; i < 24; i++) { const d = new Date(now - (24 - i) * 30 * DAY); idx[d.toISOString().slice(0, 7)] = i; value[i] = +(base + Math.sin(i / 4) * 3).toFixed(1); }
    return json({ label: "Demo: Stimmung", value, dimension: { time: { category: { index: idx } } } });
  }
  if (u.includes("ebp_csv")) return text("date,gz_spread,ebp,est_prob\n" + Array.from({ length: 40 }, (_, i) => `${new Date(now - (40 - i) * 30 * DAY).toISOString().slice(0, 7)}-01,${(1.8 + Math.sin(i / 5) * 0.4).toFixed(2)},${(-0.1 + Math.sin(i / 6) * 0.25).toFixed(3)},${(0.12 + Math.sin(i / 6) * 0.08).toFixed(3)}`).join("\n"));
  if (u.includes("eurostat")) return json({ label: "Demo: Hauspreisindex", value: { "0": 5.1, "1": -2.3, "2": 1.4, "3": 3.2 }, dimension: { time: { category: { index: { "2025-Q3": 0, "2025-Q4": 1, "2026-Q1": 2, "2026-Q2": 3 } } } } });
  if (u.includes("data-api.ecb.europa.eu") && (u.includes("/MIR/") || u.includes("/YC/"))) {
    const n = 24, base = u.includes("/MIR/") ? 3.6 : 2.7;
    return json({ structure: { name: "Demo", dimensions: { observation: [{ values: Array.from({ length: n }, (_, i) => ({ id: `${2024 + Math.floor((i + 10) / 12)}-${String(((i + 10) % 12) + 1).padStart(2, "0")}` })) }] } }, dataSets: [{ series: { "0:0": { observations: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i), [base + Math.sin(i / 4) * 0.3]])) } } }] });
  }
  if (u.includes("arxiv.org") || u.includes("nber.org")) return text(`<rss><channel>${["Demo: Do retail investors chase attention?", "Demo: Momentum and crash risk in thematic ETFs"].map((t, i) => `<item><title>${t}</title><link>https://example.com/paper${i}</link><description>Demo-Zusammenfassung.</description><pubDate>${new Date(now - i * 86400000).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`);
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
  return text(rss(["Demo: Fed signalisiert Zinssenkung", "Demo: SpaceX IPO Gerüchte", "Demo: Cyberangriff auf Konzern", "Demo: Neue Zölle belasten Exporteure", "Demo: Ölpreis steigt nach OPEC-Entscheid"]));
};
