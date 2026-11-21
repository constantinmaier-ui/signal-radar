// "Dein Radar": one card per investor profile (crypto, AI trends, commodities buyer, real estate, ETF saver).
// Each card shows live lines from the collected data, one research fact and one common mistake.
// Rules only, no advice; every line links to its details.
import { $, esc, fmt, pct, ok, store, state, compact, myTopics, matchesTopic, ago, safeUrl, growList, googleNews } from "./ui.js";


export const PERSONAS = [
  { id: "etf", icon: "🌍", label: "ETF & Vermögensaufbau", interests: ["stocks", "macro"] },
  { id: "krypto", icon: "₿", label: "Krypto", interests: ["crypto"] },
  { id: "ki", icon: "🤖", label: "KI & neue Trends früh erkennen", interests: ["themes", "stocks"] },
  { id: "rohstoffe", icon: "🥇", label: "Rohstoffe & Edelmetalle als Anlage", interests: ["commodities", "macro"] },
  { id: "einkauf", icon: "🏭", label: "Rohstoffe beruflich (Einkauf)", interests: ["commodities", "macro"] },
  { id: "immo_neu", icon: "🔑", label: "Immobilien: Einstieg", interests: ["realestate", "macro"] },
  { id: "immo_haben", icon: "🏠", label: "Immobilien: habe schon", interests: ["realestate", "macro"] },
];
const IDS = PERSONAS.map((p) => p.id);
export const personas = () => { const v = store.get("personas", []); return Array.isArray(v) ? v.filter((k) => IDS.includes(k)) : []; };

const scholar = (q) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;
/** Research facts most investors don't know. Peer-reviewed unless marked as working paper. No invented numbers. */
export const FACTS = [
  { id: "wenige-gewinner", tags: ["etf", "ki"], title: "Ganz wenige Aktien machen den ganzen Gewinn",
    text: "Von allen US-Aktien seit 1926 erklären die besten rund 4 % den gesamten Vermögenszuwachs des Aktienmarkts. Mehr als die Hälfte der Einzelaktien brachte über ihre Lebenszeit weniger als kurzfristige US-Staatsanleihen.",
    so: "Wer breit streut (z. B. Welt-ETF), hat die wenigen großen Gewinner sicher dabei. Wer wenige Einzelaktien hält, verpasst sie leicht.",
    cite: "Bessembinder (2018), Journal of Financial Economics", q: "Bessembinder Do stocks outperform Treasury bills" },
  { id: "viel-handeln", tags: ["etf", "krypto", "ki"], title: "Viel handeln kostet Rendite",
    text: "Die 20 % der Haushalte, die am meisten handelten, erzielten 11,4 % pro Jahr, der Markt 17,9 % (US-Depotdaten 1991–1996).",
    so: "Gebühren und schlechtes Timing fressen den Vorsprung. Ein fester Plan schlägt häufiges Umschichten.",
    cite: "Barber & Odean (2000), Journal of Finance", q: "Barber Odean Trading is hazardous to your wealth" },
  { id: "profis-index", tags: ["etf"], title: "Profis schlagen den Index selten",
    text: "Über 10 und mehr Jahre bleibt die große Mehrheit aktiv gemanagter Aktienfonds hinter ihrem Vergleichsindex zurück, in den USA wie in Europa.",
    so: "Günstige Indexfonds sind für die meisten der bessere Kern. Aktive Ideen gehören, wenn überhaupt, in einen kleinen Zusatzteil.",
    cite: "S&P Dow Jones Indices, SPIVA-Berichte (laufend)", url: "https://www.spglobal.com/spdji/en/research-insights/spiva/" },
  { id: "buffett", tags: ["etf", "ki"], title: "Buffetts Erfolg ist erstaunlich erklärbar",
    text: "Ein Großteil von Warren Buffetts Rendite lässt sich so erklären: günstige, sichere, profitable Qualitätsfirmen kaufen, sehr lange halten, und das mit rund 1,6-fachem Hebel aus billigem Versicherungsgeld.",
    so: "Das Rezept ist bekannt, schwer ist das Durchhalten. Buffett lag zwischendurch jahrelang hinter dem Markt.",
    cite: "Frazzini, Kabiller & Pedersen (2018), Financial Analysts Journal", q: "Frazzini Kabiller Pedersen Buffett's Alpha" },
  { id: "tricks-verblassen", tags: ["ki", "krypto", "etf"], title: "Bekannte Börsentricks verlieren an Kraft",
    text: "Nachdem Forscher eine Renditequelle veröffentlicht hatten, war sie danach im Schnitt 58 % schwächer (97 untersuchte Effekte).",
    so: "Was alle kennen, ist meist schon im Preis. Vorsicht bei „geheimen“ Strategien aus Videos und Foren.",
    cite: "McLean & Pontiff (2016), Journal of Finance", q: "McLean Pontiff Does academic research destroy stock return predictability" },
  { id: "themen-etf", tags: ["ki"], title: "Themen-ETFs kommen oft zu spät",
    text: "Spezial- und Themen-ETFs werden meist aufgelegt, wenn die Aktien darin schon stark gestiegen und teuer sind. Danach schneiden sie im Schnitt deutlich schlechter ab als breite Fonds.",
    so: "Ein Trend kann echt sein und das Investment trotzdem zu teuer. Das Radar zeigt deshalb Hype und Bewertung getrennt.",
    cite: "Ben-David, Franzoni, Kim & Moussawi (2023), Review of Financial Studies", q: "Competition for Attention in the ETF Space" },
  { id: "aufmerksamkeit", tags: ["ki", "krypto"], title: "Aufmerksamkeit ist ein Frühsignal, mit Haken",
    text: "Springen die Google-Suchen nach einer Aktie hoch, steigt der Kurs oft in den nächsten zwei Wochen und fällt später wieder zurück.",
    so: "Aufmerksamkeit zeigt Trends früh, aber auch Übertreibungen. Darum misst das Radar Aufmerksamkeit (Wikipedia, Nachrichten) und zeigt die Beweislage dazu.",
    cite: "Da, Engelberg & Gao (2011), Journal of Finance", q: "Da Engelberg Gao In search of attention" },
  { id: "blasen", tags: ["ki", "krypto"], title: "Woran man Blasen eher erkennt",
    text: "Ein starker Anstieg allein sagt wenig. Kommen Verdopplung in zwei Jahren, steigende Schwankung, viele Börsengänge und Beschleunigung zusammen, steigt das Absturzrisiko deutlich, sicher vorhersagen lässt es sich trotzdem nicht.",
    so: "Das Blasen-Meter im Radar kombiniert genau solche Zeichen statt nur auf den Kurs zu schauen.",
    cite: "Greenwood, Shleifer & You (2019), Journal of Financial Economics", q: "Greenwood Shleifer You Bubbles for Fama" },
  { id: "krypto-treiber", tags: ["krypto"], title: "Was Krypto-Kurse wirklich treibt",
    text: "Krypto-Renditen hängen kaum an klassischen Börsenfaktoren. Sie werden vor allem von Momentum (was stieg, steigt kurzfristig oft weiter) und von der Aufmerksamkeit der Anleger getrieben.",
    so: "Darum zeigt das Radar bei Krypto Stimmung, Suchinteresse und Geldflüsse (Stablecoins) statt Kennzahlen wie bei Aktien.",
    cite: "Liu & Tsyvinski (2021), Review of Financial Studies", q: "Liu Tsyvinski Risks and returns of cryptocurrency" },
  { id: "insider", tags: ["etf", "ki"], title: "Nicht jeder Insider-Kauf zählt",
    text: "Routinemäßige Käufe (jedes Jahr zur selben Zeit) sagen nichts voraus. Aussagekräftig sind ungewöhnliche Käufe, mit denen Vorstände von ihrem Muster abweichen.",
    so: "Das Radar hebt deshalb Käufe hervor, bei denen mehrere Insider gleichzeitig kaufen.",
    cite: "Cohen, Malloy & Pomorski (2012), Journal of Finance", q: "Cohen Malloy Pomorski Decoding inside information" },
  { id: "terminkurve", tags: ["rohstoffe", "einkauf"], title: "Die Terminkurve verrät Knappheit",
    text: "Liegt der Preis für spätere Lieferung unter dem heutigen Preis (Backwardation), ist eine Ware knapp. Dieser Preisabstand („Carry“) sagt über viele Märkte hinweg die Renditen von Rohstoff-Terminkontrakten voraus.",
    so: "Für Anleger heißt das: Bei Rohstoff-ETCs zählt nicht nur der heutige Preis, sondern auch, ob spätere Monate teurer oder billiger sind. Das entscheidet mit über die Rendite.",
    cite: "Koijen, Moskowitz, Pedersen & Vrugt (2018), Journal of Financial Economics", q: "Koijen Moskowitz Pedersen Vrugt Carry" },
  { id: "trends-halten", tags: ["rohstoffe", "einkauf", "etf"], title: "Preistrends halten oft rund ein Jahr",
    text: "In 58 Terminmärkten (Rohstoffe, Währungen, Anleihen, Aktienindizes) setzte sich die Richtung der letzten 12 Monate im Schnitt fort, über längere Zeit kehrte sie sich teilweise um.",
    so: "Ein Preis, der ein Jahr lang gestiegen ist, ist nicht automatisch „zu hoch“. Dauerhaft steigt er aber auch nicht.",
    cite: "Moskowitz, Ooi & Pedersen (2012), Journal of Financial Economics", q: "Moskowitz Ooi Pedersen Time series momentum" },
  { id: "rohstoff-rendite", tags: ["rohstoffe"], title: "Rohstoffe streuen, aber nicht immer",
    text: "Über Jahrzehnte brachten breit gestreute Rohstoff-Terminkontrakte ähnliche Renditen wie Aktien und liefen oft anders als Aktien und Anleihen, besonders bei unerwarteter Inflation.",
    so: "Eine kleine Beimischung kann das Depot stabiler machen. Einzelne Rohstoffe schwanken aber stark, und Terminkontrakte haben eigene Kosten beim Wechsel in den nächsten Monat.",
    cite: "Gorton & Rouwenhorst (2006), Financial Analysts Journal", q: "Gorton Rouwenhorst Facts and fantasies about commodity futures" },
  { id: "immo-rendite", tags: ["immo_neu", "immo_haben"], title: "Wohnimmobilien: ähnliche Rendite wie Aktien, anderes Risiko",
    text: "Über 145 Jahre in 16 Ländern brachten Wohnimmobilien (Miete plus Wertsteigerung) ähnlich viel wie Aktien, rund 7 % pro Jahr nach Inflation, und schwankten deutlich weniger.",
    so: "Der Haken: Ein einzelnes Haus ist nicht gestreut, teuer zu kaufen und zu verkaufen, und Arbeit macht es auch. Die Durchschnittszahl gilt für viele Häuser, nicht für eines.",
    cite: "Jordà, Knoll, Kuvshinov, Schularick & Taylor (2019), Quarterly Journal of Economics", q: "The Rate of Return on Everything 1870-2015" },
  { id: "leerverkaeufer", tags: ["etf"], title: "Leerverkäufer sind gute Warner",
    text: "Wie viele Aktien insgesamt leerverkauft sind (Wetten auf fallende Kurse), gehört zu den stärksten bekannten Signalen für die künftige Rendite des Gesamtmarkts.",
    so: "Leerverkäufer sind oft gut informierte Profis. Steigt ihr Anteil breit, ist das ein Warnzeichen, kein Verkaufssignal.",
    cite: "Rapach, Ringgenberg & Zhou (2016), Journal of Financial Economics", q: "Rapach Ringgenberg Zhou Short interest and aggregate stock returns" },
  { id: "ki-liest-news", tags: ["ki"], title: "KI liest Nachrichten, mit Grenzen", wp: true,
    text: "Große Sprachmodelle können aus Schlagzeilen die Kursreaktion des nächsten Tages teilweise vorhersagen, vor allem bei kleinen Firmen und schlechten Nachrichten. Andere Studien zeigen: KI schreibt vergangene Kurstrends zu stark fort.",
    so: "KI ist ein guter Leser, kein Hellseher. Das Radar nutzt sie zum Zusammenfassen, nicht für Kursprognosen.",
    cite: "Lopez-Lira & Tang; Chen, Green, Gulen & Zhou (Arbeitspapiere 2023–2025, noch nicht begutachtet)", q: "Lopez-Lira Tang Can ChatGPT forecast stock price movements" },
];
export const factUrl = (f) => f.url || scholar(f.q);

// ---------- live lines per profile (pure, tested) ----------
const find = (list, k, v) => (list || []).find((x) => x?.[k] === v);
/** Monthly payment for an annuity loan: interest + repayment as share of the loan per year. */
export const loanPayment = (amount, rate, repay = 0.02) => (amount * (rate + repay)) / 12;
/** Price change in euro for a dollar-quoted commodity: (1 + change in $) / (1 + change of EUR/USD) − 1. */
export const inEuro = (chgUsd, chgEurUsd) => (ok(chgUsd) && ok(chgEurUsd) ? (1 + chgUsd) / (1 + chgEurUsd) - 1 : null);
const nf0 = (x) => fmt(Math.round(x));

/** Returns [{t: text, go: "view:anchor" | "detail:<key>"}] for one profile. Missing data → line left out. */
export function personaLines(id, d = {}, ctx = {}) {
  const L = [], add = (t, go) => t && L.push({ t, go });
  const asset = (k) => find(d.assets, "id", k);
  if (id === "etf") {
    const w = asset("world");
    if (w && ok(w.chg1y)) add(`MSCI World: ${pct(w.chg1y, 0)} in 1 Jahr${ok(w.fromHigh) ? `, ${w.fromHigh > -0.03 ? "nahe am Rekordhoch" : `${pct(w.fromHigh, 0)} unter dem Hoch`}` : ""}.`, "detail:asset:world");
    const p = ctx.plan || {};
    if (p.monthly > 0) add(`Dein Plan: ${nf0(p.monthly)} € im Monat über ${p.years || 15} Jahre. Durchhalten ist der wichtigste Hebel.`, "plan:plan");
    const gap = (1.058 / 1.045) ** 30 - 1;
    add(`Kosten zählen: Ein ETF mit 0,2 % statt eines Fonds mit 1,5 % Kosten pro Jahr bringt über 30 Jahre rund ${fmt(gap * 100)} % mehr Endvermögen (Annahme: 6 % Rendite vor Kosten).`, "plan:plan");
    if (ok(d.bubble?.score)) add(`Blasen-Meter: ${d.bubble.score}/100 (${d.bubble.zone}). Für einen Sparplan kein Grund zu stoppen, eher zum Prüfen der Aufteilung.`, "heute:lage");
  }
  if (id === "krypto") {
    for (const k of ["btc", "eth"]) { const a = asset(k); if (a && ok(a.chg1m)) add(`${a.name}: ${pct(a.chg1m)} in 1 Monat${ok(a.fromHigh) ? `, ${pct(a.fromHigh, 0)} vom Jahreshoch` : ""}.`, `detail:asset:${k}`); }
    if (ok(d.fearGreed?.value)) add(`Krypto-Stimmung: ${d.fearGreed.value}/100${d.fearGreed.value >= 75 ? " (Gier)" : d.fearGreed.value <= 25 ? " (Angst)" : ""}.`, "detail:info:cryptofng");
    const sc = d.cryptoFlows?.stablecoins;
    if (sc && ok(sc.chg30)) add(`Stablecoins (Krypto-Bargeld): ${compact(sc.value)} $, ${pct(sc.chg30)} in 30 Tagen. ${sc.chg30 > 0 ? "Frisches Geld fließt in den Markt." : "Geld fließt eher ab."}`, "detail:info:stablecoins");
    const tr = (d.cryptoTrending || []).slice(0, 3).map((c) => c.name).filter(Boolean);
    if (tr.length) add(`Gerade am meisten gesucht: ${tr.join(", ")}. Suchinteresse ist ein Frühsignal, aber auch ein Hype-Zeichen.`, "detail:info:cryptotrend");
  }
  if (id === "ki") {
    const j = d.aiJobs?.DE;
    if (j && ok(j.share)) add(`Frühsignal Stellenanzeigen: ${fmt(j.share * 100, 1)} % aller Jobs in Deutschland erwähnen KI${ok(j.yearAgo) ? ` (vor einem Jahr ${fmt(j.yearAgo * 100, 1)} %)` : ""}. Firmen stellen ein, bevor Umsätze sichtbar werden.`, "detail:info:aijobs");
    const ad = [...(d.adoption || [])].filter((a) => ok(a.growth)).sort((a, b) => b.growth - a.growth)[0];
    if (ad) add(`Am schnellsten wachsende KI-Software: ${ad.name}, ${pct(ad.growth, 0)} Downloads zur Vorwoche (echte Nutzung durch Entwickler).`, "detail:info:adoption");
    const r = d.tech?.repos?.[0];
    if (r) add(`Meiste neue Lesezeichen auf GitHub: ${r.name}${r.ticker ? ` (dahinter: ${r.ticker})` : ""}.`, "detail:repo:0");
    if (ok(d.bubble?.score)) { const nv = find(d.bubble.components, "id", "nvda"); add(`KI-Blasen-Check: ${d.bubble.score}/100 (${d.bubble.zone})${nv && ok(nv.raw) ? `, Nvidia ${pct(nv.raw, 0)} gegenüber dem 200-Tage-Schnitt` : ""}.`, "heute:lage"); }
  }
  if (id === "rohstoffe") {
    const fx = find(d.market, "sym", "EURUSD=X"), eur = (c) => (/€/.test(c?.unit || "") ? c.chg1m : inEuro(c?.chg1m, fx?.chg1m));
    for (const k of ["gold", "silver"]) {
      const c = find(d.commodities, "id", k), e1 = eur(c), e1y = c && ok(c.chg1y) ? inEuro(c.chg1y, fx?.chg1y) : null;
      if (c && ok(e1)) add(`${c.name} in Euro: ${pct(e1)} in 1 Monat${ok(e1y) ? `, ${pct(e1y, 0)} in 1 Jahr` : ""}${ok(c.pos52) ? `, ${fmt(c.pos52 * 100)} % der Jahresspanne` : ""}.`, `detail:com:${k}`);
    }
    const moves = (d.commodities || []).map((c) => ({ c, e: eur(c) })).filter((x) => ok(x.e)).sort((a, b) => Math.abs(b.e) - Math.abs(a.e)).slice(0, 3);
    if (moves.length) add(`Größte Bewegungen in Euro (1 Monat): ${moves.map((x) => `${x.c.name} ${pct(x.e, 0)}`).join(", ")}. Starke Ausschläge sind bei Rohstoffen normal.`, `detail:com:${moves[0].c.id}`);
    if (fx && ok(fx.chg1m)) add(`Euro zum Dollar: ${pct(fx.chg1m)} in 1 Monat. Rohstoffe kosten in Dollar, ein stärkerer Euro drückt deinen Gewinn in Euro.`, "detail:mkt:EURUSD=X");
    add("So legen Privatanleger an: Gold physisch oder als Xetra-Gold (nach 1 Jahr Haltedauer steuerfrei), sonst breit gestreute Rohstoff-ETCs statt Einzelwetten. Als Beimischung von etwa 5–10 %, nicht als Kern.", "entdecken:rohstoffe");
  }
  if (id === "einkauf") {
    const fx = find(d.market, "sym", "EURUSD=X");
    if (fx && ok(fx.chg1m)) add(`Euro zum Dollar: ${pct(fx.chg1m)} in 1 Monat. In Dollar gehandelte Rohstoffe werden dadurch für Euro-Käufer ${fx.chg1m > 0 ? "billiger" : "teurer"}.`, "detail:mkt:EURUSD=X");
    const moves = (d.commodities || []).map((c) => ({ c, e: /€/.test(c.unit || "") ? c.chg1m : inEuro(c.chg1m, fx?.chg1m) })).filter((x) => ok(x.e)).sort((a, b) => Math.abs(b.e) - Math.abs(a.e)).slice(0, 3);
    if (moves.length) add(`Größte Preisbewegungen in Euro (1 Monat): ${moves.map((x) => `${x.c.name} ${pct(x.e, 0)}`).join(", ")}.`, `detail:com:${moves[0].c.id}`);
    const near = (d.commodities || []).filter((c) => ok(c.pos52) && c.pos52 <= 0.15).map((c) => c.name).slice(0, 4);
    if (near.length) add(`Nahe am Jahrestief: ${near.join(", ")}. Zeitpunkt, um Preise für die nächsten Monate festzuschreiben, zu prüfen.`, "entdecken:rohstoffe");
    const ttf = find(d.commodities, "id", "ttf");
    if (ttf && ok(ttf.last)) add(`Erdgas Europa (TTF): ${fmt(ttf.last, 1)} €/MWh, ${pct(ttf.chg1m)} in 1 Monat.`, "detail:com:ttf");
    if (ok(d.power?.avg)) add(`Strom Deutschland (Börse): heute im Schnitt ${fmt(d.power.avg)} €/MWh${ok(d.power.avg30) ? `, 30-Tage-Schnitt ${fmt(d.power.avg30)} €/MWh` : ""}.`, "detail:info:power");
  }
  if (id === "immo_neu" || id === "immo_haben") {
    const m = d.realEstate?.mortgage, s = m?.series || [];
    const yr = s.length > 12 ? s[s.length - 13].value / 100 : null;
    if (m && ok(m.rate)) add(`Bauzinsen (EZB-Statistik, ${m.period || ""}): ${fmt(m.rate * 100, 2)} %${ok(yr) ? `, vor einem Jahr ${fmt(yr * 100, 2)} %` : ""}.`, "detail:info:mortgage");
    if (id === "immo_neu" && m && ok(m.rate)) add(`Beispiel: 300.000 € Kredit mit 2 % Tilgung kosten bei diesem Zins rund ${nf0(loanPayment(300000, m.rate))} € im Monat.`, "entdecken:immobilien");
    if (id === "immo_haben" && m && ok(m.rate)) add(`Anschlussfinanzierung: Jeder Prozentpunkt mehr Zins kostet bei 200.000 € Restschuld rund ${nf0(loanPayment(200000, 0.01, 0))} € mehr im Monat. Mit einem Forward-Darlehen lassen sich Zinsen meist bis zu 5 Jahre vorab festschreiben.`, "entdecken:immobilien");
    const h = d.realEstate?.hpi;
    if (h && ok(h.yoy)) add(`Hauspreise Deutschland: ${pct(h.yoy)} zum Vorjahr (Eurostat, ${h.period || ""}).`, "detail:info:hpi");
  }
  return L;
}

// ---------- rendering ----------
const goAttr = (go) => (go.startsWith("detail:") ? `data-detail="${esc(go.slice(7))}" tabindex="0" role="button"` : `data-goto="${esc(go)}"`);
export function renderMyRadar() {
  const box = $("#meinradar"); if (!box) return;
  const mine = personas(), d = state.data || {};
  const chips = PERSONAS.map((p) => `<button type="button" class="chip-btn ${mine.includes(p.id) ? "on" : ""}" data-persona="${p.id}">${p.icon} ${esc(p.label)}</button>`).join("");
  const cards = mine.map((id) => {
    const p = PERSONAS.find((x) => x.id === id), lines = personaLines(id, d, { plan: store.get("plan", {}) || {} });
    const pool = FACTS.filter((x) => x.tags.includes(id)), f = pool[Math.floor(Date.now() / 864e5) % (pool.length || 1)]; // a different fact each day
    return `<article class="pr-card"><h3>${p.icon} ${esc(p.label)}</h3>
      <ul class="pr-lines">${lines.map((l) => `<li><button type="button" class="pr-line" ${goAttr(l.go)}>${esc(l.t)}<span class="go">›</span></button></li>`).join("") || '<li class="fine">Noch keine Daten, gleich wieder reinschauen.</li>'}</ul>
      ${f ? `<p class="pr-fact">📚 <b>Was die wenigsten wissen:</b> ${esc(f.title)}. <button type="button" class="link-btn" data-goto="wissen:fakt-${f.id}">Mehr</button></p>` : ""}</article>`;
  }).join("");
  const topics = myTopics(), news = [...(state.live || []), ...(d.news || [])];
  const topicCard = topics.length ? `<article class="pr-card"><h3>🔎 Deine eigenen Themen</h3><ul class="pr-lines">${topics.map((k) => {
    const hits = news.filter((n) => n?.title && matchesTopic(n.title, [k])), wk = hits.filter((n) => (n.published || 0) > Date.now() - 7 * 864e5).length;
    return `<li><button type="button" class="pr-line" data-topic="${esc(k)}"><span><b>${esc(k)}</b>: ${wk ? `${wk} Meldung${wk === 1 ? "" : "en"} in 7 Tagen${hits[0] ? ` · neu: ${esc(hits[0].title.slice(0, 90))}` : ""}` : "gerade keine Meldung im Radar"}</span><span class="go">›</span></button></li>`;
  }).join("")}</ul><p class="fine">Antippen zeigt alle Meldungen dazu. Ändern unter Menü → „Persönlich einrichten“ oder in der Suche „Als Thema merken“.</p></article>` : "";
  box.innerHTML = `<div class="card-head"><div><h2>Dein Radar</h2><p class="sub">${mine.length ? "Live-Daten und Forschung, passend zu dem, wofür du das Radar nutzt. Antippen führt zu den Details." : "Wofür nutzt du das Radar? Tipp an, was passt (mehrere möglich), dann bekommst du hier deine eigenen Live-Infos."}</p></div></div>
    <div class="chips-wrap pr-chips">${chips}</div>${cards || topicCard ? `<div class="pr-grid">${topicCard}${cards}</div>` : ""}
    <p class="fine">Quellen: Yahoo Finance, CoinGecko, DefiLlama, EZB, Eurostat, Energy-Charts, Indeed Hiring Lab, PyPI/npm, GitHub. Beobachtungen und Regeln, keine Anlageberatung.</p>`;
}
export function renderFacts() {
  const box = $("#wenigeList"); if (!box) return;
  const mine = personas();
  const list = [...FACTS].sort((a, b) => Number(b.tags.some((t) => mine.includes(t))) - Number(a.tags.some((t) => mine.includes(t))));
  box.innerHTML = list.map((f) => `<details class="fact" id="fakt-${f.id}"><summary><b>${esc(f.title)}</b>${f.wp ? ' <span class="badge b-noise">Arbeitspapier</span>' : ' <span class="badge b-quiet">✓ begutachtet</span>'}</summary>
    <p>${esc(f.text)}</p><p><b>Was heißt das?</b> ${esc(f.so)}</p>
    <p class="fine">Quelle: <a href="${esc(factUrl(f))}" target="_blank" rel="noopener">${esc(f.cite)} ↗</a></p></details>`).join("");
}
export function initPersonas(onChange) {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("#meinradar [data-persona]"); if (!b) return;
    const k = b.dataset.persona, cur = personas();
    store.set("personas", cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]);
    renderMyRadar(); renderFacts(); onChange?.();
  });
}
