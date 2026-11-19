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
