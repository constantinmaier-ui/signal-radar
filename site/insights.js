// Nachrichten-Wirkung, Forschung, Immobilien (+ Rechner), Quellen-Übersicht, Einsteiger/Profi-Modus.
import { $, $$, esc, fmt, pct, ok, ago, safeUrl, state, store, lineChart, dirCls, arrow, spark } from "./ui.js";

const DIR = { up: ["↑", "up", "steigt eher"], down: ["↓", "down", "fällt eher"], mixed: ["↕", "flat", "gemischt"], flat: ["–", "flat", "kaum Wirkung"] };
const CLASSES = [["aktien", "Aktien"], ["anleihen", "Anleihen"], ["gold", "Gold"], ["immobilien", "Immobilien"], ["krypto", "Krypto"]];

function eventCard(e, compact) {
  const hot = ok(e.accel) && e.accel >= 1.4;
  const impacts = CLASSES.map(([k, l]) => {
    const [dir, note] = e.impact[k] || ["flat", ""];
    const [sym, cls, word] = DIR[dir];
    return `<span class="imp ${cls}" title="${esc(`${l}: ${word}${note && note !== "–" ? ` (${note})` : ""}`)}"><b>${sym}</b> ${l}</span>`;
  }).join("");
  return `<article class="event">
    <header><span class="ev-ico" aria-hidden="true">${e.icon}</span><div><h3>${esc(e.name)}</h3>
      <span class="fine">${e.n48h} ${e.n48h === 1 ? "Meldung" : "Meldungen"} in 48 Std. · ${e.n7d} in 7 Tagen${hot ? ' · <b class="hotword">mehr als sonst</b>' : ""}</span></div></header>
    <div class="imps" aria-label="Typische Wirkung">${impacts}</div>
    <p>${esc(e.why)}</p>
    ${compact ? "" : `<details class="evid"><summary>Was sagt die Forschung?</summary><p>${esc(e.evidence)}</p></details>`}
    ${e.top.slice(0, compact ? 1 : 3).map((n) => `<a class="ev-news" href="${safeUrl(n.url)}" target="_blank" rel="noopener">${esc(n.title)} <span class="fine">${esc(n.source)} · ${ago(n.published)}</span></a>`).join("")}
  </article>`;
}
export function renderEvents() {
  const ev = (state.data.events || []).filter((e) => e.n7d > 0);
  const top = ev.filter((e) => e.n48h > 0).slice(0, 3);
  $("#eventsToday").innerHTML = top.length ? top.map((e) => eventCard(e, true)).join("") : '<div class="empty">Gerade keine auffällige Nachrichtenlage.</div>';
  $("#eventsAll").innerHTML = ev.length ? ev.map((e) => eventCard(e, false)).join("") : '<div class="empty">Noch keine Daten.</div>';
}

// ---------- Forschung ----------
const PRINCIPLES = [
  ["Breit streuen", "Wer auf viele Firmen und Länder verteilt, senkt das Risiko, ohne auf Rendite zu verzichten.", "Markowitz, Portfolio-Theorie (1952, Nobelpreis 1990)", "Das Radar setzt im Plan immer einen breiten Welt-ETF als Kern."],
  ["Kosten schlagen fast alles", "Die große Mehrheit aktiv gemanagter Fonds schneidet über 10–15 Jahre schlechter ab als ein günstiger Index-ETF.", "S&P SPIVA-Berichte, jährlich seit 2002", "Der Plan nutzt nur günstige Index-ETFs (unter 0,25 % pro Jahr)."],
  ["Market Timing funktioniert selten", "Wer die besten Börsentage verpasst, verliert einen großen Teil der Rendite. Und die besten Tage liegen oft direkt neben den schlechtesten.", "Zahlreiche Langzeitstudien zu „Time in the market“", "Darum: Sparplan statt Timing. Die Ampel ändert nur kleine Anteile, nie den Kern."],
  ["Viel handeln kostet Rendite", "Privatanleger, die am häufigsten handelten, schnitten deutlich schlechter ab als solche, die wenig handelten.", "Barber & Odean, „Trading Is Hazardous to Your Wealth“ (2000)", "Das Radar empfiehlt einmal im Jahr Rebalancing, nicht tägliches Handeln."],
  ["Hype-Aktien enttäuschen oft", "Aktien, die viel Aufmerksamkeit bekommen, werden von Privatanlegern verstärkt gekauft und entwickeln sich danach im Schnitt schwächer.", "Barber & Odean, „All That Glitters“ (2008)", "Deshalb warnt die Hype-Karte bei viel Aufmerksamkeit ohne Kurs („Hype ohne Kurs“)."],
  ["Extreme Kursrallyes bergen Crash-Gefahr", "Branchen, die in zwei Jahren um mehr als 100 % gestiegen sind, hatten danach ein deutlich erhöhtes Absturzrisiko.", "Greenwood, Shleifer & You, „Bubbles for Fama“ (2019)", "Das Radar markiert Themen weit über ihrer 200-Tage-Linie als „überhitzt“."],
  ["Trends halten oft eine Weile", "Was in den letzten 3–12 Monaten gestiegen ist, steigt im Schnitt noch etwas weiter (Momentum-Effekt), mit gelegentlichen heftigen Umschwüngen.", "Jegadeesh & Titman (1993); Daniel & Moskowitz, „Momentum Crashes“ (2016)", "Die Hype-Karte nutzt den Kurs-Trend, kombiniert mit einer Überhitzungs-Bremse."],
  ["Stimmung als Gegenindikator", "Wenn die Anlegerstimmung sehr euphorisch ist, fallen die Renditen danach oft schwächer aus, besonders bei spekulativen Aktien.", "Baker & Wurgler, Investor Sentiment (2006)", "Daraus speisen sich das Blasen-Meter und die Fear-&-Greed-Anzeigen."],
  ["Hype-Börsengänge laufen langfristig schwach", "Neue Aktien entwickeln sich in den ersten Jahren nach dem Börsengang im Schnitt schlechter als vergleichbare Firmen.", "Ritter, „The Long-Run Performance of IPOs“ (1991)", "Das IPO-Radar rät: bei Hype-IPOs nicht am ersten Tag kaufen."],
  ["Einmal anlegen schlägt meist Raten", "Historisch brachte das sofortige Anlegen eines Betrags in etwa 2 von 3 Fällen mehr als das Verteilen über Monate. Raten sind eine Versicherung gegen schlechtes Timing und gegen Reue.", "Vanguard, „Dollar-cost averaging just means taking risk later“ (2012)", "Die Ampel empfiehlt Raten deshalb nur bei Gelb oder Rot und sagt ehrlich, dass das eine Absicherung ist."],
];
export function renderResearch() {
  $("#principles").innerHTML = PRINCIPLES.map(([t, what, src, use], i) => `<article class="principle"><div class="pnum">${i + 1}</div><div><h3>${esc(t)}</h3><p>${esc(what)}</p><p class="fine">Quelle: ${esc(src)}</p><p class="use">So nutzt es das Radar: ${esc(use)}</p></div></article>`).join("");
  const r = state.data?.research || [];
  $("#papers").innerHTML = r.length ? r.slice(0, 8).map((p) => `<a class="paper" href="${safeUrl(p.url)}" target="_blank" rel="noopener"><b>${esc(p.de || p.title)}</b>${p.de ? `<span class="fine">Original: ${esc(p.title)}</span>` : ""}<span class="fine">${esc(p.source)} · ${ago(p.published)}</span></a>`).join("")
    : '<div class="empty">Gerade keine neuen Studien abrufbar.</div>';
}

// ---------- Quellen-Übersicht ----------
const SOURCES = [
  ["Kurse & Indizes", "Yahoo Finance (Ersatz: Stooq)", "Schlusskurse, Trends, Schwankung"],
  ["Analysten", "Yahoo-Finance-Konsens + Google News", "Kursziele, Noten, Zitate"],
  ["Große Investoren", "US-Börsenaufsicht SEC (EDGAR, 13F)", "Offizielle Pflichtmeldungen"],
  ["Nachrichten", "Google News, tagesschau, Handelsblatt, FAZ, Spiegel, CNBC, MarketWatch, Yahoo, TechCrunch, CoinDesk", "Schlagzeilen, Ereignis-Arten"],
  ["Tech-Szene & Foren", "Hacker News, Reddit", "Was Insider und Privatanleger diskutieren"],
  ["Aufmerksamkeit", "Wikipedia-Seitenaufrufe (Wikimedia)", "Wie stark ein Thema gesucht wird"],
  ["Weltpresse", "GDELT-Projekt", "Wie oft über eine Blase berichtet wird"],
  ["Stimmung", "CNN Fear & Greed, alternative.me (Krypto)", "Angst oder Gier"],
  ["Wettmärkte", "Polymarket", "Echtgeld-Wahrscheinlichkeiten"],
  ["Zinsen & Immobilien", "Europäische Zentralbank, Eurostat", "Leitzins, Bauzinsen, Hauspreise"],
  ["Konjunktur-Frühwarnung", "FRED (US-Notenbank St. Louis)", "Zinskurve, Kredit-Risikoaufschläge, Sahm-Regel"],
  ["Rohstoffe", "Terminbörsen (über Yahoo Finance)", "18 Rohstoffe: Preis, Trend, Lage in der Jahresspanne"],
  ["Insider-Käufe", "US-Börsenaufsicht SEC (Form 4)", "Wenn Vorstände eigene Aktien kaufen"],
  ["Krypto live", "CoinGecko (Ersatz: Binance)", "Bitcoin- und Ethereum-Kurs minütlich"],
  ["Forschung", "arXiv, NBER", "Neueste Fachstudien"],
  ["Einordnung (optional)", "Claude (Anthropic)", "Tagesbriefing und Übersetzungen ins Deutsche"],
];
export function renderSourcesTable() {
  $("#sourceTable").innerHTML = `<table class="tick-table"><thead><tr><th>Wofür</th><th>Quelle</th><th>Was wir daraus nehmen</th></tr></thead><tbody>${SOURCES.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

// ---------- Immobilien ----------
export function renderRealEstate() {
  const re = state.data.realEstate;
  if (!re) { $("#reKpis").innerHTML = '<div class="empty">Noch keine Immobilien-Daten.</div>'; return; }
  const m = re.mortgage, h = re.hpi, b = re.bund10, v = re.stocks?.["VNA.DE"];
  const per = (p) => (p ? String(p).replace(/-Q/, " Q").replace(/^(\d{4})-(\d{2})$/, "$2/$1") : "");
  $("#reKpis").innerHTML = `
    <div class="rate"><span>Bauzins Deutschland (Durchschnitt)</span><b>${m ? fmt(m.rate * 100, 2) + " %" : "–"}</b>${m && ok(m.yearAgo) ? `<em class="${dirCls(-(m.rate - m.yearAgo))}">${m.rate >= m.yearAgo ? "▲" : "▼"} vor 1 Jahr ${fmt(m.yearAgo * 100, 2)} %</em>` : ""}<small>Stand ${per(m?.period)}, EZB</small></div>
    <div class="rate"><span>Hauspreise Deutschland zum Vorjahr</span><b class="${dirCls(h?.yoy)}">${h ? pct(h.yoy, 1) : "–"}</b><small>Stand ${per(h?.period)}, Eurostat</small></div>
    <div class="rate"><span>Rendite 10-jährige Staatsanleihen (Euroraum, beste Bonität)</span><b>${b ? fmt(b.rate * 100, 2) + " %" : "–"}</b><small>Bauzinsen folgen ihr meist mit Abstand</small></div>
    <div class="rate"><span>Immobilien-Aktie Vonovia (größter deutscher Vermieter)</span><b class="${dirCls(v?.chg1y)}">${v ? pct(v.chg1y, 0) + " in 1 Jahr" : "–"}</b><small>reagiert stark auf Zinsen</small></div>`;
  if (m?.series?.length > 3) lineChart($("#reChart"), m.series.map((p) => p.value), { labels: m.series.map((p) => per(p.period)), fmtV: (x) => `Bauzins ${fmt(x, 2)} %`, color: "var(--s2)", h: 120 });
  calcRealEstate();
}
export function calcRealEstate() {
  const f = $("#reForm"); if (!f) return;
  const price = +f.price.value || 0, rent = +f.rent.value || 0, equity = +f.equity.value || 0;
  const rateDefault = state.data?.realEstate?.mortgage?.rate;
  if (!f.rate.dataset.touched && ok(rateDefault)) f.rate.value = (rateDefault * 100).toFixed(2);
  const rate = (+f.rate.value || 0) / 100, tilg = (+f.tilg.value || 0) / 100;
  const extra = price * 0.10; // Kaufnebenkosten grob: Grunderwerbsteuer, Notar, Grundbuch, Makler
  const loan = Math.max(0, price + extra - equity);
  const monthly = loan * (rate + tilg) / 12;
  const factor = rent ? price / (rent * 12) : null;
  const gross = factor ? 1 / factor : null;
  const verdict = !factor ? "" : factor < 20 ? ["g", "Eher günstig: Kaufpreis unter 20 Jahresmieten."] : factor <= 25 ? ["y", "Normal bewertet: 20–25 Jahresmieten."] : ["r", "Eher teuer: über 25 Jahresmieten. Kaufen lohnt sich finanziell oft weniger als mieten und den Rest anlegen."];
  const loanVsRent = gross && rate ? (rate > gross ? "Der Kreditzins ist höher als die Bruttomietrendite: Der Kredit kostet mehr, als die Wohnung an Miete einbringt." : "Die Bruttomietrendite liegt über dem Kreditzins. Ein gutes Zeichen, aber Instandhaltung und Leerstand kommen noch dazu.") : "";
  $("#reOut").innerHTML = `
    <div class="proj-kpis"><div><span>Kaufpreisfaktor</span><b>${factor ? fmt(factor, 1) + "×" : "–"}</b></div><div><span>Bruttomietrendite</span><b>${gross ? fmt(gross * 100, 1) + " %" : "–"}</b></div><div><span>Nebenkosten ca.</span><b>${fmt(extra)} €</b></div><div class="hl"><span>Monatsrate</span><b>${fmt(monthly)} €</b></div></div>
    ${verdict ? `<div class="re-verdict lv-${verdict[0]}">${esc(verdict[1])}</div>` : ""}
    ${loanVsRent ? `<p class="fine">${esc(loanVsRent)}</p>` : ""}
    <p class="fine">Faustregeln, keine Bewertung im Einzelfall. Nebenkosten mit pauschal 10 % angesetzt (Grunderwerbsteuer 3,5–6,5 % je Bundesland, Notar und Grundbuch ca. 2 %, eventuell Makler). Kredit = Kaufpreis + Nebenkosten − Eigenkapital.</p>`;
}
export function initRealEstateForm() {
  const f = $("#reForm"); if (!f) return;
  f.addEventListener("input", (e) => { if (e.target.name === "rate") e.target.dataset.touched = "1"; calcRealEstate(); });
  f.addEventListener("submit", (e) => e.preventDefault());
}

// ---------- Einsteiger / Profi ----------
export function initMode(onChange) {
  const apply = (m) => {
    document.body.classList.toggle("mode-pro", m === "pro");
    document.body.classList.toggle("mode-easy", m !== "pro");
    $$("#modeSeg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  };
  apply(store.get("mode", "easy"));
  $("#modeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]"); if (!b) return;
    store.set("mode", b.dataset.mode); apply(b.dataset.mode); onChange?.();
  });
}

// ---------- Weitere & neuartige Anlageformen (Erklärkarten) ----------
const INSTRUMENTS = [
  { name: "Festgeld & Bundeswertpapiere", tag: "Sicher", verdict: ["g", "Sinnvoll"], what: "Fester Zins für feste Laufzeit, bei Banken mit Einlagensicherung oder direkt beim Bund.", chance: "Planbarer Zins, kein Kursrisiko.", risk: "Geld ist gebunden; nach Inflation bleibt oft wenig übrig.", who: "Für Geld, das du in 1–3 Jahren brauchst." },
  { name: "Geldmarkt-ETFs", tag: "Sicher", verdict: ["g", "Sinnvoll"], what: "Börsengehandelte Alternative zum Tagesgeld, verzinst mit dem Tageszins der Banken.", chance: "Täglich verkaufbar, kein Lockzins-Wechsel nötig.", risk: "Fällt der Leitzins, sinkt auch der Ertrag.", who: "Als Parkplatz für Geld im Depot." },
  { name: "Faktor-ETFs (Value, Qualität, Small Cap)", tag: "Wissenschaftlich", verdict: ["g", "Als Beimischung"], what: "ETFs, die gezielt auf belegte Rendite-Treiber setzen: günstige, profitable oder kleine Firmen.", chance: "Langfristig belegte Zusatzrendite (Fama & French; Novy-Marx).", risk: "Kann 5–10 Jahre schlechter laufen als der Gesamtmarkt.", who: "Fortgeschrittene mit langem Atem, 10–30 % des Aktienanteils." },
  { name: "ELTIF (europäische Langfrist-Fonds)", tag: "Neu seit 2024", verdict: ["y", "Nur gezielt"], what: "Seit der EU-Reform 2024 (ELTIF 2.0) können Privatanleger in Private Equity, Infrastruktur und Firmenkredite investieren, oft schon ab kleinen Beträgen.", chance: "Zugang zu Märkten, die früher Großanlegern vorbehalten waren.", risk: "Oft hohe Gebühren, eingeschränkt verkaufbar, Bewertung schwer durchschaubar.", who: "Nur mit langem Horizont und kleinem Anteil; Kosten genau prüfen." },
  { name: "Tokenisierte Wertpapiere", tag: "Neuartig", verdict: ["y", "Beobachten"], what: "Klassische Anlagen wie Anleihen oder Geldmarktfonds als digitales Token auf einer Blockchain. In Deutschland seit dem eWpG (2021) möglich; große Fondshäuser bieten erste Produkte an.", chance: "Schneller, rund um die Uhr, günstiger in der Abwicklung.", risk: "Junger Markt, Verwahrung und Rechtslage teils noch unklar.", who: "Spannend zum Beobachten, für Einsteiger noch nicht nötig." },
  { name: "Infrastruktur", tag: "Sachwert", verdict: ["g", "Als Beimischung"], what: "Netze, Häfen, Pipelines, Rechenzentren. Stabile, oft an die Inflation gekoppelte Einnahmen.", chance: "Profitiert vom Ausbau für KI und Energiewende.", risk: "Zinsempfindlich, teils politisch reguliert.", who: "Als kleiner Baustein neben dem Welt-ETF." },
  { name: "Private Credit", tag: "Im Trend", verdict: ["y", "Vorsicht"], what: "Kredite an Firmen außerhalb der Banken, verpackt in Fonds.", chance: "Hohe laufende Zinsen.", risk: "Wenig erprobt in schweren Krisen; Ausfälle können sich häufen.", who: "Höchstens kleiner Anteil für Erfahrene." },
  { name: "P2P- und Crowd-Kredite", tag: "Riskant", verdict: ["r", "Eher lassen"], what: "Du leihst Privatleuten oder kleinen Firmen über eine Plattform Geld, auch für Immobilienprojekte.", chance: "Hohe versprochene Zinsen.", risk: "Häufige Ausfälle; mehrere Plattformen sind pleitegegangen.", who: "Nur Spielgeld, das du komplett verlieren kannst." },
  { name: "Hebelprodukte & CFDs", tag: "Finger weg", verdict: ["r", "Finger weg"], what: "Wetten mit Hebel auf Kurse (Optionsscheine, Knock-outs, CFDs).", chance: "Schnelle große Gewinne möglich.", risk: "Laut EU-Pflichthinweis verlieren die meisten Privatkunden (rund 3 von 4) mit CFDs Geld.", who: "Für Vermögensaufbau ungeeignet." },
  { name: "Covered-Call-ETFs („Dividenden-Maschinen“)", tag: "Marketing-Falle", verdict: ["r", "Eher lassen"], what: "ETFs, die durch Optionsverkäufe hohe Ausschüttungen erzeugen.", chance: "Hohe laufende Auszahlungen.", risk: "Gewinne nach oben sind gedeckelt. Langfristig meist schwächer als ein normaler ETF.", who: "Für Vermögensaufbau meist ungeeignet." },
  { name: "Kunst, Uhren, Oldtimer, Wein", tag: "Liebhaberei", verdict: ["y", "Nur aus Leidenschaft"], what: "Sachwerte zum Anfassen.", chance: "Einzelstücke können stark steigen.", risk: "Hohe Kosten (Händler, Lagerung, Versicherung), schwer verkäuflich, Fälschungen.", who: "Wenn es Freude macht, nicht als Hauptanlage." },
  { name: "Prognosemärkte (z. B. Polymarket)", tag: "Info-Quelle", verdict: ["y", "Nur zum Lesen"], what: "Echtgeld-Wetten auf Ereignisse. Die Quoten zeigen, was die Masse erwartet.", chance: "Oft gute Frühindikatoren für Wahrscheinlichkeiten.", risk: "In der EU meist nicht reguliert; als Anlage ungeeignet.", who: "Das Radar nutzt sie nur als Informationsquelle." },
];
export function renderInstruments() {
  $("#instruments").innerHTML = INSTRUMENTS.map((x) => `<article class="instr">
    <header><h3>${esc(x.name)}</h3><span class="chip">${esc(x.tag)}</span></header>
    <p>${esc(x.what)}</p>
    <dl><dt>Chance</dt><dd>${esc(x.chance)}</dd><dt>Risiko</dt><dd>${esc(x.risk)}</dd><dt>Für wen</dt><dd>${esc(x.who)}</dd></dl>
    <div class="re-verdict lv-${x.verdict[0]}">${esc(x.verdict[1])}</div></article>`).join("");
}

// ---------- Insider-Käufe ----------
export function renderInsiders() {
  const ins = state.data.insiders?.buys || [];
  const usd = (x) => (x >= 1e6 ? fmt(x / 1e6, 1) + " Mio. $" : fmt(x / 1e3) + " Tsd. $");
  $("#insiders").innerHTML = ins.length ? ins.slice(0, 8).map((b) => `<article class="ins ${b.cluster ? "cluster" : ""}">
      <header><b>${esc(b.sym)}</b><span>${esc(b.name)}</span>${b.cluster ? '<span class="chip">mehrere Insider</span>' : ""}</header>
      <div class="ins-sum">${usd(b.total)} gekauft · zuletzt ${esc(b.last || "")}</div>
      <div class="fine">${b.buyers.slice(0, 3).map((x) => `${esc(x.who)} (${esc(x.role)})`).join(", ")}</div></article>`).join("")
    : '<div class="empty">In den letzten 30 Tagen keine Insider-Käufe in den beobachteten Aktien. Insider kaufen selten. Wenn sie es tun, ist es umso bemerkenswerter.</div>';
}

// ---------- Konjunktur-Frühwarnsystem ----------
export function renderMacro() {
  const m = state.data.macro || {};
  const f2 = (x) => (ok(x) ? x.toFixed(2).replace(".", ",") : "–");
  const tile = (k, title, val, unit, state2, expl) => `<div class="macro ${state2}"><span>${title}</span><b>${val}${unit}</b><em>${expl}</em>${m[k]?.series ? `<div class="mspark" data-k="${k}"></div>` : ""}<small>Stand ${esc(m[k]?.date || "–")} · FRED ${esc(m[k]?.id || "")}</small></div>`;
  const c = m.curve, h = m.hy, s2 = m.sahm;
  $("#macro").innerHTML = [
    tile("curve", "Zinskurve (10 J. minus 3 Mon.)", f2(c?.value), " Pp.", !c ? "" : c.value < 0 ? "bad" : c.min1y < 0 ? "warn" : "good", !c ? "" : c.value < 0 ? "Umgekehrt: historisches Rezessions-Warnsignal" : c.min1y < 0 ? "Wieder positiv nach Umkehr: aufmerksam bleiben" : "Normal: kein Warnsignal"),
    tile("hy", "Risikoaufschlag riskante Firmenanleihen", f2(h?.value), " Pp.", !h ? "" : h.value >= 5 || (ok(h.ago3m) && h.value - h.ago3m >= 1) ? "bad" : h.value < 3 ? "warn" : "good", !h ? "" : h.value >= 5 ? "Hoch: Kreditmärkte unter Stress" : ok(h.ago3m) && h.value - h.ago3m >= 1 ? "Steigt schnell: Profis werden nervös" : h.value < 3 ? "Sehr niedrig: viel Sorglosigkeit" : "Normal"),
    tile("sahm", "Sahm-Regel (Arbeitsmarkt)", f2(s2?.value), "", !s2 ? "" : s2.value >= 0.5 ? "bad" : s2.value >= 0.3 ? "warn" : "good", !s2 ? "" : s2.value >= 0.5 ? "Ausgelöst: Rezessionssignal" : s2.value >= 0.3 ? "Steigt: beobachten" : "Ruhig: kein Signal (Schwelle 0,5)"),
  ].join("");
  $$("#macro .mspark").forEach((el) => { const s3 = m[el.dataset.k].series; el.innerHTML = spark(s3, { w: 260, h: 34, color: "var(--s1)", label: "Verlauf 3 Jahre" }); });
}

// ---------- Mietspiegel-Finder & -Check ----------
const OFFICIAL = { "münchen": "https://www.mietspiegel-muenchen.de", "berlin": "https://www.stadtentwicklung.berlin.de/wohnen/mietspiegel/", "hamburg": "https://www.hamburg.de/mietspiegel/" };
const search = (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
export function renderMietspiegelLinks() {
  const city = ($("#msCity").value || "").trim();
  if (!city) { $("#msLinks").innerHTML = ""; return; }
  const direct = OFFICIAL[city.toLowerCase()];
  const links = [
    [direct || search(`Mietspiegel ${city} offiziell Stadt`), "Offizieller Mietspiegel", direct ? "direkt zur Stadt" : "Suche nach der offiziellen Seite"],
    [search(`Grundstücksmarktbericht Gutachterausschuss ${city}`), "Grundstücksmarktbericht", "amtliche Kaufpreise pro m² (Gutachterausschuss)"],
    ["https://www.bodenrichtwerte-boris.de", "Bodenrichtwerte (BORIS-D)", "amtlicher Grundstückswert, bundesweites Portal"],
    [search(`Zensus 2022 Nettokaltmiete ${city}`), "Zensus 2022: Mieten", "amtliche Durchschnittsmieten je Gemeinde"],
  ];
  $("#msLinks").innerHTML = links.map(([u, t, d]) => `<a class="ms-link" href="${safeUrl(u)}" target="_blank" rel="noopener"><b>${esc(t)} ↗</b><span>${esc(d)}</span></a>`).join("");
}
export function calcMietspiegel() {
  const f = $("#msForm"); if (!f) return;
  const area = +f.area.value || 0, rent = +f.rent.value || 0, ref = +f.ref.value || 0, brake = f.brake.checked;
  if (!area || !ref) { $("#msOut").innerHTML = ""; return; }
  const perM2 = rent / area, max = ref * (brake ? 1.1 : 1) * area, diff = rent - max;
  const verdict = diff <= 0 ? ["g", brake ? "Im Rahmen: Die Miete liegt höchstens 10 % über der ortsüblichen Vergleichsmiete." : "Die Miete liegt nicht über der ortsüblichen Vergleichsmiete."]
    : brake ? ["r", `Wahrscheinlich zu hoch: ${fmt(diff)} € pro Monat über der Grenze der Mietpreisbremse. Ausnahmen gibt es z. B. für Neubau ab Oktober 2014, nach umfassender Modernisierung oder wenn schon die Vormiete höher war.`]
    : ["y", `Die Miete liegt ${fmt(diff)} € über der ortsüblichen Vergleichsmiete. Ohne Mietpreisbremse ist das erlaubt, aber spätere Erhöhungen sind begrenzt.`];
  $("#msOut").innerHTML = `<div class="proj-kpis"><div><span>Verlangt pro m²</span><b>${fmt(perM2, 2)} €</b></div><div><span>Mietspiegel pro m²</span><b>${fmt(ref, 2)} €</b></div><div><span>Abweichung</span><b class="${perM2 > ref ? "down" : "up"}">${pct(perM2 / ref - 1, 0)}</b></div><div class="hl"><span>${brake ? "Höchstmiete (Bremse)" : "Vergleichsmiete"}</span><b>${fmt(max)} €</b></div></div>
    <div class="re-verdict lv-${verdict[0]}">${esc(verdict[1])}</div>
    <p class="fine">Für Vermieter und Käufer: Mieterhöhungen sind auf 20 % in 3 Jahren begrenzt, in vielen Städten auf 15 % (Kappungsgrenze), und nie über die ortsübliche Vergleichsmiete hinaus. Rechne beim Kauf mit der erlaubten Miete, nicht mit der Wunschmiete. Allgemeine Information, keine Rechtsberatung. Bei Streit hilft der Mieterverein bzw. Haus &amp; Grund.</p>`;
}
export function initMietspiegel() {
  if (!$("#msForm")) return;
  $("#msCity").addEventListener("input", renderMietspiegelLinks);
  $("#msForm").addEventListener("input", calcMietspiegel);
  $("#msForm").addEventListener("submit", (e) => e.preventDefault());
  renderMietspiegelLinks(); calcMietspiegel();
}

// ---------- Stimmungs-Barometer (alle Stimmungsquellen in einer Zahl) ----------
export function moodScore(d) {
  const parts = [];
  if (ok(d.cnnFearGreed?.value)) parts.push(["Aktien (CNN Fear & Greed)", d.cnnFearGreed.value, 0.3]);
  if (ok(d.fearGreed?.value)) parts.push(["Krypto (Fear & Greed)", d.fearGreed.value, 0.15]);
  const v = d.voices; if (v && v.bull + v.bear >= 5) parts.push(["Ton der Analysten", Math.round((v.bull / (v.bull + v.bear)) * 100), 0.2]);
  const hy = d.macro?.hy?.value; if (ok(hy)) parts.push(["Kreditmärkte (Risikoaufschlag)", Math.round(Math.max(0, Math.min(100, ((7 - hy) / 4.5) * 100))), 0.2]);
  const vix = d.risk?.vix; if (ok(vix) && vix < 90) parts.push(["Angstbarometer VIX", Math.round(Math.max(0, Math.min(100, ((35 - vix) / 23) * 100))), 0.15]);
  const w = parts.reduce((s2, p) => s2 + p[2], 0);
  return w ? { score: Math.round(parts.reduce((s2, p) => s2 + p[1] * p[2], 0) / w), parts } : null;
}
export function renderMood() {
  const m = moodScore(state.data);
  if (!m) { $("#mood").innerHTML = ""; return; }
  const s3 = m.score;
  const [label, cls, meaning] = s3 < 25 ? ["Extreme Angst", "fear", "Viele verkaufen aus Panik. Historisch oft eine gute Zeit für Sparer, die einfach weitermachen."]
    : s3 < 45 ? ["Angst", "fear", "Vorsichtige Stimmung. Kein Grund, den Plan zu ändern. Nachkäufe sind oft günstig."]
    : s3 <= 55 ? ["Neutral", "neutral", "Weder Gier noch Panik: normales Börsenwetter."]
    : s3 <= 75 ? ["Gier", "greed", "Optimismus überwiegt. Nicht vom Schwung mitreißen lassen, keine Hype-Käufe."]
    : ["Extreme Gier", "greed", "Fast alle sind euphorisch. Historisch fallen die Renditen danach oft schwächer aus. Jetzt besonders diszipliniert bleiben."];
  $("#mood").innerHTML = `<div class="mood-head"><div class="mood-num">${s3}</div><div><b class="mood-${cls}">${label}</b><p>${esc(meaning)}</p></div></div>
    <div class="mood-bar" aria-hidden="true"><i style="left:${s3}%"></i></div><div class="mood-scale"><span>Panik</span><span>Gier</span></div>
    <ul class="mood-parts pro-only">${m.parts.map(([n, v]) => `<li><span>${esc(n)}</span><b>${v}</b></li>`).join("")}</ul>`;
}

// ---------- Rohstoff-Monitor ----------
const posWord = (p) => (!ok(p) ? "" : p < 0.2 ? "nahe Jahrestief" : p > 0.8 ? "nahe Jahreshoch" : p < 0.4 ? "eher unten" : p > 0.6 ? "eher oben" : "Mitte");
export function renderCommodities() {
  const list = (state.data.commodities || []).filter((c) => !c.missing);
  if (!list.length) { $("#commodities").innerHTML = '<div class="empty">Noch keine Rohstoff-Daten.</div>'; return; }
  const groups = [...new Set(list.map((c) => c.group))];
  $("#commodities").innerHTML = `<div class="tscroll"><table class="tick-table com-table"><thead><tr><th>Rohstoff</th><th>Preis</th><th>1 Woche</th><th>1 Monat</th><th>1 Jahr</th><th>Lage im 52-Wochen-Bereich</th><th class="pro-only">Schwankung</th></tr></thead><tbody>
    ${groups.map((g) => `<tr class="grp"><td colspan="7">${esc(g)}</td></tr>` + list.filter((c) => c.group === g).map((c) => `<tr>
      <td><b>${esc(c.name)}</b><div class="fine">${esc(c.unit)}</div></td>
      <td>${fmt(c.last, c.last < 20 ? 2 : c.last < 1000 ? 1 : 0)}</td>
      <td class="${dirCls(c.chg1w)}">${pct(c.chg1w, 1)}</td><td class="${dirCls(c.chg1m)}">${pct(c.chg1m, 0)}</td><td class="${dirCls(c.chg1y)}">${pct(c.chg1y, 0)}</td>
      <td><div class="range" title="Tief ${fmt(c.low52, 2)} · Hoch ${fmt(c.high52, 2)}"><i style="left:${Math.round((c.pos52 ?? 0.5) * 100)}%"></i></div><span class="fine">${posWord(c.pos52)}</span></td>
      <td class="pro-only">±${fmt((c.vol || 0) * 100)} %</td></tr>`).join("")).join("")}
    </tbody></table></div>`;
}
export function commodityShareText(d, url) {
  const list = (d.commodities || []).filter((c) => !c.missing && ok(c.chg1m));
  const movers = [...list].sort((a, b) => Math.abs(b.chg1m) - Math.abs(a.chg1m)).slice(0, 5);
  const low = list.filter((c) => c.pos52 < 0.2).map((c) => c.name), high = list.filter((c) => c.pos52 > 0.8).map((c) => c.name);
  return `🛢️ *Rohstoff-Lage* · ${new Date(d.generatedAt).toLocaleDateString("de-DE")}\n\n*Größte Bewegungen (1 Monat):*\n${movers.map((c) => `• ${c.name}: ${pct(c.chg1m, 0)}`).join("\n")}\n\n${low.length ? `📉 *Nahe Jahrestief:* ${low.join(", ")}\n` : ""}${high.length ? `📈 *Nahe Jahreshoch:* ${high.join(", ")}\n` : ""}\n👉 ${url}#maerkte\n_Keine Anlage- oder Einkaufsberatung._`;
}
