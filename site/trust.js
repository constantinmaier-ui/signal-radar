// Vertrauen & Persönliches: Quellen/Beweislage je Bereich, Anpassen, eigene KI, Trend-Radar,
// Was nachweislich Geld vermehrt (Kosten-Rechner), Finanz-Fitness-Check & Quiz.
import { cleanSituation } from "./situation.js";
import { validRef } from "./holdings.js";
import { $, $$, esc, fmt, pct, ok, ago, safeUrl, state, store, toast, spark, compact, limitList, moreBtn, cleanTopics } from "./ui.js";
import { LEX } from "./extras.js";
import { hypeInfo } from "./signals.js";

// ---------- Quellen & Beweislage je Bereich ----------
// level: 3 = stark belegt, 2 = mittel, 1 = schwach, 0 = reine Fakten/Daten (keine Prognose)
const META = {
  check: [2, "Eigene Regeln, gespeist aus allen Quellen dieser Seite", "Die Regeln folgen belegten Mustern. Eine Prognose sind sie nicht."],
  signals: [2, "Signal-Leser über alle Quellen", "Jedes Signal nennt seine Quelle. Die Beweislage unterscheidet sich je Signal."],
  themen: [2, "Themen-ETFs, Wikipedia-Aufrufe, Nachrichten", "Branchen-Momentum ist gut belegt (Moskowitz & Grinblatt 1999). Die Hype-Bremse folgt Barber & Odean (2008)."],
  newsImpact: [2, "28 Nachrichtenportale + Google News; Wirkung aus Studien je Ereignis-Art", "Die typischen Wirkungen sind historische Durchschnitte, im Einzelfall kann es anders laufen."],
  lage: [1, "Yahoo Finance, GDELT", "Eigenes Messgerät, kein veröffentlichtes Maß, und noch ohne geprüfte Trefferquote. Verwandte Forschung: Kursverdopplungen in zwei Jahren erhöhen das Absturzrisiko, ohne dass danach die Renditen verlässlich schlechter sind (Greenwood, Shleifer & You 2019)."],
  plan: [3, "Langfristige Durchschnittsrenditen, 2.000 Simulationen", "Breit streuen und niedrige Kosten sind die am besten belegten Regeln der Finanzforschung."],
  hebel: [3, "Morningstar „Mind the Gap“, Zinseszins-Rechnung", "Kosten, Sparrate und Durchhalten sind nachweislich die größten Hebel."],
  frueh: [2, "FRED (US-Notenbank St. Louis)", "Gut erforscht, aber es gab nur wenige Rezessionen. Fehlalarme kommen vor."],
  anlagen: [0, "Yahoo Finance, Stooq, EZB", "Fakten und Kennzahlen, keine Prognose."],
  rohstoffe: [0, "Terminbörsen über Yahoo Finance; Prognosen: Weltbank, IWF, EIA, USDA", "Fakten. Rohstoffpreise sind kurzfristig kaum vorhersagbar."],
  immobilien: [0, "EZB, Eurostat, amtliche Mietspiegel", "Fakten und Faustregeln, keine Bewertung im Einzelfall."],
  offiziell: [2, "EU-Kommission (Eurostat), Universität Michigan (FRED), US-Notenbank", "Amtliche Umfragen mit jahrzehntelanger Historie. Gut belegt für die Konjunktur. Für Aktienrenditen sind die Effekte klein und zeigen sich vor allem bei Extremen (Lemmon & Portniaguina 2006). Das Anleihe-Stressmaß sagt Konjunktur und Rezessionen gut voraus (Gilchrist & Zakrajšek 2012)."],
  stimmung: [1, "CNN Fear & Greed, alternative.me, Analysten-Ton, FRED, VIX, Polymarket", "Eigene Mischung, kein wissenschaftliches Maß. Forschung zur Stimmung zeigt vor allem, WELCHE Aktien nach Euphorie schwächer laufen (junge, kleine, spekulative), nicht WANN der Gesamtmarkt dreht (Baker & Wurgler 2006)."],
  trends: [2, "Kurse, Wikipedia-Aufrufe, GitHub, Hugging Face, PyPI, npm, DefiLlama, Energy-Charts", "Kurs-Trends über 3–12 Monate sind gut belegt (Momentum). Kurzfristige Ausschläge drehen oft wieder."],
  karte: [2, "Wikipedia-Aufrufe, Nachrichten, Hacker News, Themen-ETFs", "Momentum ist stark belegt. Viel Aufmerksamkeit geht eher schwächeren Renditen voraus (Barber & Odean 2008)."],
  perlen: [1, "Yahoo-Finance-Analystenkonsens, Kurse", "Analysten-Kursziele treffen selten (Bradshaw, Brown & Huang 2013). Ideen zum Prüfen, mehr nicht."],
  ipo: [2, "Nachrichten, Wikipedia, Polymarket", "Hype-Börsengänge laufen langfristig im Schnitt schwächer (Ritter 1991)."],
  profis: [2, "US-Börsenaufsicht SEC (13F, Form 4), Yahoo-Konsens, Nachrichten", "Insider-Käufe gingen im Schnitt besseren Kursen voraus, am stärksten bei kleinen Firmen (Lakonishok & Lee 2001). Am aussagekräftigsten sind Käufe außerhalb des üblichen Musters einer Person (Cohen, Malloy & Pomorski 2012); diese Unterscheidung macht das Radar noch nicht. Das Nachbilden von 13F-Depots zeigt gemischte Ergebnisse."],
  feed: [0, "28 Nachrichtenportale, amtliche Mitteilungen, Google News, siehe „Unsere Quellen“", "Rohe Meldungen. Erst im Signal-Leser werden sie eingeordnet."],
  forschung: [3, "Begutachtete Fachzeitschriften und Arbeitspapiere", "Arbeitspapiere sind noch nicht begutachtet und deshalb gekennzeichnet."],
};
const LEVEL = { 3: ["stark belegt", "ev3"], 2: ["mittel belegt", "ev2"], 1: ["schwach belegt", "ev1"], 0: ["Fakten & Daten", "ev0"] };
const sch = (q) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;
// How each part is made, how often it updates, where to read more. Shown on tap ("ⓘ"), so the page stays short.
const INFO = {
  lage: { freq: "alle 15 Min. (Kurse), stündlich (Berichterstattung)", how: "Eigenes Messgerät des Radars: mehrere Warnzeichen werden zu 0–100 gemischt, z. B. wie weit Tech-Aktien und Nvidia über ihrem 200-Tage-Schnitt liegen, Sorglosigkeit (niedriger VIX), Börsengang-Fieber und wie oft Medien „Blase“ schreiben. Die Gewichte sind selbst gewählt und offen einsehbar unter Wissen → So rechnet das Radar.",
    links: [["Greenwood, Shleifer & You (2019): Bubbles for Fama", sch("Greenwood Shleifer You Bubbles for Fama")], ["Gewichte und Rechenweg", "#wissen/zahlen"]] },
  stimmung: { freq: "alle 15 Min.", how: "Das Angst-und-Gier-Barometer von CNN mischt sieben Marktdaten zu 0–100: Kursdynamik, Kursstärke, Marktbreite, Absicherungen mit Optionen (Put/Call), Nachfrage nach riskanten Anleihen, Schwankung (VIX) und Flucht in sichere Anlagen. Das Krypto-Barometer (alternative.me) nutzt u. a. Schwankung, Handelsvolumen, soziale Medien, Bitcoin-Anteil und Suchinteresse. Beide sind Branchen-Kennzahlen, keine wissenschaftlich geprüften Maße.",
    links: [["CNN Fear & Greed (Original)", "https://edition.cnn.com/markets/fear-and-greed"], ["Krypto-Barometer (alternative.me)", "https://alternative.me/crypto/fear-and-greed-index/"], ["Baker & Wurgler (2006): Investor Sentiment", sch("Baker Wurgler Investor Sentiment and the Cross-Section of Stock Returns")]] },
  frueh: { freq: "täglich bis monatlich (amtliche US-Daten)", how: "Drei bekannte Anzeiger: Zinskurve (lange minus kurze Zinsen; negativ ging Rezessionen oft voraus), Risikoaufschläge von Firmenanleihen und die Sahm-Regel (Anstieg der Arbeitslosenquote, meldet den Beginn einer Rezession).",
    links: [["Estrella & Mishkin (1998): Zinskurve", sch("Estrella Mishkin Predicting US recessions financial variables as leading indicators")], ["Zinskurve live (FRED)", "https://fred.stlouisfed.org/series/T10Y3M"], ["Sahm-Regel live (FRED)", "https://fred.stlouisfed.org/series/SAHMREALTIME"]] },
  offiziell: { freq: "monatlich (amtliche Umfragen)", how: "Unverändert übernommen: EU-Wirtschaftsstimmung und Verbrauchervertrauen (EU-Kommission über Eurostat), US-Verbraucherstimmung (Uni Michigan) und das Anleihe-Stressmaß der US-Notenbank (Excess Bond Premium).",
    links: [["Lemmon & Portniaguina (2006): Verbrauchervertrauen und Renditen", sch("Lemmon Portniaguina Consumer confidence and asset prices")], ["Gilchrist & Zakrajšek (2012): Credit Spreads", sch("Gilchrist Zakrajsek Credit spreads and business cycle fluctuations")], ["US-Verbraucherstimmung (FRED)", "https://fred.stlouisfed.org/series/UMCSENT"]] },
  trends: { freq: "alle 15 Min. (Kurse), täglich (Aufmerksamkeit, Downloads)", how: "Ungewöhnliche Bewegungen im Verhältnis zur normalen Schwankung („2,0×“), sprunghaft steigende Wikipedia-Aufrufe und KI-Software, die Entwickler gerade massenhaft herunterladen.",
    links: [["Jegadeesh & Titman (1993): Momentum", sch("Jegadeesh Titman Returns to buying winners and selling losers")], ["Da, Engelberg & Gao (2011): Aufmerksamkeit", sch("Da Engelberg Gao In search of attention")]] },
  karte: { freq: "alle 15 Min.", how: "Jedes Thema bekommt zwei Werte: Kurs-Trend (12-1-Momentum des Themen-ETFs) und Aufmerksamkeit (Wikipedia, Nachrichten-Tempo, Hacker News). Viel Aufmerksamkeit ohne Kurs = Hype; Verdopplung in zwei Jahren = überhitzt.",
    links: [["Barber & Odean (2008): All That Glitters", sch("Barber Odean All that glitters attention")], ["Greenwood, Shleifer & You (2019)", sch("Greenwood Shleifer You Bubbles for Fama")]] },
  themen: { freq: "alle 15 Min.", how: "Rangfolge der Themen nach Kurs-Trend, Aufmerksamkeit und Überhitzung, gleiche Regeln wie die Hype-Karte.", links: [["Moskowitz & Grinblatt (1999): Branchen-Momentum", sch("Moskowitz Grinblatt Do industries explain momentum")]] },
  perlen: { freq: "alle 15 Min.", how: "Regelbasierte Vorauswahl aus Analysten-Konsens, Bewertung und Kurs. Ideen zum Selbst-Prüfen, keine Empfehlung.", links: [["Bradshaw, Brown & Huang (2013): Kursziele", sch("Bradshaw Brown Huang Do sell-side analysts exhibit differential target price forecasting ability")]] },
  ipo: { freq: "alle 15 Min.", how: "Schlagzeilen zu Börsengängen, Wikipedia-Aufmerksamkeit, Wettmärkte und der Kurs eines IPO-ETFs.", links: [["Ritter (1991): Long-run performance of IPOs", sch("Ritter The long-run performance of initial public offerings")], ["IPO-Statistiken (Jay Ritter)", "https://site.warrington.ufl.edu/ritter/ipo-data/"]] },
  profis: { freq: "stündlich (Insider-Käufe), vierteljährlich mit 45 Tagen Verzug (Depots der Profis)", how: "Pflichtmeldungen an die US-Börsenaufsicht: Formular 4 (Käufe von Vorständen) und 13F (Depots großer Investoren).",
    links: [["SEC-Datenbank EDGAR", "https://www.sec.gov/edgar/search/"], ["Cohen, Malloy & Pomorski (2012): Insider", sch("Cohen Malloy Pomorski Decoding inside information")]] },
  rohstoffe: { freq: "alle 15 Min. (bis 15 Min. verzögert)", how: "Preise des nächsten Liefermonats an den Terminbörsen. Der Balken zeigt die Lage zwischen Jahrestief und Jahreshoch.",
    links: [["Weltbank: Rohstoffpreise & Prognosen", "https://www.worldbank.org/en/research/commodity-markets"], ["Koijen u. a. (2018): Carry", sch("Koijen Moskowitz Pedersen Vrugt Carry")]] },
  immobilien: { freq: "monatlich (Bauzinsen), vierteljährlich (Hauspreise)", how: "Amtliche Statistik: Bauzinsen der EZB-Zinsstatistik, Hauspreisindex von Eurostat, dazu Rechner und amtliche Mietspiegel.",
    links: [["Jordà u. a. (2019): Rate of Return on Everything", sch("The Rate of Return on Everything 1870-2015")], ["Eurostat Hauspreisindex", "https://ec.europa.eu/eurostat/web/housing-price-statistics"]] },
  anlagen: { freq: "alle 15 Min.", how: "Kurse breiter ETFs und Indizes je Anlageklasse mit Trend (200-Tage-Schnitt), Schwankung und Risikoklasse nach EU-Regeln (PRIIPs).", links: [["Markowitz (1952): Portfolio Selection", sch("Markowitz Portfolio Selection 1952")]] },
  feed: { freq: "alle 15 Min.", how: "Schlagzeilen aus über 20 Portalen und amtlichen Mitteilungen. Gleiche Geschichten werden zusammengefasst und nach Zahl der Medien gezählt.", links: [["Fang & Peress (2009): Medien und Renditen", sch("Fang Peress Media coverage and the cross-section of stock returns")], ["Tetlock (2007): Medien-Pessimismus", sch("Tetlock Giving content to investor sentiment")]] },
  newsImpact: { freq: "alle 15 Min.", how: "Jede Meldung wird einer Ereignis-Art zugeordnet (Zinsen, Zölle, Krieg, Wahlen, Quartalszahlen …). Die Pfeile zeigen, wie solche Ereignisse laut Studien im Schnitt wirkten.", links: [["MacKinlay (1997): Event Studies", sch("MacKinlay Event studies in economics and finance")]] },
  plan: { freq: "sofort bei jeder Eingabe", how: "Aufteilung nach deinem Risikoprofil, Prognose-Spanne aus 2.000 Zufallsverläufen mit langfristigen Durchschnittsrenditen, Crash-Test mit Aktien −50 %.", links: [["Markowitz (1952)", sch("Markowitz Portfolio Selection 1952")], ["Vanguard (2012): Einmal- vs. Ratenanlage", sch("Vanguard Dollar-cost averaging just means taking risk later")]] },
};
/** One plain line on what a gauge means right now for the user's risk profile. Pure. */
export function meaningNow(id, d, goal) {
  const bold = goal === "wachstum" || goal === "mutig";
  if (id === "lage" && Number.isFinite(d?.bubble?.score)) {
    // same steps as the gauge: <20 Angst, <40 Vorsicht, <60 Neutral, <80 Euphorie, else Blasen-Alarm
    const b = d.bubble.score;
    return b < 20 ? "Zone „Angst“: kaum Übertreibung, eher Sorge am Markt. Sparplan weiterlaufen lassen, nichts überstürzt verkaufen."
      : b < 40 ? "Zone „Vorsicht“: wenig Übertreibung, Anleger sind zurückhaltend. Ein normales Umfeld, um nach Plan weiter zu sparen."
      : b < 60 ? "Zone „Neutral“: Sparplan normal weiter, Hype-Themen nur klein beimischen."
      : b < 80 ? (bold ? "Zone „Euphorie“: investiert bleiben, aber den Trend-Anteil nicht erhöhen." : "Zone „Euphorie“: Plan halten, nichts nachkaufen, nur weil es stark gestiegen ist.")
      : (bold ? "Zone „Blasen-Alarm“: keine überhitzten Themen nachkaufen, Trend-Anteil begrenzen." : "Zone „Blasen-Alarm“: Plan halten, Mischung prüfen, nichts Heißes kaufen.");
  }
  if (id === "stimmung" && Number.isFinite(d?.cnnFearGreed?.value)) {
    const v = d.cnnFearGreed.value;
    return v >= 75 ? "Viel Gier am Markt: keinem Hype hinterherlaufen, Plan halten." : v <= 25 ? "Viel Angst am Markt: Ruhe bewahren, den Sparplan weiterlaufen lassen. Wer in Angstphasen verkauft, verpasst oft die Erholung." : "Stimmung im normalen Bereich: kein Grund zu handeln.";
  }
  return "";
}
export function renderMeta() {
  for (const [id, [lvl, src, note]] of Object.entries(META)) {
    const sec = document.getElementById(id); if (!sec) continue;
    let el = sec.querySelector(":scope > .meta-line, :scope > article > .meta-line");
    const host = sec.matches(".grid-hero, .grid-2") ? sec.querySelector("article") : sec;
    if (!el) { el = document.createElement("div"); el.className = "meta-line"; host.appendChild(el); }
    const [word, cls] = LEVEL[lvl];
    const info = INFO[id], d = state.data, goal = store.get("goal", "ausgewogen");
    const at = d?.generatedAt ? new Date(d.generatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null;
    const now = info ? meaningNow(id, d, goal) : "";
    el.innerHTML = `<span class="ev ${cls}" data-tip="${esc(`<b>Beweislage: ${word}</b><br>${esc(note)}`)}">${"●".repeat(lvl)}${"○".repeat(3 - lvl)} ${word}</span><span class="src">Quelle: ${esc(src)}</span>`
      + (info ? `<details class="info-box"><summary>ⓘ Wie entsteht das?${at ? ` · Stand ${at} Uhr` : ""} · ${esc(info.freq)}</summary>
        <p><b>So entsteht es:</b> ${esc(info.how)}</p>
        <p><b>Wie gut belegt:</b> ${esc(word)}. ${esc(note)}</p>
        ${now ? `<p><b>Was heißt das jetzt für dich</b> (Profil ${esc({ sicherheit: "Sicherheit", ausgewogen: "Ausgewogen", wachstum: "Wachstum", mutig: "Mutig" }[goal] || goal)}): ${esc(now)}</p>` : ""}
        <p><b>Weiterlesen:</b> ${info.links.map(([l, u]) => u.startsWith("#") ? `<a href="${esc(u)}">${esc(l)}</a>` : `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join(" · ")}</p>
        <p class="fine">Beobachtungen und Regeln, keine Anlageberatung. Die Bedeutung kann sich mit neuen Daten ändern.</p></details>` : "");
  }
}

// ---------- Anpassen: Interessen & Bereiche ----------
export const TOPICS = [["stocks", "Aktien & ETFs"], ["themes", "Trend-Themen"], ["crypto", "Krypto"], ["commodities", "Rohstoffe"], ["realestate", "Immobilien"], ["macro", "Konjunktur & Zinsen"], ["news", "Politik & Nachrichten"], ["pros", "Profis & Insider"]];
const SECTIONS = [["ipo", "IPO-Radar"], ["rohstoffe", "Rohstoff-Monitor"], ["immobilien", "Immobilien"], ["stimmung", "Stimmung & Wettmärkte"], ["perlen", "Aktien-Ideen"], ["weitere", "Weitere Anlageformen"], ["trends", "Trend-Radar"]];
export const prefs = () => { const p = store.get("prefs", {}) || {}; return { off: strList(p.off), hide: strList(p.hide) }; };
export function applyPrefs() {
  const p = prefs();
  for (const [id] of SECTIONS) { const el = document.getElementById(id); if (el) el.classList.toggle("user-hidden", p.hide.includes(id)); }
}
export function renderPrefs(onChange) {
  const p = prefs();
  $("#prefsBody").innerHTML = `
    <h3>Was interessiert dich?</h3><p class="fine">Signale zu abgewählten Themen werden auf „Heute“ ausgeblendet.</p>
    <div class="pref-grid">${TOPICS.map(([k, l]) => `<label class="radio"><input type="checkbox" data-topic="${k}" ${p.off.includes(k) ? "" : "checked"}> ${l}</label>`).join("")}</div>
    <h3>Welche Bereiche willst du sehen?</h3>
    <div class="pref-grid">${SECTIONS.map(([k, l]) => `<label class="radio"><input type="checkbox" data-sec="${k}" ${p.hide.includes(k) ? "" : "checked"}> ${l}</label>`).join("")}</div>
    <p class="fine">Gespeichert nur auf diesem Gerät.</p>`;
  $("#prefsBody").onchange = (e) => {
    const q = prefs(), t = e.target;
    if (t.dataset.topic) q.off = t.checked ? q.off.filter((x) => x !== t.dataset.topic) : [...new Set([...q.off, t.dataset.topic])];
    if (t.dataset.sec) q.hide = t.checked ? q.hide.filter((x) => x !== t.dataset.sec) : [...new Set([...q.hide, t.dataset.sec])];
    store.set("prefs", q); store.set("interests", TOPICS.map(([k]) => k).filter((k) => !q.off.includes(k))); applyPrefs(); onChange?.();
  };
}

// ---------- Mit eigener KI besprechen ----------
export function aiPrompt(d, signals) {
  const lines = [
    `Lage am ${new Date(d.generatedAt).toLocaleDateString("de-DE")} laut meinem Signal-Radar:`,
    `- Markt-Ampel: ${d.risk?.level ?? "–"}, Blasen-Meter ${d.bubble?.score ?? "–"}/100`,
    ...signals.slice(0, 6).map((s) => `- ${s.title}`),
    ...(d.events || []).filter((e) => e.n48h > 0).slice(0, 3).map((e) => `- Nachrichtenlage: ${e.name} (${e.n48h} Meldungen in 48 Std.)`),
    "",
    "Ich bin Privatanleger. Erkläre mir in einfachen Worten, was das für einen langfristigen, breit gestreuten Anleger bedeutet. Mache Vorschläge statt Empfehlungen, nenne Risiken und sage, was davon gut belegt ist und was nicht.",
  ];
  return lines.join("\n");
}
export function renderAskAi(signals) {
  const text = aiPrompt(state.data, signals);
  const enc = encodeURIComponent(text);
  $("#aiClaude").href = `https://claude.ai/new?q=${enc}`;
  $("#aiChatgpt").href = `https://chatgpt.com/?q=${enc}`;
  $("#aiCopy").onclick = async () => { try { await navigator.clipboard.writeText(text); toast("Kopiert – in deine KI einfügen"); } catch { toast("Kopieren nicht möglich"); } };
}

// ---------- Trend-Radar: Was gerade abhebt ----------
let techKind = "all";
export const setTechKind = (k) => { techKind = k; };
export function renderTrends() {
  const d = state.data, rows = [];
  // Kursbewegungen relativ zur eigenen Schwankung: „wie ungewöhnlich ist das?“
  const norm = (x) => (ok(x.chg1m) && ok(x.vol) && x.vol > 0 ? x.chg1m / (x.vol / Math.sqrt(12)) : null);
  for (const a of d.assets || []) if (!a.missing) rows.push({ name: a.name, kind: "Anlageklasse", chg: a.chg1m, z: norm(a), detail: `asset:${a.id}` });
  for (const c of d.commodities || []) if (!c.missing) rows.push({ name: c.name, kind: "Rohstoff", chg: c.chg1m, z: norm(c), detail: `com:${c.id}` });
  for (const t of d.themes || []) if (t.price) rows.push({ name: t.name, kind: "Thema", chg: t.price.chg1m, z: norm({ chg1m: t.price.chg1m, vol: t.price.vol }), theme: t.id });
  const upAll = rows.filter((r) => ok(r.z) && r.z >= 1).sort((a, b) => b.z - a.z);
  const downAll = rows.filter((r) => ok(r.z) && r.z <= -1).sort((a, b) => a.z - b.z);
  const attnAll = [...(d.themes || []).map((t) => ({ name: t.name, mom: t.attention?.mom, hype: hypeInfo(t), theme: t.id })), ...(d.ipoWatch || []).map((w) => ({ name: w.name, mom: w.attention?.mom }))]
    .filter((x) => ok(x.mom) && x.mom > 0.25).sort((a, b) => b.mom - a.mom);
  const attr = (r) => (r.theme ? `data-open="${esc(r.theme)}"` : r.detail ? `data-detail="${esc(r.detail)}"` : "");
  const row = (r, i) => `<li><button type="button" class="rowbtn" ${attr(r)}><span class="rank">${i + 1}</span><b>${esc(r.name)}</b><span class="fine">${esc(r.kind)}</span></button><span class="${r.chg >= 0 ? "up" : "down"}">${pct(r.chg, 0)}</span><span class="zbadge" title="So viele typische Monats-Schwankungen weit">${fmt(Math.abs(r.z), 1)}×</span></li>`;
  const t = d.tech || {};
  const tech = [
    ...(techKind !== "repo" ? (t.models || []).map((m, i) => ({ ...m, key: `model:${i}`, kind: `KI-Modell · ${m.task || ""}`, metric: `${compact(m.downloads)} Downloads` })) : []),
    ...(techKind !== "model" ? (t.repos || []).map((r, i) => ({ ...r, key: `repo:${i}`, kind: `GitHub-Projekt · ${r.lang || ""}`, metric: `${compact(r.stars)} ★ in 30 Tagen` })) : []),
  ];
  // Mix both lists by rank so neither dominates
  if (techKind === "all") tech.sort((a, b) => +a.key.split(":")[1] - +b.key.split(":")[1]);
  $("#trendsBody").innerHTML = `
    <div class="trend-col"><h3>🚀 Hebt ab (1 Monat)</h3><ul class="trend-list">${limitList("trend:up", upAll, 6).map(row).join("") || '<li class="empty">Nichts Außergewöhnliches.</li>'}</ul>${moreBtn("trend:up", upAll.length, 6)}</div>
    <div class="trend-col"><h3>🪂 Stürzt ab (1 Monat)</h3><ul class="trend-list">${limitList("trend:down", downAll, 4).map(row).join("") || '<li class="empty">Nichts Außergewöhnliches.</li>'}</ul>${moreBtn("trend:down", downAll.length, 4)}</div>
    <div class="trend-col"><h3>👀 Aufmerksamkeit explodiert</h3><ul class="trend-list">${limitList("trend:attn", attnAll, 5).map((x, i) => `<li><button type="button" class="rowbtn" ${attr(x)}><span class="rank">${i + 1}</span><b>${esc(x.name)}${x.hype ? ` <span class="hype" data-tip="${esc(`<b>Warum Hype?</b><br>${esc(x.hype)}`)}">⚡ Hype</span>` : ""}</b></button><span class="up">${pct(x.mom, 0)}</span><span class="fine">Aufrufe vs. Vormonat</span></li>`).join("") || '<li class="empty">Ruhig.</li>'}</ul>${moreBtn("trend:attn", attnAll.length, 5)}</div>
    <div class="trend-col wide"><div class="card-head"><h3>🧠 KI-Software, die gerade explodiert</h3>
      <div class="seg" id="techSeg"><button type="button" data-tech="all" class="${techKind === "all" ? "on" : ""}">Alle</button><button type="button" data-tech="model" class="${techKind === "model" ? "on" : ""}">KI-Modelle</button><button type="button" data-tech="repo" class="${techKind === "repo" ? "on" : ""}">GitHub-Projekte</button></div></div>
      <ul class="trend-list">${limitList("trend:tech", tech, 8).map((x) => `<li><button type="button" class="rowbtn" data-detail="${x.key}"><span class="rank">${+x.key.split(":")[1] + 1}</span><b>${esc(x.name)}</b><span class="fine">${esc(x.kind)}</span></button><span class="fine">${esc(x.metric)}</span>${x.ticker ? `<span class="chip" title="Börsennotierte Firma dahinter">${esc(x.ticker)}</span>` : ""}</li>`).join("") || '<li class="empty">Gerade keine Daten.</li>'}</ul>
      ${moreBtn("trend:tech", tech.length, 8)}
      <p class="fine">Rang = Platz in der jeweiligen Liste (GitHub: meiste neue Sterne der letzten 30 Tage; Hugging Face: aktuell im Trend). Antippen für Details, Quellen und Nachrichten. Welche KI-Werkzeuge Entwickler massenhaft nutzen, zeigt sich hier Wochen bevor es in Geschäftszahlen auftaucht.</p></div>`;
}

// ---------- Was nachweislich Geld vermehrt + Kosten-Rechner ----------
export function renderLevers() {
  const p = store.get("plan", { once: 5000, monthly: 200, years: 15 });
  const r = 0.065, n = Math.round(num(p.years, 1, 60, 15)), once = num(p.once, 0, 1e9, 0), m = num(p.monthly, 0, 1e7, 0);
  const fv = (rate) => { const rm = rate / 12; let v = once; for (let i = 0; i < n * 12; i++) v = (v + m) * (1 + rm); return v; };
  const cheap = fv(r - 0.002), pricey = fv(r - 0.015), late = (() => { const rm = (r - 0.002) / 12; let v = once; for (let i = 0; i < (n - 5) * 12; i++) v = (v + m) * (1 + rm); return v; })();
  const gap = fv(r - 0.002 - 0.012);
  $("#leversBody").innerHTML = `
    <div class="lever"><b>Niedrige Kosten</b><span>Günstiger ETF (0,2 % pro Jahr) statt teurer Fonds (1,5 %): <em class="up">+${fmt(cheap - pricey)} €</em> mehr nach ${n} Jahren.</span></div>
    <div class="lever"><b>Früh anfangen</b><span>5 Jahre später starten kostet dich <em class="down">${fmt(cheap - late)} €</em>, weil der Zinseszins weniger Zeit hat.</span></div>
    <div class="lever"><b>Investiert bleiben</b><span>Anleger verlieren durch Rein-Raus im Schnitt rund 1–1,7 Prozentpunkte pro Jahr (Morningstar, „Mind the Gap“). Bei dir wären das etwa <em class="down">${fmt(cheap - gap)} €</em>.</span></div>
    <div class="lever"><b>Breit streuen</b><span>Ein Welt-ETF mit rund 1.400 Firmen schützt davor, dass eine Pleite oder eine Branche alles zerstört.</span></div>
    <div class="lever"><b>Mehr sparen</b><span>Jede 50 € mehr pro Monat ergeben nach ${n} Jahren etwa <em class="up">+${fmt(((v) => v)((() => { const rm = (r - 0.002) / 12; let v = 0; for (let i = 0; i < n * 12; i++) v = (v + 50) * (1 + rm); return v; })()))} €</em>.</span></div>
    <div class="lever"><b>Steuern nutzen</b><span>Freistellungsauftrag stellen: 1.000 € Erträge pro Jahr bleiben steuerfrei (2.000 € für Paare).</span></div>
    <p class="fine">Rechnung mit deinen Plan-Eingaben (${fmt(once)} € einmalig, ${fmt(m)} € pro Monat, ${n} Jahre) und angenommenen 6,5 % Rendite vor Kosten. Zum Ändern im Plan oben die Zahlen anpassen.</p>`;
}

// ---------- Finanz-Fitness-Check & Quiz (spielerisch, aber für gute Gewohnheiten) ----------
const FIT = [
  ["reserve", "Notgroschen: 3 Monatsgehälter auf dem Tagesgeld", "Schützt davor, im Crash verkaufen zu müssen."],
  ["debt", "Keine teuren Schulden (Dispo, Ratenkredit)", "Dispozinsen von über 10 % schlägt keine Geldanlage."],
  ["plan", "Plan steht: Aufteilung aufgeschrieben", "Wer einen Plan hat, verkauft seltener in Panik."],
  ["core", "Kern: breit gestreuter Welt-ETF", "Die am besten belegte Grundlage."],
  ["savings", "Sparplan läuft automatisch", "Automatik schlägt Willenskraft."],
  ["cost", "Kosten unter 0,3 % pro Jahr", "Jedes Prozent Kosten frisst über 30 Jahre ein Viertel des Endvermögens."],
  ["tax", "Freistellungsauftrag gestellt", "Bis zu 1.000 € Erträge pro Jahr steuerfrei."],
  ["rebal", "Jährlicher Termin zum Aufräumen (Rebalancing) im Kalender", "Verkauft automatisch teuer und kauft günstig."],
];
const LEVELS = [[0, "Startklar"], [3, "Auf Kurs"], [6, "Stark aufgestellt"], [8, "Finanz-Profi"]];
export function renderFitness() {
  const done = strList(store.get("fit", []), 50);
  const n = FIT.filter(([k]) => done.includes(k)).length, lvl = [...LEVELS].reverse().find(([min]) => n >= min)[1];
  const C = 2 * Math.PI * 34;
  $("#fitBody").innerHTML = `
    <div class="fit-head"><svg viewBox="0 0 80 80" class="fit-ring" aria-hidden="true"><circle cx="40" cy="40" r="34" class="bg"/><circle cx="40" cy="40" r="34" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - n / FIT.length)}"/><text x="40" y="46" text-anchor="middle">${n}/${FIT.length}</text></svg>
      <div><div class="eyebrow">Deine Stufe</div><div class="fit-level">${lvl}</div><p class="fine">Hake ab, was du schon erledigt hast. Gespeichert nur auf diesem Gerät.</p></div></div>
    <ul class="fit-list">${FIT.map(([k, t, why]) => `<li><label class="radio"><input type="checkbox" data-fit="${k}" ${done.includes(k) ? "checked" : ""}> <span><b>${esc(t)}</b><small>${esc(why)}</small></span></label></li>`).join("")}</ul>`;
  $("#fitBody").onchange = (e) => {
    const k = e.target.dataset.fit; if (!k) return;
    const cur = strList(store.get("fit", []), 50);
    store.set("fit", e.target.checked ? [...new Set([...cur, k])] : cur.filter((x) => x !== k));
    renderFitness();
    if (e.target.checked) toast("Stark! Ein Schritt mehr in Richtung Finanz-Profi");
  };
  renderQuiz();
}
function renderQuiz() {
  const terms = Object.keys(LEX), day = Math.floor(Date.now() / 864e5);
  const pick = (i) => terms[(day * 7 + i * 13) % terms.length];
  const answer = pick(0), opts = [answer, pick(1), pick(2)].filter((x, i, a) => a.indexOf(x) === i).sort();
  const st = store.get("quiz", { last: null, streak: 0 });
  const solved = st.last === day;
  $("#quizBody").innerHTML = `<div class="eyebrow">Quiz des Tages · Serie: ${st.streak} 🔥</div>
    <p class="quiz-q">„${esc(LEX[answer])}“</p>
    <div class="quiz-opts">${opts.map((o) => `<button type="button" class="btn ${solved && o === answer ? "btn-primary" : "btn-ghost"}" data-q="${esc(o)}" ${solved ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
    ${solved ? '<p class="fine">Gelöst. Morgen gibt es eine neue Frage.</p>' : '<p class="fine">Welcher Begriff passt?</p>'}`;
  $("#quizBody").onclick = (e) => {
    const b = e.target.closest("[data-q]"); if (!b || solved) return;
    if (b.dataset.q === answer) { store.set("quiz", { last: day, streak: st.last === day - 1 ? st.streak + 1 : 1 }); toast("Richtig! 🎉"); renderQuiz(); }
    else { b.classList.add("wrong"); toast("Leider nicht, versuch es nochmal"); }
  };
}

// ---------- Verschlüsselte Sicherung: auf andere Geräte übertragen ----------
// Password → key (PBKDF2-SHA256, 600,000 rounds as recommended by OWASP 2023) → AES-256-GCM. All local in the browser.
export const KEYS = ["plan", "watch", "prefs", "fit", "quiz", "mode", "theme", "goal", "interests", "onboarded", "portfolio", "personas", "situation", "learn", "mytopics"];
const KDF_ITER = 600000, KDF_ITER_V1 = 310000;
// A restored backup is untrusted (someone could send a crafted file): keep only known keys with sane values.
const SAFE_STR = /^[\w\-äöüÄÖÜß .,()&+/'’]{0,60}$/;
const num = (x, lo, hi, d) => { const v = Number(x); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
const strList = (a, max = 100) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && /^[\w-]{1,40}$/.test(x)).slice(0, max) : []);
const oneOf = (x, list, d) => (list.includes(x) ? x : d);
export function sanitizeBackup(obj) {
  const o = obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {}, out = {};
  if (o.plan && typeof o.plan === "object") {
    const p = o.plan;
    out.plan = {
      once: num(p.once, 0, 1e9, 0), monthly: num(p.monthly, 0, 1e7, 0), years: Math.round(num(p.years, 1, 60, 15)),
      profile: oneOf(p.profile, ["auto", "sicherheit", "ausgewogen", "wachstum", "mutig", "kurz"], "auto"),
      reserve: typeof p.reserve === "string" && /^[\w-]{0,20}$/.test(p.reserve) ? p.reserve : "",
      q: strList(p.q, 10),
    };
  }
  if ("watch" in o) out.watch = strList(o.watch);
  if (o.prefs && typeof o.prefs === "object") out.prefs = { off: strList(o.prefs.off), hide: strList(o.prefs.hide) };
  if ("fit" in o) out.fit = strList(o.fit, 50);
  if (o.quiz && typeof o.quiz === "object") out.quiz = { last: Number.isInteger(o.quiz.last) ? o.quiz.last : null, streak: Math.round(num(o.quiz.streak, 0, 10000, 0)) };
  if ("mode" in o) out.mode = oneOf(o.mode, ["easy", "pro"], "easy");
  if ("theme" in o) out.theme = oneOf(o.theme, ["light", "dark"], null);
  if ("goal" in o) out.goal = oneOf(o.goal, ["sicherheit", "ausgewogen", "wachstum", "mutig"], "ausgewogen");
  if ("interests" in o) out.interests = strList(o.interests, 20);
  if ("personas" in o) out.personas = strList(o.personas, 10);
  if ("learn" in o) out.learn = strList(o.learn, 10);
  if ("mytopics" in o) out.mytopics = cleanTopics(o.mytopics);
  if (o.situation && typeof o.situation === "object") out.situation = cleanSituation(o.situation);
  if ("onboarded" in o) out.onboarded = o.onboarded === true;
  if (Array.isArray(o.portfolio)) out.portfolio = o.portfolio.slice(0, 200).filter((p) => p && typeof p === "object")
    .map((p) => ({ cat: typeof p.cat === "string" && /^[a-z]{2,12}$/.test(p.cat) ? p.cat : "other", name: typeof p.name === "string" && SAFE_STR.test(p.name) ? p.name : "", value: num(p.value, 0, 1e9, 0),
      ...(validRef(p.ref) ? { ref: p.ref } : {}), ...(num(p.qty, 0, 1e12, 0) > 0 ? { qty: num(p.qty, 0, 1e12, 0) } : {}) }))
    .filter((p) => p.value > 0 || (p.qty > 0 && p.ref));
  for (const k of Object.keys(out)) if (out[k] === null) delete out[k];
  return out;
}
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export async function deriveKey(pass, salt, iterations = KDF_ITER) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
/** Encrypts with an already derived key (used by the automatic backup, which keeps the key, never the password). */
export async function encryptWithKey(obj, key, salt, it = KDF_ITER) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // fresh random IV for every file
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({ app: "signal-radar", v: 2, kdf: "PBKDF2-SHA256", it, cipher: "AES-256-GCM", salt: b64(salt), iv: b64(iv), data: b64(ct) });
}
export async function encryptBackup(obj, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return encryptWithKey(obj, await deriveKey(pass, salt), salt);
}
export const collectBackup = () => Object.fromEntries(KEYS.map((k) => [k, store.get(k, null)]).filter(([, v]) => v !== null));
/** Restores untrusted backup content: only known keys with sane values. */
export function applyBackup(obj) { for (const [k, v] of Object.entries(sanitizeBackup(obj))) if (KEYS.includes(k)) store.set(k, v); }
export async function decryptBackup(text, pass) {
  const f = JSON.parse(text);
  if (f.app !== "signal-radar") throw new Error("Keine Signal-Radar-Sicherung");
  // v1 files used 310,000 rounds; never accept fewer than that from a file
  const it = f.v === 1 ? KDF_ITER_V1 : Number.isInteger(f.it) && f.it >= KDF_ITER && f.it <= 5e6 ? f.it : KDF_ITER;
  const key = await deriveKey(pass, unb64(f.salt), it);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(f.iv) }, key, unb64(f.data));
  return JSON.parse(new TextDecoder().decode(pt));
}
export function initBackup() {
  const box = $("#backupBox"); if (!box) return;
  box.innerHTML = `<h3>Sichern &amp; auf andere Geräte übertragen</h3>
    <p class="fine">Plan, Merkliste, Interessen und Fitness-Fortschritt werden mit deinem Passwort verschlüsselt (AES-256). Die Datei kannst du in deine Cloud legen (OneDrive, iCloud, Dropbox) oder dir selbst schicken. Ohne Passwort kann sie niemand lesen, auch nicht der Betreiber dieser Seite.</p>
    <label class="bk-label">Passwort (mind. 10 Zeichen)<input id="bkPass" type="password" autocomplete="new-password" minlength="10"></label>
    <div class="bk-btns"><button class="btn btn-primary" type="button" id="bkSave">Sicherung erstellen</button><label class="btn btn-ghost bk-file">Sicherung laden<input id="bkFile" type="file" accept=".radar,application/json" hidden></label></div>
    <p class="fine" id="bkMsg"></p><div id="autoBox"></div>`;
  const msg = (t) => ($("#bkMsg").textContent = t);
  $("#bkSave").onclick = async () => {
    const pass = $("#bkPass").value; if (pass.length < 10) return msg("Bitte ein Passwort mit mindestens 10 Zeichen wählen.");
    const blob = new Blob([await encryptBackup(collectBackup(), pass)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `signal-radar-${new Date().toISOString().slice(0, 10)}.radar`; a.click();
    msg("Sicherung erstellt. Passwort gut merken: Ohne Passwort ist sie nicht wiederherstellbar.");
  };
  $("#bkFile").onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      applyBackup(await decryptBackup(await file.text(), $("#bkPass").value));
      msg("Sicherung geladen. Die Seite lädt neu …"); setTimeout(() => location.reload(), 900);
    } catch { msg("Das hat nicht geklappt: falsches Passwort oder keine gültige Sicherungsdatei."); }
    e.target.value = "";
  };
}

// ---------- Echte Nutzung & Geldflüsse (für das Trend-Radar) ----------
export function renderUsage() {
  const d = state.data, ad = d.adoption || [], cf = d.cryptoFlows || {}, pw = d.power;
  const big = (x) => (x >= 1e6 ? fmt(x / 1e6, 1) + " Mio." : fmt(x / 1e3) + " Tsd.");
  $("#usageBody").innerHTML = `
    <div class="trend-col"><h3>🧩 Welche KI bauen Firmen wirklich ein?</h3>
      <ul class="trend-list">${ad.map((a) => `<li><span><b>${esc(a.name)}</b><span class="fine">${esc(a.owner)}</span></span><span class="fine">${big(a.week)}/Woche</span>${ok(a.growth) ? `<span class="${a.growth >= 0 ? "up" : "down"}">${pct(a.growth, 0)}</span>` : "<span></span>"}${a.listed ? `<span class="chip">${esc(a.listed)}</span>` : ""}</li>`).join("") || '<li class="empty">Gerade keine Daten.</li>'}</ul>
      <p class="fine">Wöchentliche Downloads der Programmier-Bausteine (PyPI + npm), Veränderung zur Vorwoche. Wer die meisten Entwickler hat, hat oft bald die meisten Kunden. Die Zahlen enthalten auch automatische Downloads, deshalb ist die Entwicklung aussagekräftiger als die absolute Höhe.</p></div>
    <div class="trend-col"><h3>💧 Geldfluss in Krypto</h3>
      <ul class="trend-list">
        ${cf.stablecoins ? `<li><span><b>Stablecoins im Umlauf</b><span class="fine">digitale Dollar, „Trockenpulver“ für Käufe</span></span><span>${fmt(cf.stablecoins.value / 1e9)} Mrd. $</span><span class="${cf.stablecoins.chg30 >= 0 ? "up" : "down"}">${pct(cf.stablecoins.chg30, 1)} / 30 T</span></li>` : ""}
        ${cf.tvl ? `<li><span><b>Kapital in Krypto-Anwendungen (DeFi)</b><span class="fine">Total Value Locked</span></span><span>${fmt(cf.tvl.value / 1e9)} Mrd. $</span><span class="${cf.tvl.chg30 >= 0 ? "up" : "down"}">${pct(cf.tvl.chg30, 1)} / 30 T</span></li>` : ""}
      </ul>
      <p class="fine">Quelle: DefiLlama. Wachsende Stablecoin-Mengen gelten als Zufluss neuen Geldes in den Kryptomarkt. Die Forschung dazu ist jung und die Beweislage schwach.</p></div>
    ${pw ? `<div class="trend-col"><h3>⚡ Strom-Börsenpreis Deutschland</h3>
      <div class="pw"><b>${fmt(pw.avg, 1)} €/MWh</b><span class="fine">Tagesdurchschnitt ${esc(pw.day)} · Spanne ${fmt(pw.min)}–${fmt(pw.max)} · 30-Tage-Schnitt ${fmt(pw.avg30, 1)}</span>${spark(pw.series, { w: 280, h: 40, color: "var(--s2)", label: "Strompreis 45 Tage" })}</div>
      <p class="fine">Quelle: Energy-Charts (Fraunhofer ISE), Day-Ahead-Börse. Wichtig für energieintensive Branchen wie Chemie, Stahl und Rechenzentren.</p></div>` : ""}`;
}
