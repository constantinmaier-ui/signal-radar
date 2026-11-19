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
