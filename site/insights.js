// Nachrichten-Wirkung, Forschung, Immobilien (+ Rechner), Quellen-Übersicht, Einsteiger/Profi-Modus.
import { $, $$, esc, fmt, pct, ok, ago, safeUrl, state, store, lineChart, dirCls, arrow, spark, limitList, moreBtn } from "./ui.js";

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
    <header><span class="ev-ico" aria-hidden="true">${esc(e.icon)}</span><div><h3>${esc(e.name)}</h3>
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
  ["Extreme Kursrallyes bergen Crash-Gefahr", "Branchen, die in zwei Jahren um mehr als 100 % gestiegen sind, hatten danach ein deutlich erhöhtes Absturzrisiko.", "Greenwood, Shleifer & You, „Bubbles for Fama“ (2019)", "Das Radar warnt bei steilen Anstiegen vor einem Neueinstieg. Ehrlicher Hinweis: Die Schwelle des Radars ist vorsichtiger als in der Studie, die erst ab +100 % in zwei Jahren misst."],
  ["Trends halten oft eine Weile", "Was in den letzten 3–12 Monaten gestiegen ist, steigt im Schnitt noch etwas weiter (Momentum-Effekt), mit gelegentlichen heftigen Umschwüngen.", "Jegadeesh & Titman (1993); Daniel & Moskowitz, „Momentum Crashes“ (2016)", "Die Hype-Karte nutzt den Kurs-Trend, kombiniert mit einer Überhitzungs-Bremse."],
  ["Euphorie trifft vor allem spekulative Aktien", "Nach Phasen hoher Anlegerstimmung entwickelten sich vor allem junge, kleine, unprofitable und stark schwankende Aktien schwächer als solide Firmen. Für den Gesamtmarkt ist der Zeitpunkt kaum vorhersagbar.", "Baker & Wurgler, „Investor Sentiment and the Cross-Section of Stock Returns“, Journal of Finance (2006)", "Deshalb warnt das Radar bei Euphorie vor Hype-Themen und Einzelwetten, aber nie davor, den Sparplan fortzuführen."],
  ["Hype-Börsengänge laufen langfristig schwach", "Neue Aktien entwickeln sich in den ersten Jahren nach dem Börsengang im Schnitt schlechter als vergleichbare Firmen.", "Ritter, „The Long-Run Performance of IPOs“ (1991)", "Das IPO-Radar rät: bei Hype-IPOs nicht am ersten Tag kaufen."],
  ["Einmal anlegen schlägt meist Raten", "Historisch brachte das sofortige Anlegen eines Betrags in etwa 2 von 3 Fällen mehr als das Verteilen über Monate. Raten sind eine Versicherung gegen schlechtes Timing und gegen Reue.", "Vanguard, „Dollar-cost averaging just means taking risk later“ (2012)", "Das Radar nutzt deshalb überall dieselbe Regel: sofort anlegen, außer ein Rückgang direkt nach dem Kauf würde dich zum Verkaufen bringen."],
];
export function renderResearch() {
  $("#principles").innerHTML = PRINCIPLES.map(([t, what, src, use], i) => `<article class="principle"><div class="pnum">${i + 1}</div><div><h3>${esc(t)}</h3><p>${esc(what)}</p><p class="fine">Quelle: ${esc(src)}</p><p class="use">So nutzt es das Radar: ${esc(use)}</p></div></article>`).join("");
  const d = state.data || {}, P = d.papers || {};
  const paper = (p, key, i) => `<button type="button" class="paper" data-detail="${key}"><span class="rank">${i + 1}</span><span><b>${esc(p.de || p.title)}</b>${p.de ? `<span class="fine">Original: ${esc(p.title)}</span>` : ""}
    <span class="fine">${esc(typeof p.journal === "string" ? p.journal : p.source || "")} · ${p.date ? esc(p.date) : ago(p.published)}${ok(p.cites) ? ` · <b>${fmt(p.cites)}× zitiert</b>` : ""}${p.oa ? " · kostenlos lesbar" : ""}</span></span></button>`;
  const list = (arr, key, n, empty) => arr?.length ? `<div class="paper-list">${limitList(key, arr, n).map((p, i) => paper(p, `${key}:${i}`, i)).join("")}</div>${moreBtn(key, arr.length, n, "Studien")}` : `<div class="empty">${empty}</div>`;
  const wp = (d.research || []).map((p, i) => ({ ...p, i })).filter((p) => !(p.journal && P.recent?.length)); // journal RSS items are already in the peer-reviewed lists
  $("#papers").innerHTML = `
    <div class="paper-col"><h3>🏆 Meistzitiert aus Top-Journals (24 Monate)</h3><p class="fine">Begutachtet, sortiert danach, wie oft andere Forscher darauf aufbauen.</p>${list(P.top, "paper:top", 6, "Gerade nicht abrufbar.")}</div>
    <div class="paper-col"><h3>🆕 Neu in Top-Journals</h3><p class="fine">Frisch erschienen, ebenfalls begutachtet.</p>${list(P.recent, "paper:recent", 6, "Gerade nicht abrufbar.")}</div>
    <div class="paper-col"><h3>⚡ Ganz frische Arbeitspapiere</h3><p class="fine">NBER, EZB, BIZ, US-Notenbank, arXiv: am schnellsten, aber noch ungeprüft.</p>${wp.length ? `<div class="paper-list">${limitList("study", wp, 6).map((p, i) => paper(p, `study:${p.i}`, i)).join("")}</div>${moreBtn("study", wp.length, 6, "Studien")}` : '<div class="empty">Gerade keine neuen Studien abrufbar.</div>'}</div>
    <p class="fine">Quelle der Journal-Listen: OpenAlex (offener Katalog mit rund 250 Mio. wissenschaftlichen Arbeiten). Top-Journals: Journal of Finance, Journal of Financial Economics, Review of Financial Studies, JFQA, Review of Finance, AER, QJE, Econometrica, JPE, Review of Economic Studies, Management Science, Journal of Monetary Economics.</p>`;
}

// ---------- Kennzahlen-Katalog: wie jede Zahl entsteht ----------
// [name, what it shows, how it is computed, research basis, evidence 0–3, limits]
export const KPIS = [
  ["Momentum (Hype-Karte)", "Wie stark ein Thema im Trend liegt.", "75 % Rendite von vor 12 bis vor 1 Monat (die Standard-Messung der Forschung) + 25 % letzter Monat. Solange weniger als ein Jahr Kurse vorliegen: 3 Monate statt 12-1.", "Jegadeesh & Titman, Journal of Finance 1993; für Branchen Moskowitz & Grinblatt, Journal of Finance 1999", 3, "Trends können abrupt drehen (Daniel & Moskowitz, Journal of Financial Economics 2016)."],
  ["Überhitzung", "Wie nah ein Thema an einer Übertreibung ist.", "70 % Kursanstieg der letzten zwei Jahre (100 = verdoppelt) + 30 % Abstand zur 200-Tage-Linie. „Überhitzt“ heißt nur: verdoppelt in zwei Jahren.", "Greenwood, Shleifer & You, Journal of Financial Economics 2019", 2, "Nach Verdopplungen steigt vor allem das Absturzrisiko. Dass die Renditen danach verlässlich schlechter sind, zeigt die Studie nicht."],
  ["Hype", "Wie viel über ein Thema geredet wird.", "Wikipedia-Aufrufe der letzten 7 Tage im Vergleich zur eigenen Geschichte (robust gemessen mit Median), Veränderung zum Vormonat, Tempo der Nachrichten (48 Stunden gegenüber den 5 Tagen davor), Erwähnungen auf Hacker News.", "Aufmerksamkeit: Da, Engelberg & Gao, Journal of Finance 2011; Barber & Odean, Review of Financial Studies 2008", 2, "Wikipedia-Aufrufe sind ein Ersatz für Suchanfragen. Die Gewichte sind selbst gewählt."],
  ["Blasen-Meter", "Wie viele Zeichen von Überschwang gleichzeitig auftreten.", "Nasdaq 100 und Nvidia über ihrer 200-Tage-Linie, 3-Monats-Lauf spekulativer Tech-Aktien (ARKK), niedriger VIX, IPO-Fieber.", "Verwandt: Greenwood, Shleifer & You 2019; Börsengänge als Stimmungszeichen bei Baker & Wurgler, Journal of Finance 2006", 1, "Eigenes Messgerät, kein veröffentlichtes Maß, ohne Bewertungskennzahl und noch ohne geprüfte Trefferquote."],
  ["Markt-Ampel", "Normal, aufmerksam oder Vorsicht.", "Euphorie = Blasen-Meter. Stress = VIX (50 %), Anteil von rund 55 großen Aktien über ihrer 200-Tage-Linie (30 %), CNN Fear & Greed umgekehrt (20 %). Rot ab Euphorie 75 oder Stress 70.", "Keine direkte Studie; Bestandteile siehe oben", 1, "Schwellen sind gesetzt, nicht geschätzt. Geplant: Stress durch den Finanzstress-Index der US-Notenbank ersetzen."],
  ["Stimmungs-Barometer", "Angst oder Gier, schnell und täglich.", "CNN Fear & Greed 60 %, Krypto Fear & Greed 20 %, Ton der Analysten-Schlagzeilen 20 %. VIX und Kreditaufschlag nur, wenn CNN fehlt (CNN enthält beide schon).", "Stimmung und Renditen: Baker & Wurgler 2006 (vor allem welche Aktien leiden, nicht wann)", 1, "Mischung aus nicht-wissenschaftlichen Indizes. Für Zeitpunkte am Gesamtmarkt kaum brauchbar."],
  ["Offizielle Stimmung", "Amtlich gemessene Stimmung von Firmen und Verbrauchern, Stress am Anleihemarkt.", "Unverändert übernommen: EU-Wirtschaftsstimmung und Verbrauchervertrauen (Eurostat), US-Verbraucherstimmung als Rang in der eigenen Geschichte, Excess Bond Premium der US-Notenbank.", "Lemmon & Portniaguina, Review of Financial Studies 2006; Gilchrist & Zakrajšek, American Economic Review 2012", 2, "Monatlich, also langsam. Für Konjunktur gut belegt, für Aktienrenditen schwach."],
  ["Konjunktur-Warnsystem", "Wie wahrscheinlich eine Rezession wird.", "Zinskurve 10 Jahre minus 3 Monate (USA), Risikoaufschlag für Hochzinsanleihen, Sahm-Regel.", "Estrella & Mishkin, Review of Economics and Statistics 1998; Gilchrist & Zakrajšek 2012; López-Salido, Stein & Zakrajšek, Quarterly Journal of Economics 2017", 3, "Wenige Rezessionen, also wenige Testfälle. Fehlalarme kommen vor (Zinskurve 2022–24). Die Sahm-Regel meldet den Beginn einer Rezession, nicht Wochen davor. Nur US-Daten."],
  ["Risikoklasse 1–7", "Wie stark etwas schwankt.", "Jährliche Schwankung der letzten zwei Jahre, eingeordnet in die Grenzen der EU-Regel für Basisinformationsblätter (PRIIPs): 0,5 / 5 / 12 / 20 / 30 / 80 %.", "EU-Verordnung PRIIPs (Delegierte Verordnung 2017/653)", 0, "Vereinfacht: zwei statt fünf Jahre, ohne Kreditrisiko. Kann daher vom offiziellen Blatt abweichen."],
  ["Insider-Käufe", "Ob Firmen-Insider mit eigenem Geld kaufen.", "Meldungen an die US-Börsenaufsicht (Form 4) der letzten 30 Tage, nur echte Käufe (Code P). „Mehrere Insider“ ab zwei verschiedenen Personen.", "Lakonishok & Lee, Review of Financial Studies 2001; Cohen, Malloy & Pomorski, Journal of Finance 2012", 2, "Am stärksten bei kleinen Firmen, das Radar beobachtet große. Routine-Käufe werden noch nicht von ungewöhnlichen getrennt."],
  ["Konsens der Top-Investoren", "Was mehrere bekannte Investoren gleichzeitig kaufen.", "Mindestens 2 von 12 Investoren haben eine Aktie neu gekauft oder um über 10 % aufgestockt. Aktiensplits herausgerechnet, Index-Fonds ausgenommen.", "Kein belastbarer Beleg für das Nachbilden; Auswahl der Investoren nach heutigem Ruhm (Überlebens-Verzerrung)", 1, "Positionen bis zu 4,5 Monate alt. Leerverkäufe und Optionen fehlen."],
  ["Aktien-Ideen-Score", "Welche bekannten Aktien sich die eigene Recherche lohnen könnte.", "Kursziel-Abstand laut Analysten (35 %), Stärke gegenüber dem Markt (25 %), Trend ohne Überhitzung (20 %), erwartetes KGV (20 %).", "Analysten-Kursziele treffen selten: Bradshaw, Brown & Huang, Review of Accounting Studies 2013", 1, "Kein Faktor-Modell. Gewinnqualität und Gewinn-Revisionen fehlen noch."],
  ["Plan-Prognose", "Was aus deinem Geld werden könnte.", "2.000 Zufalls-Szenarien mit langfristigen Durchschnittsrenditen und -schwankungen je Baustein, nach 0,2 % Kosten pro Jahr; Steuer am Ende grob geschätzt.", "Langfristige Renditen: Dimson, Marsh & Staunton (Global Investment Returns Yearbook)", 2, "Normalverteilte Renditen ohne extreme Ausreißer, feste Zusammenhänge zwischen den Bausteinen, keine Bewertung (CAPE) berücksichtigt."],
];
export function renderKpis() {
  const el = $("#kpiList"); if (!el) return;
  const LV = ["reine Regel", "schwach belegt", "mittel belegt", "stark belegt"], CL = ["ev0", "ev1", "ev2", "ev3"];
  el.innerHTML = KPIS.map(([n, what, how, src, lv, lim]) => `<details class="kpi-item"><summary><b>${esc(n)}</b><span class="ev ${CL[lv]}">${"●".repeat(lv)}${"○".repeat(3 - lv)} ${LV[lv]}</span><span class="fine">${esc(what)}</span></summary>
    <dl><dt>So wird gerechnet</dt><dd>${esc(how)}</dd><dt>Forschung dahinter</dt><dd>${esc(src)}</dd><dt>Grenzen</dt><dd>${esc(lim)}</dd></dl></details>`).join("");
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
  ["Forschung", "OpenAlex (12 Top-Journals: JF, JFE, RFS, AER, QJE, Econometrica u. a.), NBER, EZB, BIZ, US-Notenbank, arXiv", "Begutachtete Studien mit Zitierzahl und DOI, dazu frische Arbeitspapiere"],
  ["KI-Trends", "GitHub, Hugging Face, PyPI, npm", "Was Entwickler gerade nutzen und einbauen"],
  ["Krypto-Geldfluss", "DefiLlama", "Stablecoins, Kapital in DeFi-Anwendungen"],
  ["Strompreis", "Energy-Charts (Fraunhofer ISE)", "Börsenstrompreis Deutschland"],
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
    <div class="rate"><span>Bauzins Deutschland (Durchschnitt)</span><b>${m ? fmt(m.rate * 100, 2) + " %" : "–"}</b>${m && ok(m.yearAgo) ? `<em class="${dirCls(-(m.rate - m.yearAgo))}">${m.rate >= m.yearAgo ? "▲" : "▼"} vor 1 Jahr ${fmt(m.yearAgo * 100, 2)} %</em>` : ""}<small>Stand ${esc(per(m?.period))}, EZB</small></div>
    <div class="rate"><span>Hauspreise Deutschland zum Vorjahr</span><b class="${dirCls(h?.yoy)}">${h ? pct(h.yoy, 1) : "–"}</b><small>Stand ${esc(per(h?.period))}, Eurostat</small></div>
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
  $("#insiders").innerHTML = ins.length ? limitList("ins", ins, 8).map((b) => `<article class="ins ${b.cluster ? "cluster" : ""}">
      <header><b>${esc(b.sym)}</b><span>${esc(b.name)}</span>${b.cluster ? '<span class="chip">mehrere Insider</span>' : ""}</header>
      <div class="ins-sum">${usd(b.total)} gekauft · zuletzt ${esc(b.last || "")}</div>
      <div class="fine">${b.buyers.slice(0, 3).map((x) => `${esc(x.who)} (${esc(x.role)})`).join(", ")}</div></article>`).join("") + moreBtn("ins", ins.length, 8, "Insider-Käufe")
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
import { MIETSPIEGEL, CHECKED } from "./mietspiegel.js";
const search = (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
export function renderMietspiegelLinks() {
  const city = ($("#msCity").value || "").trim();
  if (!city) { $("#msLinks").innerHTML = ""; return; }
  const ms = MIETSPIEGEL[city.toLowerCase()];
  const direct = ms?.url;
  const links = [
    [direct || search(`Mietspiegel ${city} offiziell Stadt`), ms?.calc ? "Mietspiegel-Rechner der Stadt" : "Offizieller Mietspiegel", direct ? `${ms.ed} · ${ms.pub}` : ms?.note || "Suche nach der offiziellen Seite"],
    [search(`Grundstücksmarktbericht Gutachterausschuss ${city}`), "Grundstücksmarktbericht", "amtliche Kaufpreise pro m² (Gutachterausschuss)"],
    ["https://www.bodenrichtwerte-boris.de", "Bodenrichtwerte (BORIS-D)", "amtlicher Grundstückswert, bundesweites Portal"],
    [search(`Zensus 2022 Nettokaltmiete ${city}`), "Zensus 2022: Mieten", "amtliche Durchschnittsmieten je Gemeinde"],
  ];
  $("#msLinks").innerHTML = links.map(([u, t, d]) => `<a class="ms-link" href="${safeUrl(u)}" target="_blank" rel="noopener"><b>${esc(t)} ↗</b><span>${esc(d)}</span></a>`).join("")
    + (ms ? `<div class="ms-info"><b>Diese Angaben verlangt der Mietspiegel in ${esc(city)}:</b> ${ms.inputs.map(esc).join(" · ")}${ms.calc ? "" : ". Kein Online-Rechner: Wert aus der PDF-Tabelle ablesen."}<span class="fine">Quelle recherchiert im ${CHECKED}. Neue Ausgaben ändern Adressen gelegentlich.</span></div>` : "");
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
  // CNN Fear & Greed already contains VIX and junk-bond demand, so those count only when CNN is missing (no double counting)
  const parts = [];
  const cnn = d.cnnFearGreed?.value;
  if (ok(cnn)) parts.push(["Aktien (CNN Fear & Greed, enthält VIX und Hochzins-Nachfrage)", cnn, 0.6]);
  else {
    const hy = d.macro?.hy?.value; if (ok(hy)) parts.push(["Kreditmärkte (Risikoaufschlag)", Math.round(Math.max(0, Math.min(100, ((7 - hy) / 4.5) * 100))), 0.3]);
    const vix = d.risk?.vix; if (ok(vix) && vix < 90) parts.push(["Angstbarometer VIX", Math.round(Math.max(0, Math.min(100, ((35 - vix) / 23) * 100))), 0.3]);
  }
  if (ok(d.fearGreed?.value)) parts.push(["Krypto (Fear & Greed)", d.fearGreed.value, 0.2]);
  const v = d.voices; if (v && v.bull + v.bear >= 5) parts.push(["Ton der Analysten-Schlagzeilen", Math.round((v.bull / (v.bull + v.bear)) * 100), 0.2]);
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

// ---------- Official sentiment measures (surveys + credit-market stress) ----------
export function renderOfficialMood() {
  const S = state.data.sentiment; const el = $("#officialMood"); if (!el) return;
  if (!S) { el.innerHTML = '<div class="empty">Offizielle Stimmungsdaten gerade nicht abrufbar.</div>'; return; }
  const f1 = (x) => (ok(x) ? fmt(x, 1) : "–");
  const delta = (a, b) => (ok(a) && ok(b) ? `<span class="${a >= b ? "up" : "down"}">${a >= b ? "▲" : "▼"} vor 1 Jahr ${f1(b)}</span>` : "");
  const tile = (title, val, verdict, cls, expl, src, sp) => `<div class="om ${cls}"><span class="om-t">${title}</span><b>${val}</b><span class="om-v">${verdict}</span>${sp ? spark(sp, { w: 120, h: 24, color: "var(--s1)", label: title }) : ""}<p>${expl}</p><p class="fine">${src}</p></div>`;
  const esiWord = (v) => (!ok(v) ? "" : v >= 105 ? "deutlich besser als üblich" : v >= 100 ? "etwas besser als üblich" : v >= 95 ? "etwas schlechter als üblich" : "deutlich schlechter als üblich");
  const t = [];
  if (S.esiDE) t.push(tile("Wirtschaftsstimmung Deutschland", f1(S.esiDE.value), `${esiWord(S.esiDE.value)} ${delta(S.esiDE.value, S.esiDE.ago1y)}`, S.esiDE.value >= 100 ? "good" : "warn",
    "Monatliche Umfrage der EU-Kommission bei Firmen und Verbrauchern. 100 = langjähriger Durchschnitt, 90 oder 110 = ungewöhnlich schlecht oder gut.", `EU-Kommission über Eurostat · Stand ${esc(S.esiDE.period)}`, S.esiDE.series));
  if (S.esiEA) t.push(tile("Wirtschaftsstimmung Euroraum", f1(S.esiEA.value), `${esiWord(S.esiEA.value)} ${delta(S.esiEA.value, S.esiEA.ago1y)}`, S.esiEA.value >= 100 ? "good" : "warn",
    "Dieselbe Umfrage für alle Euro-Länder.", `EU-Kommission über Eurostat · Stand ${esc(S.esiEA.period)}`, S.esiEA.series));
  if (S.consDE) t.push(tile("Verbrauchervertrauen Deutschland", f1(S.consDE.value), delta(S.consDE.value, S.consDE.ago1y), S.consDE.value >= (S.consDE.ago1y ?? S.consDE.value) ? "good" : "warn",
    "Saldo aus optimistischen minus pessimistischen Antworten der Haushalte. Unter null heißt: mehr Pessimisten. Wichtig ist die Richtung.", `EU-Kommission über Eurostat · Stand ${esc(S.consDE.period)}`, S.consDE.series));
  if (S.umich) t.push(tile("US-Verbraucherstimmung", f1(S.umich.value), `niedriger als in ${100 - S.umich.pct} % aller Monate seit ${esc(S.umich.since)}`, S.umich.pct < 25 ? "warn" : "good",
    "Der älteste Stimmungsindex der Welt. Forschung: Sehr niedrige Verbraucherstimmung ging kleinen Aktien vor besseren Renditen voraus, sehr hohe vor schwächeren (Lemmon &amp; Portniaguina, Review of Financial Studies 2006).", `Universität Michigan über FRED · Stand ${esc(S.umich.date)}`, S.umich.series));
  if (S.ebp) t.push(tile("Stress am Anleihemarkt (Excess Bond Premium)", `${S.ebp.value > 0 ? "+" : ""}${fmt(S.ebp.value, 2)}`, S.ebp.value > 0.5 ? "deutlich erhöht: Anleger meiden Risiko" : S.ebp.value > 0 ? "leicht erhöht" : "entspannt", S.ebp.value > 0.5 ? "bad" : S.ebp.value > 0 ? "warn" : "good",
    `Der Teil der Risikoaufschläge von Firmenanleihen, der nicht durch Ausfallrisiko erklärt ist, also reine Risikoscheu. Steigt er, folgten oft schwächere Konjunktur und Börse (Gilchrist &amp; Zakrajšek, American Economic Review 2012).${ok(S.ebp.prob) ? ` Rezessions-Wahrscheinlichkeit der nächsten 12 Monate laut diesem Modell: <b>${fmt(S.ebp.prob * 100)} %</b>.` : ""}`, `US-Notenbank (Federal Reserve) · Stand ${esc(S.ebp.date)}`, S.ebp.series));
  el.innerHTML = t.join("");
}

// ---------- Rohstoff-Monitor ----------
const posWord = (p) => (!ok(p) ? "" : p < 0.2 ? "nahe Jahrestief" : p > 0.8 ? "nahe Jahreshoch" : p < 0.4 ? "eher unten" : p > 0.6 ? "eher oben" : "Mitte");
export function renderCommodities() {
  const list = (state.data.commodities || []).filter((c) => !c.missing);
  if (!list.length) { $("#commodities").innerHTML = '<div class="empty">Noch keine Rohstoff-Daten.</div>'; return; }
  const groups = [...new Set(list.map((c) => c.group))];
  $("#commodities").innerHTML = `<div class="tscroll"><table class="tick-table com-table"><thead><tr><th>Rohstoff</th><th>Preis</th><th>1 Woche</th><th>1 Monat</th><th>1 Jahr</th><th>Lage im 52-Wochen-Bereich</th><th class="pro-only">Schwankung</th></tr></thead><tbody>
    ${groups.map((g) => `<tr class="grp"><td colspan="7">${esc(g)}</td></tr>` + list.filter((c) => c.group === g).map((c) => `<tr class="clickable" tabindex="0" data-detail="com:${esc(c.id)}">
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
