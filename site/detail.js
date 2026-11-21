// Detail view for any item (asset, commodity, AI project, study): key points, chart, sources, further reading.
import { $, esc, fmt, pct, ok, dirCls, safeUrl, lineChart, dayLabels, state, compact, growList, store } from "./ui.js";
import { buildSignals, GOALS } from "./signals.js";
import { anchorOf, placeName } from "./subnav.js";

const news = (q) => `https://news.google.com/search?q=${encodeURIComponent(q)}&hl=de&gl=DE&ceid=DE:de`;
const scholar = (q) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;

/** Plain-language key points from price statistics (rules, no AI). */
export function pricePoints(x) {
  const out = [];
  if (ok(x.ext200)) out.push(x.ext200 > 0.15 ? `Liegt ${pct(x.ext200, 0)} über dem 200-Tage-Schnitt: starker Aufwärtstrend, aber Rücksetzer werden wahrscheinlicher.`
    : x.ext200 > 0 ? `Liegt über dem 200-Tage-Schnitt (${pct(x.ext200, 0)}): langfristiger Trend aufwärts.`
    : `Liegt unter dem 200-Tage-Schnitt (${pct(x.ext200, 0)}): langfristiger Trend abwärts.`);
  if (ok(x.rsi)) { if (x.rsi >= 70) out.push(`RSI ${fmt(x.rsi)}: kurzfristig heiß gelaufen (über 70).`); else if (x.rsi <= 30) out.push(`RSI ${fmt(x.rsi)}: kurzfristig stark verkauft (unter 30).`); }
  if (ok(x.pos52)) out.push(`Steht bei ${fmt(x.pos52 * 100)} % seiner 52-Wochen-Spanne (0 % = Jahrestief, 100 % = Jahreshoch).`);
  else if (ok(x.fromHigh)) out.push(x.fromHigh > -0.03 ? "Nahe am Jahreshoch." : `${pct(x.fromHigh, 0)} unter dem Jahreshoch.`);
  if (ok(x.chg1m) && ok(x.vol) && x.vol > 0) {
    const z = x.chg1m / (x.vol / Math.sqrt(12));
    if (Math.abs(z) >= 1.5) out.push(`Die Bewegung im letzten Monat ist ${fmt(Math.abs(z), 1)}-mal so groß wie üblich: ungewöhnlich.`);
  }
  if (ok(x.maxDD)) out.push(`Größter Verlust im betrachteten Zeitraum: ${pct(x.maxDD, 0)}. So viel musste man zwischendurch aushalten.`);
  return out;
}

function show({ title, badge = "", sub = "", kpis = [], series = null, end = Date.now(), body = "", points = [], links = [], more = null, chartLabel = "Verlauf, ca. 3 Monate", step = 1, fmtV = (v) => fmt(v, 2) }) {
  $("#drawerBody").innerHTML = `<h2 id="drawerTitle">${esc(title)}</h2>${badge}
    ${sub ? `<p class="sub">${sub}</p>` : ""}
    ${kpis.length ? `<div class="kpi-grid">${kpis.map(([l, v, c]) => `<div class="kpi"><span>${esc(l)}</span><b class="${c || ""}">${v}</b></div>`).join("")}</div>` : ""}
    ${series ? `<div class="chart"><h4>${esc(chartLabel)}</h4><div id="dSeries"></div></div>` : ""}
    ${points.length ? `<h3>Das Wichtigste</h3><ul class="points">${points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    ${body}
    ${links.length ? `<h3>Weiterlesen &amp; Quellen</h3><div class="link-list">${links.map(([l, u]) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("")}</div>` : ""}
    ${more ? `<button type="button" class="btn btn-ghost btn-wide more-place" data-goto="${esc(more)}">Mehr dazu: ${esc(placeName(more))} →</button>` : ""}
    <p class="fine">Regelbasiert zusammengefasst aus den Daten der letzten Aktualisierung. Keine Anlageberatung.</p>`;
  $("#drawer").hidden = false;
  document.body.style.overflow = "hidden";
  if (series) lineChart($("#dSeries"), series, { labels: dayLabels(series.length, end, step), fmtV });
  $(".drawer-close").focus();
}

function priceKpis(x) {
  return [["1 Tag", pct(x.chg1d), dirCls(x.chg1d)], ["1 Monat", pct(x.chg1m), dirCls(x.chg1m)], ["3 Monate", pct(x.chg3m, 0), dirCls(x.chg3m)],
    ["1 Jahr", pct(x.chg1y, 0), dirCls(x.chg1y)], ["vs. 200 Tage", pct(x.ext200, 0), dirCls(x.ext200)], ["RSI (14)", fmt(x.rsi)],
    ["Schwankung p. a.", ok(x.vol) ? pct(x.vol, 0).replace("+", "") : "–"], ["Risikoklasse", ok(x.riskClass) ? `${x.riskClass} von 7` : "–"]];
}

/** News of the last days whose title mentions one of the words. */
export function relatedNews(words, d = state.data || {}) {
  const w = words.map((x) => String(x || "").toLowerCase()).filter((x) => x.length >= 3);
  if (!w.length) return [];
  const seen = new Set();
  return [...(state.live || []), ...(d.news || []), ...(d.themes || []).flatMap((t) => t.top || [])]
    .filter((n) => n?.title && w.some((x) => n.title.toLowerCase().includes(x)) && !seen.has(n.title) && seen.add(n.title))
    .slice(0, 60);
}
const newsBlock = (list) => (list.length ? `<h3>Aktuelle Nachrichten dazu</h3>${growList(list.map((n) => `<li><a class="t" href="${safeUrl(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a><div class="m"><span>${esc(n.source || "")}</span></div></li>`), { n: 6, step: 10 })}` : "");
const KEYWORDS = { world: ["MSCI World", "Weltbörse", "global stocks"], sp500: ["S&P 500", "Wall Street"], dax: ["DAX"], europe: ["Stoxx", "Europas Börsen"], em: ["Schwellenländer", "emerging markets", "China"], nasdaq: ["Nasdaq", "Tech-Aktien"], bonds: ["Anleihe", "Rendite", "bond"], gold: ["Gold"], silver: ["Silber", "silver"], oil: ["Öl", "Brent", "oil"], btc: ["Bitcoin"], eth: ["Ethereum"], realestate: ["Immobilien", "REIT"] };

const goalName = () => GOALS[store.get("goal", "ausgewogen")]?.label || "Ausgewogen";
/** Explanations behind the lines of "Dein Radar": what it is, why it matters, what it means for you, source. */
function infoDetail(k, d) {
  const sch = (q) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;
  if (k === "aijobs" && d.aiJobs) {
    const de = d.aiJobs.DE || {}, us = d.aiJobs.US || {};
    return { title: "KI in Stellenanzeigen", sub: `Indeed Hiring Lab · Stand ${esc(de.date || "")}`, series: de.spark, chartLabel: "Anteil der Stellen mit KI, Deutschland, in % (monatlich)", step: 30, fmtV: (v) => `${fmt(v, 1)} %`,
      kpis: [["Deutschland", ok(de.share) ? `${fmt(de.share * 100, 1)} %` : "–"], ["vor 1 Jahr", ok(de.yearAgo) ? `${fmt(de.yearAgo * 100, 1)} %` : "–"], ["USA", ok(us.share) ? `${fmt(us.share * 100, 1)} %` : "–"]],
      points: ["Was es misst: Wie viele aller Stellenanzeigen KI erwähnen (z. B. „Machine Learning“, „generative KI“).",
        "Warum es früh ist: Firmen stellen Fachleute ein, bevor Produkte fertig sind und bevor KI-Umsätze in Geschäftsberichten auftauchen.",
        `Was es für dich heißt (${goalName()}): Steigt der Anteil weiter, investieren Firmen breit in KI. Das stützt das KI-Thema, sagt aber nichts darüber, ob KI-Aktien schon zu teuer sind. Dafür das Blasen-Meter ansehen.`,
        "Grenze: Ein Frühsignal für Investitionen, keine Kursprognose."],
      links: [["Indeed Hiring Lab: KI-Tracker (Daten)", "https://github.com/hiring-lab/ai-tracker"]], more: "entdecken:trends" };
  }
  if (k === "stablecoins" && d.cryptoFlows?.stablecoins) {
    const sc = d.cryptoFlows.stablecoins;
    return { title: "Stablecoins: Krypto-Bargeld", sub: "DefiLlama · täglich", series: sc.spark, chartLabel: "Menge aller Stablecoins (Mio. $)", fmtV: (v) => compact(v * 1e6),
      kpis: [["Menge", `${compact(sc.value)} $`], ["30 Tage", pct(sc.chg30)], ["90 Tage", pct(sc.chg90)]],
      points: ["Was es ist: Digitale Dollar (z. B. USDT, USDC), mit denen an Krypto-Börsen gekauft wird.", "Warum es zählt: Wächst die Menge, liegt mehr Geld bereit, um Krypto zu kaufen. Schrumpft sie, fließt Geld ab.",
        `Was es für dich heißt (${goalName()}): Ein Stimmungs- und Geldfluss-Zeichen für Krypto, kein Kaufsignal. Krypto bleibt im Plan eine kleine Beimischung.`, "Beweislage: schwach, die Forschung dazu ist jung."],
      links: [["DefiLlama Stablecoins", "https://defillama.com/stablecoins"]], more: "entdecken:trends" };
  }
  if (k === "cryptofng" && d.fearGreed) {
    return { title: "Krypto-Stimmung (Angst & Gier)", sub: "alternative.me · täglich", series: d.fearGreed.spark, chartLabel: "0 = extreme Angst, 100 = extreme Gier", fmtV: (v) => fmt(v),
      kpis: [["Heute", `${d.fearGreed.value}/100`]],
      points: ["Wie es entsteht: Mischung aus Schwankung, Handelsvolumen, sozialen Medien, Bitcoin-Anteil und Suchinteresse.", "Wichtig: eine Branchen-Kennzahl, kein wissenschaftlich geprüftes Maß.",
        `Was es für dich heißt (${goalName()}): Extreme Werte zeigen Übertreibung. Bei Gier nichts hinterherkaufen, bei Angst nicht in Panik verkaufen.`],
      links: [["Original bei alternative.me", "https://alternative.me/crypto/fear-and-greed-index/"], ["Liu & Tsyvinski (2021): Risiken und Renditen von Krypto", sch("Liu Tsyvinski Risks and returns of cryptocurrency")]], more: "entdecken:konjunktur" };
  }
  if (k === "cryptotrend") {
    const list = (d.cryptoTrending || []).slice(0, 10);
    return { title: "Krypto: gerade am meisten gesucht", sub: "CoinGecko · alle 15 Min.",
      body: list.length ? `<ul class="feed">${list.map((c, i) => `<li><b>${i + 1}. ${esc(c.name)}</b> <span class="fine">${esc(c.symbol || "")}${ok(c.chg24h) ? ` · 24 Std. ${pct(c.chg24h / 100)}` : ""}</span></li>`).join("")}</ul>` : "",
      points: ["Was es misst: Welche Coins gerade auf CoinGecko am häufigsten gesucht werden.", "Was es heißt: Suchinteresse zeigt Trends früh, aber auch Hype. Kleine Coins mit plötzlichem Interesse fallen oft genauso schnell wieder.",
        `Für dich (${goalName()}): Eine Liste zum Beobachten, keine Kaufliste.`], links: [["CoinGecko Trends", "https://www.coingecko.com/en/highlights/trending-crypto"]] };
  }
  if (k === "adoption") {
    const list = [...(d.adoption || [])].filter((a) => ok(a.growth)).sort((a, b) => b.growth - a.growth);
    return { title: "KI-Software: echte Nutzung", sub: "PyPI + npm · Downloads pro Woche",
      body: `<ul class="feed">${list.map((a) => `<li><b>${esc(a.name)}</b> <span class="fine">${compact(a.week)} Downloads/Woche · ${pct(a.growth, 0)} zur Vorwoche${a.listed ? ` · ${esc(a.listed)}` : ""}</span></li>`).join("")}</ul>`,
      points: ["Was es misst: Wie oft Entwickler die Programmier-Bausteine der KI-Firmen herunterladen.", "Warum es früh ist: Wer heute die meisten Entwickler hat, hat oft bald die meisten Kunden.",
        `Für dich (${goalName()}): Zeigt, welche KI-Anbieter wirklich genutzt werden. Viele davon sind nicht börsennotiert; dahinterstehende Partner stehen jeweils dabei.`],
      links: [["PyPI Stats", "https://pypistats.org/"], ["npm trends", "https://npmtrends.com/"]], more: "entdecken:trends" };
  }
  if (k === "power" && d.power) {
    return { title: "Strompreis Deutschland (Börse)", sub: `Energy-Charts (Fraunhofer ISE) · ${esc(d.power.unit || "")}`, series: d.power.series, chartLabel: "Börsenstrompreis, Tagesverlauf", fmtV: (v) => `${fmt(v)} €`,
      kpis: [["Heute Ø", `${fmt(d.power.avg)} €/MWh`], ["30 Tage Ø", `${fmt(d.power.avg30)} €/MWh`], ["Tief/Hoch heute", `${fmt(d.power.min)}–${fmt(d.power.max)}`]],
      points: ["Was es ist: Der Großhandelspreis an der Strombörse, nicht dein Haushaltstarif.", "Wofür wichtig: Kosten für Industrie und Rechenzentren; Spitzen zeigen knappe Versorgung."],
      links: [["Energy-Charts", "https://www.energy-charts.info/"]], more: "entdecken:rohstoffe" };
  }
  if ((k === "mortgage" || k === "hpi") && d.realEstate) {
    const m = d.realEstate.mortgage, h = d.realEstate.hpi;
    if (k === "mortgage" && m) return { title: "Bauzinsen Deutschland", sub: `EZB-Zinsstatistik · ${esc(m.period || "")} · monatlich`, series: (m.series || []).map((x) => x.value), chartLabel: "Effektiver Zins für Wohnungsbaukredite, in %", step: 30, fmtV: (v) => `${fmt(v, 2)} %`,
      kpis: [["Aktuell", `${fmt(m.rate * 100, 2)} %`]],
      points: ["Was es ist: Der durchschnittliche Zins neuer Wohnungsbaukredite in Deutschland laut EZB-Statistik. Dein Angebot hängt von Bonität, Eigenkapital und Laufzeit ab.",
        "Was es heißt: Jeder Prozentpunkt mehr kostet bei 300.000 € Kredit rund 250 € im Monat. Sinkende Zinsen machen Kaufen leichter, steigende teurer."],
      links: [["EZB-Statistik (Data Portal)", "https://data.ecb.europa.eu/"]], more: "entdecken:immobilien" };
    if (k === "hpi" && h) return { title: "Hauspreise Deutschland", sub: `Eurostat · ${esc(h.period || "")} · vierteljährlich`, series: (h.series || []).map((x) => x.value), chartLabel: "Veränderung zum Vorjahr, in %", step: 90, fmtV: (v) => `${fmt(v, 1)} %`,
      kpis: [["zum Vorjahr", pct(h.yoy)]],
      points: ["Was es ist: Amtlicher Index der Preise für Wohnimmobilien in Deutschland.", "Was es heißt: ein Durchschnitt. In einzelnen Städten und Lagen kann es ganz anders aussehen; dafür den Mietspiegel und den Rechner im Bereich Immobilien nutzen."],
      links: [["Eurostat Hauspreise", "https://ec.europa.eu/eurostat/web/housing-price-statistics"]], more: "entdecken:immobilien" };
  }
  return null;
}

/** key: "asset:<id>", "com:<id>", "mkt:<sym>", "repo:<i>", "model:<i>", "paper:<list>:<i>", "study:<i>", "sig:<id>", "info:<key>" */
export function openDetailFor(key) {
  const d = state.data; if (!d) return false;
  if (key.startsWith("sig:")) {
    const id = key.slice(4), sg = buildSignals(d, state.history || []).find((x) => x.id === id); if (!sg) return false;
    const where = anchorOf(id);
    show({ title: sg.title, badge: `<span class="badge ${sg.kind === "warnung" ? "b-noise" : "b-quiet"}">${esc({ chance: "Chance", warnung: "Risiko", info: "Info" }[sg.kind] || sg.kind)}</span>`, sub: `Quelle: ${esc(sg.source || "")}`,
      points: [`Was ist los: ${sg.text}`, ...(sg.hype ? [`Warum Hype: ${sg.hype}`] : []), `Was du tun könntest (${goalName()}): ${sg.todo}`],
      more: where !== "heute:signals" ? where : null });
    return true;
  }
  if (key.startsWith("info:")) { const x = infoDetail(key.slice(5), d); if (!x) return false; show(x); return true; }
  const [kind, a, b] = key.split(":");
  if (kind === "asset" || kind === "com" || kind === "mkt") {
    const x = kind === "mkt" ? d.market?.find((v) => v.sym === a) : (kind === "asset" ? d.assets : d.commodities)?.find((v) => v.id === a); if (!x) return false;
    const words = [...(KEYWORDS[x.id] || []), x.name.split(/[ (]/)[0]];
    show({
      title: x.name, sub: esc(x.what || `${kind === "mkt" ? "Markt-Überblick" : x.group || "Rohstoff"}${x.unit ? ` · ${x.unit}` : ""} · Kürzel ${x.sym}`),
      kpis: priceKpis(x), series: x.spark, end: x.sparkEnd,
      points: pricePoints(x),
      body: (x.examples ? `<p class="fine">${esc(x.examples)}</p>` : "") + newsBlock(relatedNews(words, d)),
      links: [["Aktuelle Nachrichten", news(x.name)], ["Kurs bei Yahoo Finance", `https://finance.yahoo.com/quote/${encodeURIComponent(x.sym)}`]],
    });
    return true;
  }
  if (kind === "repo" || kind === "model") {
    const x = (kind === "repo" ? d.tech?.repos : d.tech?.models)?.[+a]; if (!x) return false;
    const org = x.name.split("/")[0];
    show({
      title: x.name, sub: kind === "repo" ? `GitHub-Projekt${x.lang ? ` · ${esc(x.lang)}` : ""}` : `KI-Modell auf Hugging Face${x.task ? ` · ${esc(x.task)}` : ""}`,
      kpis: kind === "repo" ? [["Sterne (neu, 30 Tage)", compact(x.stars)], ["Rang", `#${+a + 1}`]] : [["Downloads", compact(x.downloads)], ["Likes", compact(x.likes)], ["Rang", `#${+a + 1}`]],
      points: [
        x.desc ? `Worum es geht: ${x.desc}` : null,
        kind === "repo" ? "Sterne sind Lesezeichen von Entwicklern. Viele neue Sterne in kurzer Zeit zeigen echtes Interesse, nicht nur Medienrummel." : "Downloads zeigen, wie viele das Modell tatsächlich einsetzen.",
        x.ticker ? `Börsennotierte Firma dahinter: ${x.ticker}. Ein einzelnes Projekt bewegt den Kurs selten, zeigt aber, wo die Firma technisch steht.` : "Keine eindeutig börsennotierte Firma dahinter.",
      ].filter(Boolean),
      links: [[kind === "repo" ? "Projekt auf GitHub" : "Modell auf Hugging Face", x.url], ["Nachrichten dazu", news(x.name.split("/").pop())], ["Mehr von " + org, kind === "repo" ? `https://github.com/${encodeURIComponent(org)}` : `https://huggingface.co/${encodeURIComponent(org)}`]],
    });
    return true;
  }
  if (kind === "paper" || kind === "study") {
    const x = kind === "paper" ? d.papers?.[a]?.[+b] : d.research?.[+a]; if (!x) return false;
    const reviewed = kind === "paper" || x.journal;
    show({
      title: x.de || x.title,
      badge: reviewed ? '<span class="badge b-quiet">✓ Begutachtet (Peer Review)</span>' : '<span class="badge b-noise">Arbeitspapier, noch nicht begutachtet</span>',
      sub: `${esc(typeof x.journal === "string" ? x.journal : x.source || "")}${x.date ? ` · ${esc(x.date)}` : ""}${x.authors?.length ? ` · ${esc(x.authors.join(", "))}${x.moreAuthors ? ` u. a.` : ""}` : ""}${x.de ? `<br><span class="fine">Original: ${esc(x.title)}</span>` : ""}`,
      kpis: kind === "paper" ? [["Zitiert", fmt(x.cites)], ["Einfluss vs. Fachschnitt", ok(x.fwci) ? `${fmt(x.fwci, 1)}×` : "–"]] : [],
      points: [
        x.summary ? `Zusammenfassung (Original): ${x.summary}` : null,
        reviewed ? "Begutachtet heißt: Unabhängige Fachleute haben Methode und Ergebnisse vor der Veröffentlichung geprüft." : "Arbeitspapiere sind schneller, aber noch ungeprüft. Ergebnisse können sich bis zur Veröffentlichung ändern.",
        kind === "paper" && ok(x.fwci) ? `„Einfluss ${fmt(x.fwci, 1)}×“ heißt: wird ${fmt(x.fwci, 1)}-mal so oft zitiert wie vergleichbare Arbeiten aus demselben Fach und Jahr.` : null,
      ].filter(Boolean),
      links: [["Zur Studie", x.url], ...(x.oa ? [["Kostenlose Fassung", x.oa]] : []), ["Bei Google Scholar suchen", scholar(x.title)]],
    });
    return true;
  }
  return false;
}
