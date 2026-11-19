// Detail view for any item (asset, commodity, AI project, study): key points, chart, sources, further reading.
import { $, esc, fmt, pct, ok, dirCls, safeUrl, lineChart, dayLabels, state, compact } from "./ui.js";

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

function show({ title, badge = "", sub = "", kpis = [], series = null, end = Date.now(), body = "", points = [], links = [] }) {
  $("#drawerBody").innerHTML = `<h2 id="drawerTitle">${esc(title)}</h2>${badge}
    ${sub ? `<p class="sub">${sub}</p>` : ""}
    ${kpis.length ? `<div class="kpi-grid">${kpis.map(([l, v, c]) => `<div class="kpi"><span>${esc(l)}</span><b class="${c || ""}">${v}</b></div>`).join("")}</div>` : ""}
    ${series ? '<div class="chart"><h4>Verlauf, ca. 3 Monate</h4><div id="dSeries"></div></div>' : ""}
    ${points.length ? `<h3>Das Wichtigste</h3><ul class="points">${points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    ${body}
    ${links.length ? `<h3>Weiterlesen &amp; Quellen</h3><div class="link-list">${links.map(([l, u]) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("")}</div>` : ""}
    <p class="fine">Regelbasiert zusammengefasst aus den Daten der letzten Aktualisierung. Keine Anlageberatung.</p>`;
  $("#drawer").hidden = false;
  document.body.style.overflow = "hidden";
  if (series) lineChart($("#dSeries"), series, { labels: dayLabels(series.length, end, 1), fmtV: (v) => fmt(v, 2) });
  $(".drawer-close").focus();
}

function priceKpis(x) {
  return [["1 Tag", pct(x.chg1d), dirCls(x.chg1d)], ["1 Monat", pct(x.chg1m), dirCls(x.chg1m)], ["3 Monate", pct(x.chg3m, 0), dirCls(x.chg3m)],
    ["1 Jahr", pct(x.chg1y, 0), dirCls(x.chg1y)], ["vs. 200 Tage", pct(x.ext200, 0), dirCls(x.ext200)], ["RSI (14)", fmt(x.rsi)],
    ["Schwankung p. a.", ok(x.vol) ? pct(x.vol, 0).replace("+", "") : "–"], ["Risikoklasse", ok(x.riskClass) ? `${x.riskClass} von 7` : "–"]];
}

/** key: "asset:<id>", "com:<id>", "repo:<i>", "model:<i>", "paper:<list>:<i>", "study:<i>" */
export function openDetailFor(key) {
  const d = state.data; if (!d) return false;
  const [kind, a, b] = key.split(":");
  if (kind === "asset" || kind === "com") {
    const x = (kind === "asset" ? d.assets : d.commodities)?.find((v) => v.id === a); if (!x) return false;
    show({
      title: x.name, sub: esc(x.what || `${x.group || "Rohstoff"}${x.unit ? ` · ${x.unit}` : ""} · Kürzel ${x.sym}`),
      kpis: priceKpis(x), series: x.spark, end: x.sparkEnd,
      points: pricePoints(x),
      body: x.examples ? `<p class="fine">${esc(x.examples)}</p>` : "",
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
