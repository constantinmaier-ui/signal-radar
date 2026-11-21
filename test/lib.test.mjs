import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFeed, makeMatcher, dedupe, rsi, priceStats, attentionStats, themeScores, quadrant, scale, blend, zoneLabel, cleanText } from "../collector/lib.mjs";

test("RSS (Google News) – Titel ohne Quellen-Suffix, Datum, Quelle", () => {
  const xml = `<rss><channel><item><title>Anthropic prüft Börsengang - Handelsblatt</title><link>https://news.google.com/x</link><pubDate>Tue, 17 Nov 2026 10:00:00 GMT</pubDate><source url="https://handelsblatt.com">Handelsblatt</source></item></channel></rss>`;
  const [it] = parseFeed(xml);
  assert.equal(it.title, "Anthropic prüft Börsengang");
  assert.equal(it.source, "Handelsblatt");
  assert.equal(it.published, Date.parse("2026-11-17T10:00:00Z"));
});

test("Atom (Reddit) – Link aus href, CDATA und Entities", () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title><![CDATA[NVDA &amp; the AI &quot;bubble&quot;]]></title><link href="https://reddit.com/r/x/1"/><updated>2026-11-18T08:00:00+00:00</updated></entry></feed>`;
  const [it] = parseFeed(xml, "r/stocks");
  assert.equal(it.title, 'NVDA & the AI "bubble"');
  assert.equal(it.url, "https://reddit.com/r/x/1");
  assert.equal(it.source, "r/stocks");
});

test("cleanText entfernt HTML und doppelt kodierte Entities", () => {
  assert.equal(cleanText("&lt;b&gt;Gold&lt;/b&gt; &amp;amp; Silber"), "Gold & Silber");
});

test("Matcher: kurze Wörter nur als ganzes Wort, lange auch als Präfix", () => {
  const gold = makeMatcher(["gold", "goldpreis"]);
  assert.ok(gold("Gold steigt"));
  assert.ok(gold("Goldpreis auf Rekord"));
  assert.ok(!gold("Goldman Sachs senkt Ziel"));
  const ai = makeMatcher(["ai", "ki"]);
  assert.ok(ai("New AI model"));
  assert.ok(ai("KI-Aktien legen zu"));
  assert.ok(!ai("Kaiser und Kino"));
  assert.ok(makeMatcher(["rechenzentr"])("Neue Rechenzentren in Hessen"));
});

test("dedupe zählt Echo und vereinigt Themen", () => {
  const out = dedupe([
    { title: "Nvidia meldet Rekord!", themes: ["chips"], published: 2 },
    { title: "nvidia meldet rekord", themes: ["ai"], published: 1 },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].echo, 2);
  assert.deepEqual(out[0].themes.sort(), ["ai", "chips"]);
  assert.equal(out[0].published, 1);
});

test("RSI: Dauerplus = 100, Dauerminus = 0", () => {
  assert.equal(rsi(Array.from({ length: 30 }, (_, i) => 100 + i)), 100);
  assert.equal(Math.round(rsi(Array.from({ length: 30 }, (_, i) => 100 - i))), 0);
});

test("priceStats rechnet Renditen und 200-Tage-Abstand", () => {
  const c = Array.from({ length: 252 }, (_, i) => 100 + i); // stetig steigend
  const s = priceStats(c);
  assert.ok(s.chg3m > 0 && s.ext200 > 0);
  assert.equal(s.fromHigh, 0);
  assert.ok(s.spark.length <= 65);
  assert.equal(priceStats([1, 2, 3]), null);
});

test("attentionStats erkennt Aufmerksamkeits-Spitze", () => {
  const d = [...Array(83).fill(1000), ...Array(7).fill(3000)];
  const a = attentionStats(d.map((x, i) => x + (i % 3)));
  assert.ok(a.z > 3);
  assert.ok(a.mom > 1.5);
});

test("Skalierung, Mischung, Zonen, Quadranten", () => {
  assert.equal(scale(5, 0, 10), 50);
  assert.equal(scale(20, 0, 10), 100);
  assert.equal(scale(12, 32, 12), 100); // invertiert (VIX)
  assert.equal(blend([[NaN, 1], [80, 1]]), 80);
  assert.equal(zoneLabel(85), "Blasen-Alarm");
  assert.equal(zoneLabel(10), "Angst");
  assert.equal(quadrant(30, 70, 40), "quiet");
  assert.equal(quadrant(70, 70, 60), "hot");
  assert.equal(quadrant(70, 30, 50), "noise");
  assert.equal(quadrant(30, 30, 20), "forgotten");
  assert.equal(quadrant(80, 90, 80), "hot"); // high heat alone is not enough
  assert.equal(quadrant(80, 90, 100), "overheated"); // only a 2-year doubling
});

test("themeScores mit fehlenden Daten liefert null statt NaN", () => {
  const s = themeScores({ attention: null, newsAccel: null, price: null, hnRatio: null });
  assert.equal(s.hype, null);
  assert.equal(s.quadrant, "unknown");
});

import { volatility, maxDrawdown, riskClass, parse13F, diff13F, tone, extractQuote } from "../collector/lib.mjs";

test("Risiko: Volatilität, Drawdown, EU-Risikoklasse", () => {
  // EU PRIIPs bands: <0.5 % | 5 | 12 | 20 | 30 | 80 %
  assert.equal(riskClass(0.003), 1);
  assert.equal(riskClass(0.15), 4); // broad world equity ETF, as in its official key information document
  assert.equal(riskClass(0.6), 6);
  assert.equal(riskClass(0.9), 7);
  assert.equal(riskClass(NaN), null);
  assert.ok(Math.abs(maxDrawdown([100, 120, 60, 90]) - -0.5) < 1e-9);
  const flat = Array.from({ length: 100 }, () => 100);
  assert.equal(volatility(flat), 0);
});

test("13F: Zeilen pro CUSIP zusammenfassen, Optionen ignorieren, Quartale vergleichen", () => {
  const row = (n, c, v, s, pc = "") => `<ns1:infoTable><ns1:nameOfIssuer>${n}</ns1:nameOfIssuer><ns1:cusip>${c}</ns1:cusip><ns1:value>${v}</ns1:value><ns1:shrsOrPrnAmt><ns1:sshPrnamt>${s}</ns1:sshPrnamt></ns1:shrsOrPrnAmt>${pc ? `<ns1:putCall>${pc}</ns1:putCall>` : ""}</ns1:infoTable>`;
  const cur = parse13F(`<x>${row("APPLE INC", "A1", 600, 60)}${row("APPLE INC", "A1", 200, 20)}${row("NEWCO", "N1", 200, 10)}${row("APPLE INC", "A1", 999, 5, "Put")}</x>`);
  assert.equal(cur.total, 1000);
  assert.equal(cur.holdings[0].name, "APPLE INC");
  assert.equal(cur.holdings[0].weight, 0.8);
  const prev = parse13F(`<x>${row("APPLE INC", "A1", 500, 50)}${row("OLDCO", "O1", 500, 50)}</x>`);
  const moves = diff13F(cur, prev);
  const byType = Object.fromEntries(moves.map((m) => [m.type, m.name]));
  assert.equal(byType.aufgestockt, "APPLE INC");
  assert.equal(byType.neu, "NEWCO");
  assert.equal(byType.verkauft, "OLDCO");
});

test("Analysten-Ton und Zitate", () => {
  assert.equal(tone("Morgan Stanley upgrades Nvidia, raises price target"), "bullish");
  assert.equal(tone("Analyst senkt Kursziel für Tesla"), "bearish");
  assert.equal(tone("Fed meeting next week"), "neutral");
  assert.equal(extractQuote('Burry: "We are in a massive bubble" says investor'), "We are in a massive bubble");
  assert.equal(extractQuote("Keine Anführungszeichen hier"), null);
});

import { LUMP_SUM_RULE, buildSignals, dailyVerdict } from "../site/signals.js";

test("Signal-Leser: Überhitzung, stiller Aufstieg, Euphorie, Sortierung", () => {
  const d = {
    bubble: { score: 82 }, risk: { level: "rot", stress: 30 }, fearGreed: { value: 85 },
    themes: [
      { id: "q", name: "Quanten", etf: "QTUM", scores: { quadrant: "overheated", heat: 90 }, price: { ext200: 0.6 } },
      { id: "g", name: "Gold", etf: "GLD", scores: { quadrant: "quiet", momentum: 80 }, price: { chg3m: 0.12 } },
    ],
    assets: [{ id: "btc", name: "Bitcoin", group: "Krypto", chg1w: -0.2 }],
  };
  const s = buildSignals(d, [{ date: new Date(Date.now() - 8 * 864e5).toISOString().slice(0, 10), bubble: 60 }]);
  const ids = s.map((x) => x.id);
  for (const id of ["bubble-high", "bubble-move", "hot-q", "quiet-g", "crypto-greed", "move-btc"]) assert.ok(ids.includes(id), id);
  assert.equal(s[0].id, "bubble-high"); // wichtigstes zuerst
  for (const x of s) assert.ok(x.title && x.text && x.todo && ["chance", "warnung", "info"].includes(x.kind));
  const v = dailyVerdict(d);
  assert.equal(v.level, "rot");
  assert.ok(v.dontList.some((t) => t.includes("Quanten")));
  assert.ok(v.doList.some((t) => t.includes("Gold")));
});

test("Signal-Leser: leere oder fehlende Daten werfen nicht", () => {
  assert.deepEqual(buildSignals(null), []);
  assert.ok(Array.isArray(buildSignals({})));
  assert.ok(dailyVerdict({}).head.length > 10);
});

import { computeEvents, parseJsonStat, parseEcb } from "../collector/insights.mjs";

test("Ereignis-Arten: Zuordnung, Zählung, Beschleunigung", () => {
  const now = Date.now(), h = 3600e3;
  const news = [
    { title: "EZB senkt den Leitzins", published: now - 5 * h },
    { title: "Fed rate cut expected", published: now - 10 * h },
    { title: "Neue Zölle auf Autos", published: now - 3 * 86400e3 },
    { title: "Apple übertrifft Erwartungen bei Quartalszahlen", published: now - h },
    { title: "Wetter wird schön", published: now - h },
  ];
  const ev = computeEvents(news, now);
  const rates = ev.find((e) => e.id === "rates"), tariffs = ev.find((e) => e.id === "tariffs");
  assert.equal(rates.n48h, 2);
  assert.equal(tariffs.n48h, 0);
  assert.equal(tariffs.n7d, 1);
  assert.equal(ev[0].id, "rates"); // meistberichtet zuerst
  assert.ok(rates.impact.aktien && rates.evidence.length > 20);
});

test("Statistik-Parser: Eurostat JSON-stat und EZB SDMX", () => {
  const js = parseJsonStat({ label: "x", value: { 0: 1.5, 1: 2.5 }, dimension: { time: { category: { index: { "2026-Q2": 1, "2026-Q1": 0 } } } } });
  assert.deepEqual(js.points.map((p) => p.period), ["2026-Q1", "2026-Q2"]);
  const ecb = parseEcb({ structure: { dimensions: { observation: [{ values: [{ id: "2026-01" }, { id: "2026-02" }] }] } }, dataSets: [{ series: { "0": { observations: { 0: [3.5], 1: [3.4] } } } }] });
  assert.equal(ecb.points[1].value, 3.4);
  assert.equal(parseEcb({}), null);
  assert.equal(parseJsonStat({}), null);
});

test("Signal-Leser: Nachrichtenlage und Bauzinsen", () => {
  const d = {
    events: [{ id: "tariffs", name: "Zölle & Handelsstreit", n48h: 12, accel: 2, why: "Zölle verteuern Waren." }],
    realEstate: { mortgage: { rate: 0.031, yearAgo: 0.039 } },
  };
  const s = buildSignals(d);
  const t = s.find((x) => x.id === "event-tariffs"), m = s.find((x) => x.id === "mortgage-move");
  assert.equal(t.kind, "warnung");
  assert.equal(m.kind, "chance");
  assert.ok(m.title.includes("3,10"));
});

import { parseForm4 } from "../collector/lib.mjs";
test("Form 4: Käufer, Funktion und Kauf-Transaktion erkennen", () => {
  const f = parseForm4(`<ownershipDocument><reportingOwner><rptOwnerName>Jane Doe</rptOwnerName><reportingOwnerRelationship><isDirector>true</isDirector><isOfficer>1</isOfficer><officerTitle>CEO</officerTitle></reportingOwnerRelationship></reportingOwner>
    <nonDerivativeTransaction><transactionDate><value>2026-11-10</value></transactionDate><transactionCoding><transactionCode>P</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>500</value></transactionShares><transactionPricePerShare><value>20.5</value></transactionPricePerShare><transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode></transactionAmounts></nonDerivativeTransaction>
    <nonDerivativeTransaction><transactionCoding><transactionCode>S</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>100</value></transactionShares></transactionAmounts></nonDerivativeTransaction></ownershipDocument>`);
  assert.equal(f.owner.name, "Jane Doe");
  assert.ok(f.owner.officer && f.owner.director);
  assert.equal(f.txs.length, 2);
  assert.equal(f.txs[0].code, "P");
  assert.equal(f.txs[0].shares * f.txs[0].price, 10250);
});

import { parseFredCsv } from "../collector/insights.mjs";
test("FRED-CSV: fehlende Werte (.) werden übersprungen", () => {
  const p = parseFredCsv("observation_date,T10Y3M\n2026-11-01,0.5\n2026-11-02,.\n2026-11-03,-0.2\n");
  assert.equal(p.length, 2);
  assert.equal(p[1].value, -0.2);
  assert.equal(parseFredCsv("<html>Fehler</html>"), null);
});

import { moodScore } from "../site/insights.js";
test("Stimmungs-Barometer: gewichtetes Mittel, fehlende Quellen werden ausgelassen", () => {
  assert.equal(moodScore({}), null);
  const m = moodScore({ cnnFearGreed: { value: 80 }, fearGreed: { value: 60 } });
  assert.equal(m.score, Math.round((80 * 0.6 + 60 * 0.2) / 0.8));
  assert.equal(m.parts.length, 2);
  // VIX is already inside CNN Fear & Greed: only used when CNN is missing
  assert.equal(moodScore({ cnnFearGreed: { value: 50 }, risk: { vix: 12 } }).parts.length, 1);
  assert.equal(moodScore({ risk: { vix: 35 } }).score, 0);
});

import { rangeStats } from "../collector/insights.mjs";
test("Rohstoffe: Lage in der 52-Wochen-Spanne", () => {
  const r = rangeStats([...Array(30).fill(0).map((_, i) => 100 + i), 110]);
  assert.equal(r.low52, 100);
  assert.equal(r.high52, 129);
  assert.ok(Math.abs(r.pos52 - 10 / 29) < 1e-9);
  assert.equal(rangeStats([1, 2]), null);
});

import { topicOf } from "../site/heute.js";
import { aiPrompt } from "../site/trust.js";
test("Anpassen: Signale werden Interessen zugeordnet; Gesamtmarkt nie ausgeblendet", () => {
  assert.equal(topicOf("hot-quantum"), "themes");
  assert.equal(topicOf("move-btc"), "crypto");
  assert.equal(topicOf("move-gold"), "commodities");
  assert.equal(topicOf("move-world"), "stocks");
  assert.equal(topicOf("sahm"), "macro");
  assert.equal(topicOf("bubble-high"), null);
});
test("KI-Zusammenfassung enthält Lage und Hinweis auf Vorschläge statt Empfehlungen", () => {
  const t = aiPrompt({ generatedAt: "2026-11-19T08:00:00Z", risk: { level: "gelb" }, bubble: { score: 61 }, events: [] }, [{ title: "Gold steigt leise" }]);
  assert.ok(t.includes("gelb") && t.includes("61") && t.includes("Gold steigt leise") && t.includes("Vorschläge statt Empfehlungen"));
});

import { encryptBackup, decryptBackup } from "../site/trust.js";
test("Verschlüsselte Sicherung: Hin- und Rückweg, falsches Passwort scheitert", async () => {
  const data = { plan: { once: 5000 }, watch: ["chips"] };
  const file = await encryptBackup(data, "richtig-langes-passwort");
  assert.ok(!file.includes("chips"));            // nichts im Klartext
  assert.deepEqual(await decryptBackup(file, "richtig-langes-passwort"), data);
  await assert.rejects(decryptBackup(file, "falsches-passwort-xx"));
});

import { MIETSPIEGEL } from "../site/mietspiegel.js";
test("Mietspiegel-Liste: 20 Städte, nur https-Links, München mit Rechner", () => {
  assert.equal(Object.keys(MIETSPIEGEL).length, 20);
  for (const [c, m] of Object.entries(MIETSPIEGEL)) { if (m.url) assert.ok(m.url.startsWith("https://"), c); assert.ok(m.inputs.length >= 3, c); }
  assert.ok(MIETSPIEGEL["münchen"].calc);
});

import { hypeInfo, ideasFor } from "../site/signals.js";
test("Profile: bold investors get lump-sum advice, cautious ones get interest; hype is detected", () => {
  const d = { risk: { level: "gelb" }, rates: { ecb: 0.02 }, themes: [
    { id: "q", name: "Quanten", etf: "QTUM", scores: { quadrant: "overheated", hype: 80, heat: 85 }, price: { ext200: 0.6 } },
    { id: "g", name: "Gold", etf: "GLD", scores: { quadrant: "quiet", momentum: 80, heat: 40, hype: 30 }, price: { chg3m: 0.12 } } ] };
  // One lump-sum rule for every goal and market level (no market timing)
  assert.ok(dailyVerdict(d, "wachstum", 20).doList.includes(LUMP_SUM_RULE));
  assert.ok(dailyVerdict({ ...d, risk: { level: "rot", stress: 80 } }, "ausgewogen", 20).doList.includes(LUMP_SUM_RULE));
  // Red because of euphoria must not read like a buying opportunity
  const eu = dailyVerdict({ ...d, risk: { level: "rot", euphoria: 82, stress: 0 } }, "wachstum", 20);
  assert.equal(eu.cause, "euphorie"); assert.match(eu.head, /Euphorie/); assert.doesNotMatch(eu.head, /günstig/);
  assert.equal(dailyVerdict({ ...d, risk: { level: "rot", euphoria: 20, stress: 80 } }, "wachstum", 20).cause, "stress");
  assert.ok(dailyVerdict(d, "sicherheit", 20).doList[0].includes("Tagesgeld"));
  assert.ok(dailyVerdict(d, "mutig", 20).dontList.some((x) => x.includes("Einzelposition")));
  assert.ok(hypeInfo(d.themes[0]));
  assert.equal(hypeInfo(d.themes[1]), null);
  assert.ok(ideasFor(d, "wachstum").some((i) => i.title.startsWith("Gold")));
  assert.ok(!ideasFor(d, "mutig").some((i) => i.title.startsWith("Quanten")));
  assert.equal(ideasFor(d, "sicherheit")[0].tag, "sicher");
});

test("OpenAlex: abstract rebuilt, work mapped with DOI, citations, open-access link", async () => {
  const { openAlexAbstract, mapOpenAlexWork } = await import("../collector/insights.mjs");
  assert.equal(openAlexAbstract({ Momentum: [0], works: [1], "well.": [2] }), "Momentum works well.");
  const p = mapOpenAlexWork({ doi: "https://doi.org/10.1/x", display_name: "A <i>study</i>", publication_date: "2026-05-01", cited_by_count: 42, fwci: 3.14, primary_location: { source: { display_name: "Journal of Finance" } }, authorships: [1, 2, 3, 4].map((i) => ({ author: { display_name: `A${i}` } })), open_access: { oa_url: "https://x/pdf" } });
  assert.equal(p.title, "A study"); assert.equal(p.url, "https://doi.org/10.1/x"); assert.equal(p.cites, 42); assert.equal(p.fwci, 3.1);
  assert.deepEqual(p.authors, ["A1", "A2", "A3"]); assert.equal(p.moreAuthors, 1); assert.equal(p.journal, "Journal of Finance"); assert.equal(p.oa, "https://x/pdf");
});

test("OpenAlex: refreshed at most every 6 hours, keeps previous result on failure", async () => {
  const { fetchJournalResearch } = await import("../collector/insights.mjs");
  const now = Date.parse("2026-11-19T12:00:00Z");
  const prev = { checkedAt: "2026-11-19T10:00:00Z", top: [{ title: "x" }], recent: [] };
  let calls = 0; const get = async () => { calls++; return null; };
  assert.equal(await fetchJournalResearch({ get }, [{ issn: "1" }], prev, now), prev); assert.equal(calls, 0);
  const old = { ...prev, checkedAt: "2026-11-19T01:00:00Z" };
  assert.equal(await fetchJournalResearch({ get }, [{ issn: "1" }], old, now), old); assert.equal(calls, 2);
});

test("Search: umlauts folded, all words required, title hits first", async () => {
  const { fold } = await import("../site/ui.js");
  const { search } = await import("../site/search.js");
  assert.equal(fold("Mietspiegel München"), fold("mietspiegel muenchen"));
  const idx = [
    { i: 0, g: "lex", title: "ETF", sub: "Fonds", hay: fold("ETF Fonds Index"), t: fold("ETF") },
    { i: 1, g: "price", title: "Welt-Aktien", sub: "ETF auf MSCI World", hay: fold("Welt-Aktien ETF auf MSCI World"), t: fold("Welt-Aktien") },
    { i: 2, g: "city", title: "Mietspiegel München", sub: "", hay: fold("Mietspiegel München"), t: fold("Mietspiegel München") },
  ];
  assert.deepEqual(search(idx, "etf").map((h) => h.i), [0, 1]);
  assert.deepEqual(search(idx, "muenchen miet").map((h) => h.i), [2]);
  assert.equal(search(idx, "etf gold").length, 0);
});

test("Search index covers themes, assets, glossary, rent indices and studies", async () => {
  const { buildIndex } = await import("../site/search.js");
  // Small inline fixture: site/data/ is generated at build time and not in the repository
  const d = {
    themes: [{ id: "ai", name: "Künstliche Intelligenz", etf: "BOTZ", short: "KI", tickers: [{ sym: "NVDA" }] }],
    assets: [{ id: "world", name: "Welt-Aktien", group: "Aktien", sym: "EUNL.DE", chg1m: 0.01 }],
    commodities: [{ id: "gold", name: "Gold", sym: "GC=F", chg1m: 0.02 }],
    news: [{ title: "Gold auf Rekordhoch", url: "https://example.com/n", source: "Test", published: Date.now() }],
    papers: { top: [{ title: "Momentum", journal: "Journal of Finance", date: "2026-01-01" }], recent: [] },
  };
  const idx = buildIndex(d, null), groups = new Set(idx.map((x) => x.g));
  for (const g of ["lex", "theme", "price", "city", "news", "paper"]) assert.ok(groups.has(g), g);
  assert.ok(idx.every((x) => x.go && typeof x.hay === "string"));
});

test("Show more: list limited until expanded", async () => {
  const { limitList, moreBtn, toggleMore } = await import("../site/ui.js");
  const l = [1, 2, 3, 4, 5];
  assert.equal(limitList("t", l, 2).length, 2); assert.match(moreBtn("t", 5, 2, "Studien"), /Alle 5 Studien/);
  toggleMore("t"); assert.equal(limitList("t", l, 2).length, 5); assert.match(moreBtn("t", 5, 2), /Weniger/);
  assert.equal(moreBtn("u", 2, 5), "");
});

test("Excess bond premium CSV: columns found by name, bad rows skipped", async () => {
  const { parseEbpCsv } = await import("../collector/insights.mjs");
  const p = parseEbpCsv("date,gz_spread,ebp,est_prob\n2026-08-01,1.9,-0.12,0.10\n2026-09-01,2.0,NA,0.11\n2026-10-01,2.4,0.31,0.22\n");
  assert.equal(p.length, 2); assert.equal(p[1].ebp, 0.31); assert.equal(p[1].prob, 0.22);
  assert.equal(parseEbpCsv("x,y\n1,2"), null);
});

test("Scores follow the literature: 12-1 momentum, overheated only after a 2-year doubling", () => {
  const up = Array.from({ length: 504 }, (_, i) => 100 * Math.pow(2.2, i / 503)); // +120 % in 2 years
  const p = priceStats(up);
  assert.ok(p.mom12_1 > 0.3 && p.chg2y > 1.1);
  const s = themeScores({ attention: null, newsAccel: null, price: p, hnRatio: null });
  assert.equal(s.runUp, true); assert.equal(s.quadrant, "unknown"); // no hype data → quadrant unknown, but run-up flagged
  const steady = priceStats(Array.from({ length: 504 }, (_, i) => 100 * Math.pow(1.3, i / 503)));
  const s2 = themeScores({ attention: { z: 0, mom: 0 }, newsAccel: 1, price: steady, hnRatio: 1 });
  assert.equal(s2.runUp, false); assert.notEqual(s2.quadrant, "overheated");
});

test("Backup restore drops crafted values (HTML, wrong types, huge numbers)", async () => {
  const { sanitizeBackup } = await import("../site/trust.js");
  const evil = '<meta http-equiv="refresh" content="0;url=https://evil.test">';
  const o = sanitizeBackup({ plan: { years: evil, once: 1e15, monthly: "50", profile: evil, reserve: '"]x', q: [evil, "a"] }, watch: 5, prefs: { off: [evil, "news"], hide: "x" }, fit: [evil], quiz: { last: 3, streak: 1e9 }, mode: evil, goal: "mutig", __proto__: { polluted: 1 }, theme: "dark" });
  assert.equal(o.plan.years, 15); assert.equal(o.plan.once, 1e9); assert.equal(o.plan.monthly, 50); assert.equal(o.plan.profile, "auto"); assert.equal(o.plan.reserve, "");
  assert.deepEqual(o.plan.q, ["a"]); assert.deepEqual(o.watch, []); assert.deepEqual(o.prefs, { off: ["news"], hide: [] }); assert.deepEqual(o.fit, []);
  assert.equal(o.quiz.streak, 10000); assert.equal(o.mode, "easy"); assert.equal(o.goal, "mutig"); assert.equal(o.theme, "dark");
  assert.equal({}.polluted, undefined);
  assert.ok(!JSON.stringify(o).includes("<"));
});

test("Backup: new files use 600k PBKDF2 rounds, old v1 files (310k) still open", async () => {
  const { encryptBackup, decryptBackup } = await import("../site/trust.js");
  const f = JSON.parse(await encryptBackup({ goal: "mutig" }, "correct horse battery"));
  assert.equal(f.v, 2); assert.equal(f.it, 600000);
  assert.deepEqual(await decryptBackup(JSON.stringify(f), "correct horse battery"), { goal: "mutig" });
  // A file must not be able to weaken the key derivation: an invalid round count is ignored (600k are used)
  assert.deepEqual(await decryptBackup(JSON.stringify({ ...f, it: 1 }), "correct horse battery"), { goal: "mutig" });
  // Build a v1 file the old way (310k rounds) and check it still decrypts
  const enc = new TextEncoder(), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey("raw", enc.encode("old password!"), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify({ mode: "pro" }))));
  const b64 = (u) => Buffer.from(u).toString("base64");
  const v1 = JSON.stringify({ app: "signal-radar", v: 1, kdf: "PBKDF2-SHA256-310000", cipher: "AES-256-GCM", salt: b64(salt), iv: b64(iv), data: b64(ct) });
  assert.deepEqual(await decryptBackup(v1, "old password!"), { mode: "pro" });
});

test("Personal: goal suggestion, interest-based sections, portfolio vs plan", async () => {
  const { suggestGoal, splitSections, analyzeDepot } = await import("../site/personal.js");
  assert.equal(suggestGoal(4, "kurz"), "sicherheit"); // short horizon always safe
  assert.equal(suggestGoal(1, "mittel"), "sicherheit");
  assert.equal(suggestGoal(3, "mittel"), "ausgewogen");
  assert.equal(suggestGoal(3, "lang"), "wachstum");
  assert.equal(suggestGoal(4, "lang"), "mutig");
  const ids = ["frueh", "anlagen", "rohstoffe", "immobilien", "trends"];
  assert.deepEqual(splitSections(ids, ["realestate"]), { mine: ["immobilien"], rest: ["frueh", "anlagen", "rohstoffe", "trends"] });
  assert.deepEqual(splitSections(ids, []).rest, []); // nothing chosen = everything
  const a = analyzeDepot([{ cat: "world", name: "", value: 6000 }, { cat: "stock", name: "Nvidia", value: 3000 }, { cat: "cash", name: "", value: 1000 }], { world: 60, themes: 5, cash: 10, btc: 0 });
  assert.equal(a.total, 10000);
  assert.equal(a.rows.find((r) => r.cat === "themes").share, 0.3);
  assert.ok(a.warnings.some((w) => w.startsWith("Nvidia macht 30 %")));
  assert.ok(a.warnings.some((w) => w.includes("Riskante Beimischungen")));
  assert.equal(analyzeDepot([], {}).total, 0);
});

test("Backup: portfolio and interests are sanitized", async () => {
  const { sanitizeBackup } = await import("../site/trust.js");
  const o = sanitizeBackup({ portfolio: [{ cat: "world", name: "MSCI World", value: 5000 }, { cat: "<x>", name: "<img onerror=1>", value: "9" }, { cat: "gold", value: -5 }, "junk"], interests: ["realestate", "<b>"], onboarded: "yes" });
  assert.deepEqual(o.portfolio, [{ cat: "world", name: "MSCI World", value: 5000 }, { cat: "other", name: "", value: 9 }]);
  assert.deepEqual(o.interests, ["realestate"]); assert.equal(o.onboarded, false);
});

test("Executive summary: every signal type links to its details", async () => {
  const { anchorOf } = await import("../site/personal.js");
  assert.equal(anchorOf("quiet-ai"), "entdecken:karte"); assert.equal(anchorOf("mortgage-move"), "entdecken:immobilien");
  assert.equal(anchorOf("insider-NVDA"), "profis:profis"); assert.equal(anchorOf("sahm"), "entdecken:frueh");
  assert.equal(anchorOf("bubble-high"), "heute:signals");
});

test("auto backup: key-based encryption opens with the password, link encoding round-trips, reminder rule", async () => {
  const { deriveKey, encryptWithKey, decryptBackup } = await import("../site/trust.js");
  const { toLinkPart, fromLinkPart, needsReminder } = await import("../site/sync.js");
  const salt = crypto.getRandomValues(new Uint8Array(16)), data = { goal: "mutig", portfolio: [{ cat: "etf", name: "MSCI World", value: 8000 }] };
  const key = await deriveKey("richtig-langes-passwort", salt);
  const a = await encryptWithKey(data, key, salt), b = await encryptWithKey(data, key, salt);
  assert.notEqual(JSON.parse(a).iv, JSON.parse(b).iv, "fresh IV every time");
  assert.deepEqual(await decryptBackup(a, "richtig-langes-passwort"), data);
  const part = toLinkPart(a);
  assert.match(part, /^[\w-]+$/);
  assert.equal(fromLinkPart(part), a);
  assert.throws(() => fromLinkPart("<script>"));
  const now = Date.parse("2026-11-21T12:00:00Z");
  assert.equal(needsReminder({ hasFile: false, dirty: true, at: null, now }), true);
  assert.equal(needsReminder({ hasFile: false, dirty: true, at: "2026-11-19T12:00:00Z", now }), false);
  assert.equal(needsReminder({ hasFile: false, dirty: true, at: "2026-11-10T12:00:00Z", now }), true);
  assert.equal(needsReminder({ hasFile: true, dirty: true, at: null, now }), false);
  assert.equal(needsReminder({ hasFile: false, dirty: false, at: null, now }), false);
});

test("AI job postings (Indeed Hiring Lab CSV): latest share, one year earlier, monthly spark", async () => {
  const { parseAiJobs } = await import("../collector/insights.mjs");
  const rows = ["date,jobcountry,AI_share_postings"];
  for (let i = 0; i < 800; i++) { const d = new Date(Date.UTC(2024, 8, 1) + i * 864e5).toISOString().slice(0, 10); rows.push(`${d},DE,${(4 + i / 400).toFixed(3)}`, `${d},FR,1`); }
  rows.push("bad,DE,x", "2026-01-01,DE,");
  const o = parseAiJobs(rows.join("\n"));
  assert.deepEqual(Object.keys(o), ["DE"]);
  assert.equal(o.DE.date, "2026-11-09");
  assert.ok(Math.abs(o.DE.share - (4 + 799 / 400) / 100) < 1e-4);
  assert.ok(Math.abs(o.DE.yearAgo - (4 + 434 / 400) / 100) < 1e-4);
  assert.equal(o.DE.spark.length, 24);
});

test("profiles: live lines from data, euro conversion, loan payment, every fact cited", async () => {
  const { personaLines, inEuro, loanPayment, FACTS, PERSONAS } = await import("../site/personas.js");
  assert.ok(Math.abs(inEuro(0.10, 0.10)) < 1e-12, "dollar price +10 % while euro +10 % = unchanged in euro");
  assert.ok(Math.abs(inEuro(0, -0.05) - 0.0526) < 1e-3);
  assert.equal(inEuro(null, 0.1), null);
  assert.equal(Math.round(loanPayment(300000, 0.035)), 1375);
  const d = {
    market: [{ sym: "EURUSD=X", chg1m: 0.02 }],
    commodities: [{ id: "copper", name: "Kupfer", unit: "$/Pfund", chg1m: 0.10 }, { id: "ttf", name: "Erdgas TTF", unit: "€/MWh", last: 31.2, chg1m: -0.2 }],
    realEstate: { mortgage: { rate: 0.035, period: "2026-10", series: Array.from({ length: 14 }, (_, i) => ({ period: `p${i}`, value: 3 + i / 10 })) }, hpi: { yoy: 0.03, period: "2026-Q2" } },
    aiJobs: { DE: { share: 0.0628, yearAgo: 0.05 } },
  };
  const roh = personaLines("rohstoffe", d).map((l) => l.t).join(" | ");
  assert.match(roh, /billiger/);
  assert.match(roh, /Erdgas TTF −20/);
  assert.match(personaLines("immo_neu", d).map((l) => l.t).join(" "), /1\.375 € im Monat/);
  assert.match(personaLines("ki", d)[0].t, /6,3 %/);
  assert.deepEqual(personaLines("krypto", {}), []);
  for (const l of personaLines("rohstoffe", d)) assert.match(l.go, /^(detail:|[a-z]+:)/);
  for (const p of PERSONAS) assert.ok(FACTS.some((f) => f.tags.includes(p.id)), `fact for ${p.id}`);
  for (const f of FACTS) assert.ok(f.cite && (f.url || f.q) && f.text && f.so, f.id);
});

test("search 2.0: synonyms, filler words, short words as whole words, one typo", async () => {
  const { search, expandQuery, oneEdit, askAiPrompt } = await import("../site/search.js");
  const { fold } = await import("../site/ui.js");
  const it = (title, extra = "") => ({ title, sub: "", hay: fold(`${title} ${extra}`), t: fold(title) });
  const idx = [it("Volatilität", "Schwankung"), it("Rohöl Brent", "Energie"), it("Bitcoin", "Krypto"), it("Bauzinsen", "EZB"), it("Gold")];
  assert.deepEqual(search(idx, "Lohnt sich Öl gerade?").map((h) => h.title), ["Rohöl Brent"]);
  assert.deepEqual(search(idx, "mortgage").map((h) => h.title), ["Bauzinsen"]);
  assert.deepEqual(search(idx, "bitcion").map((h) => h.title), ["Bitcoin"]);
  assert.deepEqual(search(idx, "gold").map((h) => h.title), ["Gold"], "a member does not pull in the whole category");
  assert.ok(search(idx, "rohstoffe").some((h) => h.title === "Gold"), "the category finds its members");
  assert.deepEqual(expandQuery("was ist")[0], ["was"], "only filler words: keep them");
  assert.equal(oneEdit("kupfer", "kupfre"), true);
  assert.equal(oneEdit("kupfer", "kpfre"), false);
  assert.match(askAiPrompt("Lohnt sich Gold?", [{ title: "Gold", sub: "+3 % 1 Monat" }], {}), /Meine Frage: Lohnt sich Gold\?[\s\S]*- Gold: \+3 %/);
});

test("readiness check: debts and missing emergency fund come first, open items are named, input is sanitized", async () => {
  const { readiness, cleanSituation } = await import("../site/situation.js");
  const { sanitizeBackup } = await import("../site/trust.js");
  const r1 = readiness(cleanSituation({ debt: true, spend: 2000, cash: 1000, save: 300, age: "25" }), 20);
  assert.equal(r1.verdict.level, "rot");
  assert.match(r1.verdict.head, /Kredite/);
  assert.match(r1.items.find((i) => i.id === "cash").title, /5\.000 €/);
  const r2 = readiness(cleanSituation({ debt: false, spend: 2000, cash: 9000 }), 15);
  assert.equal(r2.verdict.level, "grün");
  const r3 = readiness(cleanSituation({}), 15);
  assert.equal(r3.verdict.level, "gelb");
  assert.ok(r3.items.some((i) => i.state === "open"));
  assert.equal(readiness(cleanSituation({ debt: false, spend: 1, cash: 9 }), 2).verdict.level, "rot", "money needed within 3 years");
  const c = cleanSituation({ birthYear: "<script>", spend: -5, cash: "1e99", debt: "yes", family: "kinder", goalName: '<img src=x onerror="1">' });
  assert.equal(c.birthYear, null); assert.equal(c.spend, null); assert.equal(c.cash, 1e9); assert.equal(c.debt, null); assert.equal(c.family, "kinder");
  assert.doesNotMatch(c.goalName, /[<>"]/);
  assert.deepEqual(sanitizeBackup({ situation: { spend: "1800" }, learn: ["krypto", "<b>"] }).learn, ["krypto"]);
  assert.equal(sanitizeBackup({ situation: { spend: "1800" } }).situation.spend, 1800);
});

test("retirement: exact age, years to retirement, pension gap and monthly saving", async () => {
  const { cleanSituation, ageOf, pensionGap, monthlyNeeded, readiness } = await import("../site/situation.js");
  const y = new Date().getFullYear();
  const s = cleanSituation({ birthYear: y - 37, net: 3000, pension: 1400 });
  assert.equal(ageOf(s), 37);
  const g = pensionGap(s, 0.03);
  assert.equal(g.years, 30); assert.equal(g.want, 2400); assert.equal(g.gap, 1000); assert.equal(g.capital, 300000);
  assert.ok(g.monthly > 450 && g.monthly < 550, `monthly ${g.monthly}`);
  assert.ok(pensionGap(s, 0.03, 100000).monthly < g.monthly, "existing savings lower the monthly need");
  assert.equal(pensionGap(cleanSituation({ net: 3000 }), 0.03), null, "no age, no calculation");
  assert.equal(Math.round(monthlyNeeded(12000, 1, 0)), 1000);
  assert.match(readiness(s, 30).items.find((i) => i.id === "age").title, /37 Jahre: noch 30 Jahre/);
});

test("load more: growList shows n items, hides the rest, counts what is left", async () => {
  const { growList } = await import("../site/ui.js");
  const html = growList(Array.from({ length: 9 }, (_, i) => `<li>${i}</li>`), { n: 3, step: 4 });
  assert.equal((html.match(/<li hidden>/g) || []).length, 6);
  assert.match(html, /Mehr laden \(6 weitere\)/);
  assert.match(html, /data-step="4"/);
  assert.equal(growList([], {}), "");
  assert.doesNotMatch(growList(["<li>a</li>"], { n: 3 }), /grow-btn/);
});

test("same story under different headlines: clustered, distinct outlets counted, reach classified", async () => {
  const { clusterStories, dedupe, storyReach, outletKind } = await import("../collector/lib.mjs");
  const raw = [
    { title: "Nvidia meldet Rekordumsatz dank KI-Chips im dritten Quartal", source: "Handelsblatt", published: 5 },
    { title: "Rekordumsatz: Nvidia profitiert im dritten Quartal von KI-Chips", source: "tagesschau", published: 4 },
    { title: "Nvidia meldet Rekordumsatz dank KI-Chips im dritten Quartal", source: "Handelsblatt", published: 3 },
    { title: "Nvidia Rekordumsatz KI-Chips drittes Quartal Analyse", source: "heise online", published: 2 },
    { title: "Goldpreis steigt auf neues Rekordhoch", source: "n-tv", published: 1 },
  ];
  const out = clusterStories(dedupe(raw));
  assert.equal(out.length, 2);
  const nv = out.find((n) => /Nvidia/.test(n.title));
  assert.equal(nv.echo, 3, "Handelsblatt twice counts once");
  assert.deepEqual(nv.outlets.sort(), ["Handelsblatt", "heise online", "tagesschau"]);
  assert.equal(nv.reach, "both");
  assert.equal(out.find((n) => /Gold/.test(n.title)).echo, 1);
  assert.equal(outletKind("EZB Pressemitteilungen"), "official");
  assert.equal(outletKind("BBC Business"), "mainstream");
  assert.equal(outletKind("Cointelegraph"), "specialist");
  assert.equal(storyReach(["Decrypt", "CoinDesk"]), "specialist");
  assert.equal(clusterStories([{ title: "Kurz", source: "x" }, { title: "Kurz", source: "y" }]).length, 2, "too few words: never merged by similarity");
});

test("portfolio positions: euro conversion, live value from units, instrument search by name, ticker or ISIN", async () => {
  const { toEur, positionValue, catalog, matchInstrument, validRef } = await import("../site/holdings.js");
  assert.ok(Math.abs(toEur(110, "USD", 1.1) - 100) < 1e-9);
  assert.equal(toEur(50, "EUR", 1.1), 50);
  assert.equal(toEur(50, "GBp", 1.1), null);
  assert.equal(positionValue({ qty: 3, value: 10 }, { last: 100 }), 300);
  assert.equal(positionValue({ value: 10 }, { last: 100 }), 10, "no units: entered value");
  assert.equal(positionValue({ qty: 3, value: 10 }, null), 10, "no price: entered value");
  const d = { instruments: [{ sym: "EUNL.DE", name: "iShares Core MSCI World", isin: "IE00B4L5Y983", kind: "etf", cat: "world", last: 100, currency: "EUR" }],
    themes: [{ etf: "SMH", name: "Chips", price: { last: 300, currency: "USD" }, tickers: [{ sym: "NVDA", last: 150, currency: "USD" }] }], analysts: [{ sym: "NVDA", name: "Nvidia" }] };
  const cat = catalog(d);
  assert.ok(cat.some((i) => i.sym === "NVDA" && i.name === "Nvidia"));
  assert.ok(validRef("y:EUNL.DE") && validRef("cg:bitcoin") && !validRef("y:<x>") && !validRef("javascript:1"));
});

test("own topics: cleaned, matched umlaut-insensitively", async () => {
  const { cleanTopics, matchesTopic } = await import("../site/ui.js");
  assert.deepEqual(cleanTopics([" Wasserstoff ", "Rheinmetall", "<script>", "x", "Wasserstoff", "S&P 500"]), ["Wasserstoff", "Rheinmetall", "S&P 500"]);
  assert.equal(matchesTopic("Rheinmetall erhält Großauftrag", ["rheinmetall"]), true);
  assert.equal(matchesTopic("Großauftrag für Rüstung", ["Grossauftrag"]), true);
  assert.equal(matchesTopic("Gold steigt", ["Wasserstoff"]), false);
});

test("sub-pages, risk profile facts and what a gauge means now", async () => {
  const { parseHash, subFor, orderedSubs } = await import("../site/subnav.js");
  assert.deepEqual(parseHash("#entdecken/immobilien"), ["entdecken", "immobilien"]);
  assert.equal(subFor("entdecken", "immobilien"), "immobilien");
  assert.equal(subFor("profis", "eventsSec"), "ereignisse");
  assert.equal(orderedSubs("entdecken", ["realestate"])[0][0], "immobilien");
  const { profileFacts } = await import("../site/plan.js");
  const a = profileFacts("sicherheit"), b = profileFacts("mutig");
  assert.ok(a.risky < b.risky && a.crash > b.crash, "bolder = more stocks, bigger crash");
  assert.equal(a.risky + a.safe, 100);
  const { meaningNow } = await import("../site/trust.js");
  assert.match(meaningNow("lage", { bubble: { score: 37 } }, "wachstum"), /Vorsicht/);
  assert.match(meaningNow("lage", { bubble: { score: 85 } }, "mutig"), /Trend-Anteil begrenzen/);
  assert.equal(meaningNow("lage", {}, "mutig"), "");
});
