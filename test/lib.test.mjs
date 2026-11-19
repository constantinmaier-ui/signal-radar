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
  assert.equal(quadrant(80, 90, 80), "overheated");
});

test("themeScores mit fehlenden Daten liefert null statt NaN", () => {
  const s = themeScores({ attention: null, newsAccel: null, price: null, hnRatio: null });
  assert.equal(s.hype, null);
  assert.equal(s.quadrant, "unknown");
});

import { volatility, maxDrawdown, riskClass, parse13F, diff13F, tone, extractQuote } from "../collector/lib.mjs";

test("Risiko: Volatilität, Drawdown, EU-Risikoklasse", () => {
  assert.equal(riskClass(0.003), 1);
  assert.equal(riskClass(0.12), 5);
  assert.equal(riskClass(0.6), 7);
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

import { buildSignals, dailyVerdict } from "../site/signals.js";

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
  assert.equal(m.score, Math.round((80 * 0.3 + 60 * 0.15) / 0.45));
  assert.equal(m.parts.length, 2);
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
  assert.ok(dailyVerdict(d, "wachstum", 20).doList.some((x) => x.includes("Einmalbeträge direkt anlegen")));
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
