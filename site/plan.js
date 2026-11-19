// „Mein Plan“: Beispiel-Aufteilung, Prognose-Spanne (Monte Carlo), Crash-Test, Anti-Hype-Regeln.
// Bildung, keine Beratung: feste, dokumentierte Annahmen; alles läuft lokal im Browser.
import { $, esc, fmt, pct, ok, store, state, showTip, hideTip, scaleFn, toast } from "./ui.js";
import { LUMP_SUM_RULE } from "./signals.js";

// Reihenfolge = Farbreihenfolge der geprüften Kategorien-Palette (Nachbarn bleiben unterscheidbar)
export const BUCKETS = [
  { id: "world", label: "Welt-Aktien-ETF", color: "var(--c1)", mu: 0.07, vol: 0.16, crash: -0.5, how: "Breiter ETF auf MSCI World oder FTSE All-World, z. B. iShares Core MSCI World (IE00B4L5Y983) oder Vanguard FTSE All-World (IE00BK5BQT80). Kosten unter 0,25 % pro Jahr." },
  { id: "em", label: "Schwellenländer-ETF", color: "var(--c2)", mu: 0.075, vol: 0.20, crash: -0.55, how: "MSCI Emerging Markets ETF. Oder du wählst einen FTSE All-World, da sind Schwellenländer schon drin." },
  { id: "bonds", label: "Anleihen", color: "var(--c3)", mu: 0.03, vol: 0.06, crash: 0.03, how: "ETF auf Euro-Staatsanleihen guter Bonität. Puffer, wenn Aktien fallen." },
  { id: "gold", label: "Gold", color: "var(--c4)", mu: 0.04, vol: 0.15, crash: 0.05, how: "Physisch hinterlegtes Gold-ETC, z. B. Xetra-Gold (DE000A0S9GB0). Nach 1 Jahr Haltedauer in Deutschland steuerfrei." },
  { id: "btc", label: "Bitcoin", color: "var(--c5)", mu: 0.08, vol: 0.65, crash: -0.75, how: "Nur Spielgeld. Über einen Bitcoin-ETP an der Börse oder eine regulierte Krypto-Börse kaufen und keine Coins auf unbekannten Plattformen lagern." },
  { id: "cash", label: "Tagesgeld", color: "var(--c6)", mu: 0.02, vol: 0.005, crash: 0, how: "Bei einer Bank mit gesetzlicher Einlagensicherung (100.000 € pro Bank). Jederzeit verfügbar." },
  { id: "themes", label: "Themen (Satellit)", color: "var(--c7)", mu: 0.07, vol: 0.35, crash: -0.65, how: "Kleine Beimischung in Trend-Themen, die laut Radar steigen, aber nicht überhitzt sind." },
];
const B = Object.fromEntries(BUCKETS.map((b) => [b.id, b]));
const PROFILES = {
  sicherheit: { label: "Sicherheit", world: 30, em: 0, bonds: 25, gold: 5, btc: 0, cash: 40, themes: 0 },
  ausgewogen: { label: "Ausgewogen", world: 55, em: 5, bonds: 20, gold: 7, btc: 1, cash: 10, themes: 2 },
  wachstum: { label: "Wachstum", world: 60, em: 10, bonds: 10, gold: 6, btc: 3, cash: 5, themes: 6 },
  mutig: { label: "Mutig", world: 58, em: 12, bonds: 5, gold: 5, btc: 5, cash: 0, themes: 15 },
  kurz: { label: "Kurzfristig", world: 0, em: 0, bonds: 20, gold: 0, btc: 0, cash: 80, themes: 0 },
};
const ORDER = ["sicherheit", "ausgewogen", "wachstum", "mutig"];
const EQ = new Set(["world", "em", "themes"]);
function corr(a, b) {
  if (a === b) return 1;
  if (a === "cash" || b === "cash") return 0;
  if (EQ.has(a) && EQ.has(b)) return 0.8;
  if ((a === "btc" && EQ.has(b)) || (b === "btc" && EQ.has(a))) return 0.4;
  if (a === "bonds" || b === "bonds") return 0.05;
  return 0.1;
}
const eur = (x) => (ok(x) ? fmt(Math.round(x)) + " €" : "–");

function readForm() {
  const f = new FormData($("#planForm"));
  return {
    once: Math.max(0, Number(f.get("once")) || 0), monthly: Math.max(0, Number(f.get("monthly")) || 0),
    years: Number(f.get("years")) || 15, reserve: f.get("reserve") || "yes",
    q: [f.get("q1"), f.get("q2"), f.get("q3")].map((x) => Number(x ?? 1)), profile: f.get("profile") || "auto",
  };
}

/** Ermittelt Profil, Gewichte und Begründungen aus Eingaben + aktueller Marktlage. */
export function buildPlan(inp, d) {
  const notes = [];
  const score = inp.q.reduce((s, x) => s + x, 0);
  let prof = inp.profile !== "auto" ? inp.profile : score <= 1 ? "sicherheit" : score <= 3 ? "ausgewogen" : score <= 5 ? "wachstum" : "mutig";
  if (inp.q[0] === 0 && ORDER.indexOf(prof) > 1) { prof = "ausgewogen"; notes.push("Du würdest bei −30 % verkaufen, deshalb höchstens „Ausgewogen“. Wer im Crash verkauft, macht Verluste endgültig."); }
  if (inp.years < 3) { prof = "kurz"; notes.push("Geld, das du in weniger als 3 Jahren brauchst, gehört nicht an die Börse. Ein Crash kann 3–5 Jahre dauern."); }
  else if (inp.years < 5 && ORDER.indexOf(prof) > 1) { prof = "ausgewogen"; notes.push("Unter 5 Jahren Anlagedauer ist „Ausgewogen“ die Obergrenze."); }
  else if (inp.years < 10 && prof === "mutig") { prof = "wachstum"; notes.push("Unter 10 Jahren lieber „Wachstum“ statt „Mutig“."); }
  const w = { ...PROFILES[prof] }; delete w.label;

  // Marktlage einbeziehen (Anti-Hype)
  const bubble = d?.bubble?.score, level = d?.risk?.level;
  let stagger = false;
  if ((ok(bubble) && bubble >= 70) || level === "rot") {
    const cut = Math.round(w.themes / 2); w.themes -= cut; w.world += cut;
    if (cut) notes.push(`Blasen-Meter ${fmt(bubble)}: Themen-Anteil halbiert (−${cut} %), das Geld geht in den Welt-ETF.`);
  }
  const fng = d?.fearGreed?.value, cryptoHot = d?.themes?.find((t) => t.id === "crypto")?.scores?.quadrant === "overheated";
  if (w.btc > 0 && ((ok(fng) && fng >= 80) || cryptoHot)) { const cut = Math.ceil(w.btc / 2); w.btc -= cut; w.gold += cut; notes.push(`Krypto ist gerade gierig (Fear & Greed ${fmt(fng)}): Bitcoin-Anteil halbiert, Rest in Gold.`); }
  if (ok(d?.rates?.ecb)) B.cash.mu = d.rates.ecb;

  // Themen-Satellit: nur steigende, nicht überhitzte Themen
  const pool = (d?.themes || []).filter((t) => ["quiet", "hot"].includes(t.scores.quadrant) && ok(t.scores.heat) && t.scores.heat < 70 && ok(t.scores.momentum));
  const ranked = pool.map((t) => ({ t, s: t.scores.momentum * (100 - t.scores.heat) * (t.scores.quadrant === "quiet" ? 1.3 : 1) })).sort((a, b) => b.s - a.s).slice(0, 3);
  const sumS = ranked.reduce((s, x) => s + x.s, 0);
  const themePicks = ranked.map(({ t, s }) => ({ id: t.id, name: t.name, etf: t.etf, quadrant: t.scores.quadrant, share: sumS ? s / sumS : 0 }));
  if (w.themes > 0 && !themePicks.length) { w.world += w.themes; w.themes = 0; notes.push("Gerade erfüllt kein Thema die Regeln (steigend und nicht überhitzt). Der Themen-Anteil geht in den Welt-ETF."); }
  const overheated = (d?.themes || []).filter((t) => t.scores.quadrant === "overheated").map((t) => t.name);

  // Kennzahlen
  const ids = BUCKETS.map((b) => b.id);
  const wt = Object.fromEntries(ids.map((k) => [k, (w[k] || 0) / 100]));
  const mu = ids.reduce((s, k) => s + wt[k] * B[k].mu, 0);
  let varp = 0;
  for (const a of ids) for (const b of ids) varp += wt[a] * wt[b] * B[a].vol * B[b].vol * corr(a, b);
  const sigma = Math.sqrt(varp);
  const crash = ids.reduce((s, k) => s + wt[k] * B[k].crash, 0);
  return { prof, label: PROFILES[prof].label, weights: w, mu, sigma, crash, stagger, notes, themePicks, overheated, reserve: inp.reserve };
}

/** Monte Carlo: Perzentile des Depotwerts je Jahr. */
export function simulate({ once, monthly, years, mu, sigma }, paths = 2000) {
  const m = years * 12, dm = (mu - sigma * sigma / 2) / 12, sm = sigma / Math.sqrt(12);
  const byYear = Array.from({ length: years + 1 }, () => new Float64Array(paths));
  let seed = 12345;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  for (let p = 0; p < paths; p++) {
    let v = once; byYear[0][p] = v;
    for (let i = 1; i <= m; i++) { v = (v + monthly) * Math.exp(dm + sm * gauss()); if (i % 12 === 0) byYear[i / 12][p] = v; }
  }
  const q = (arr, x) => { const s = Array.from(arr).sort((a, b) => a - b); return s[Math.floor(x * (s.length - 1))]; };
  return byYear.map((arr, y) => ({ y, p10: q(arr, 0.1), p50: q(arr, 0.5), p90: q(arr, 0.9), paid: once + monthly * 12 * y }));
}

function donut(weights) {
  const R = 70, r = 46, C = 90;
  let a0 = -Math.PI / 2;
  const segs = BUCKETS.filter((b) => weights[b.id] > 0).map((b) => {
    const frac = weights[b.id] / 100, a1 = a0 + frac * Math.PI * 2, gap = frac < 1 ? 0.012 : 0;
    const p = (a, rad) => [C + rad * Math.cos(a), C + rad * Math.sin(a)];
    const [x1, y1] = p(a0 + gap, R), [x2, y2] = p(a1 - gap, R), [x3, y3] = p(a1 - gap, r), [x4, y4] = p(a0 + gap, r);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = frac >= 0.999
      ? `M${C} ${C - R}A${R} ${R} 0 1 1 ${C - 0.01} ${C - R}L${C - 0.01} ${C - r}A${r} ${r} 0 1 0 ${C} ${C - r}Z`
      : `M${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${large} 0 ${x4} ${y4}Z`;
    a0 = a1;
    return `<path d="${d}" fill="${b.color}" data-tip="${esc(`<b>${b.label}</b>: ${weights[b.id]} %`)}"/>`;
  }).join("");
  return `<svg viewBox="0 0 180 180" class="donut" role="img" aria-label="Aufteilung">${segs}</svg>`;
}

function fanChart(el, sim) {
  const w = Math.max(280, el.clientWidth || 520), h = 220, L = 58, Rr = 8, T = 10, Bm = 24;
  const max = Math.max(...sim.map((s) => s.p90)) * 1.05 || 1;
  const sx = scaleFn(0, sim.length - 1, L, w - Rr), sy = scaleFn(0, max, h - Bm, T);
  const line = (k) => sim.map((s, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)} ${sy(s[k]).toFixed(1)}`).join("");
  const band = `${line("p90")}${sim.map((s, i) => `L${sx(sim.length - 1 - i).toFixed(1)} ${sy(sim[sim.length - 1 - i].p10).toFixed(1)}`).join("")}Z`;
  const ticks = [0, max / 2, max * 0.95].map((v) => Math.round(v / 1000) * 1000);
  const yl = sim.length - 1;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="height:${h}px">
    ${ticks.map((t) => `<line x1="${L}" x2="${w - Rr}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--grid)"/><text x="${L - 6}" y="${sy(t) + 4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${t >= 1e6 ? fmt(t / 1e6, 1) + " Mio" : fmt(t / 1000) + " T"}</text>`).join("")}
    <path d="${band}" fill="var(--s1)" opacity=".16"/>
    <path d="${line("paid")}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 4"/>
    <path d="${line("p50")}" fill="none" stroke="var(--s1)" stroke-width="2.5"/>
    <text x="${L}" y="${h - 6}" font-size="10.5" fill="var(--muted)">heute</text><text x="${w - Rr}" y="${h - 6}" font-size="10.5" fill="var(--muted)" text-anchor="end">in ${yl} Jahren</text>
    <g class="xh" visibility="hidden"><line y1="${T}" y2="${h - Bm}" stroke="var(--ink-2)"/><circle r="4.5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/></g>
    <rect x="${L}" y="0" width="${w - L - Rr}" height="${h}" fill="transparent"/></svg>`;
  const svg = el.querySelector("svg"), xh = svg.querySelector(".xh");
  const move = (ev) => {
    const r = svg.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * w;
    const i = Math.max(0, Math.min(yl, Math.round(((x - L) / (w - L - Rr)) * yl)));
    const s = sim[i];
    xh.setAttribute("visibility", "visible");
    xh.querySelector("line").setAttribute("x1", sx(i)); xh.querySelector("line").setAttribute("x2", sx(i));
    xh.querySelector("circle").setAttribute("cx", sx(i)); xh.querySelector("circle").setAttribute("cy", sy(s.p50));
    showTip(ev, `<b>Nach ${i} Jahr${i === 1 ? "" : "en"}</b><br>Gut gelaufen: ${eur(s.p90)}<br>Mittel: <b>${eur(s.p50)}</b><br>Schlecht gelaufen: ${eur(s.p10)}<br>Eingezahlt: ${eur(s.paid)}`);
  };
  svg.addEventListener("pointermove", move); svg.addEventListener("pointerdown", move);
  svg.addEventListener("pointerleave", () => { xh.setAttribute("visibility", "hidden"); hideTip(); });
}

const riskClassOf = (vol) => { const l = [0.005, 0.05, 0.12, 0.20, 0.30, 0.80]; /* EU PRIIPs market-risk bands */ const i = l.findIndex((x) => vol < x); return i === -1 ? 7 : i + 1; };
export const riskScale = (rc) => `<span class="rscale" title="Risikoklasse ${rc} von 7" aria-label="Risikoklasse ${rc} von 7">${[1, 2, 3, 4, 5, 6, 7].map((i) => `<i class="${i === rc ? "on r" + i : ""}">${i}</i>`).join("")}</span>`;

let lastPlan = null;
export function renderPlan() {
  const d = state.data;
  const inp = readForm();
  store.set("plan", inp);
  $("#yearsOut").textContent = `${inp.years} Jahr${inp.years === 1 ? "" : "e"}`;
  const plan = buildPlan(inp, d);
  // After running costs (typical ETF TER ~0.2 % p. a.)
  const TER = 0.002;
  const sim = simulate({ ...inp, mu: plan.mu - TER, sigma: plan.sigma });
  const end = sim[sim.length - 1];
  // Rough German tax on selling at the end: 26.375 % (Abgeltungsteuer + Soli), 30 % partial exemption on equity ETFs
  const eqShare = (plan.weights.world + plan.weights.em + plan.weights.themes) / 100;
  const taxRate = 0.26375 * (1 - 0.3 * eqShare);
  const afterTax = end.p50 - Math.max(0, end.p50 - end.paid) * taxRate;
  const crashed = end.p50 * (1 + plan.crash);
  const realF = Math.pow(1.02, inp.years);
  const rc = riskClassOf(plan.sigma);
  lastPlan = { inp, plan };
  const rows = BUCKETS.filter((b) => plan.weights[b.id] > 0).map((b) => {
    const share = plan.weights[b.id] / 100;
    const sub = b.id === "themes" && plan.themePicks.length
      ? `<div class="picks">${plan.themePicks.map((t) => `<span class="chip">${t.quadrant === "quiet" ? "🌱" : "🔥"} ${esc(t.name)} · ${fmt(share * t.share * 100, 1)} %</span>`).join("")}</div>` : "";
    return `<tr><td><span class="sw" style="background:${b.color}"></span><b>${b.label}</b> <span class="pm">${plan.weights[b.id]}&nbsp;%</span><div class="how">${esc(b.how)}</div>${sub}</td><td class="num">${plan.weights[b.id]} %</td><td class="num">${eur(inp.once * share)}</td><td class="num">${eur(inp.monthly * share)}</td></tr>`;
  }).join("");
  const rules = [
    `<b>Kern zuerst:</b> ${plan.weights.world + plan.weights.em + plan.weights.bonds + plan.weights.cash} % stecken in breit gestreuten, langweiligen Bausteinen. Genau das macht reich, nicht der Hype.`,
    `<b>Hype-Deckel:</b> Themen + Krypto zusammen höchstens ${plan.weights.themes + plan.weights.btc} %. Auch wenn alle von einer Aktie schwärmen, wird das nicht mehr.`,
    plan.overheated.length ? `<b>Gerade nicht einsteigen:</b> ${esc(plan.overheated.join(", "))}. Überhitzt laut Radar, Rücksetzer werden wahrscheinlicher.` : "<b>Nie in Überhitztes einsteigen:</b> Steht ein Thema auf „Überhitzt“, wartest du.",
    inp.once > 0 ? `<b>Einmalbetrag:</b> ${esc(LUMP_SUM_RULE.replace(/^Einmalbeträge: /, ""))} Verteilt wären das z. B. ${eur(inp.once / 4)} pro Monat über 4 Monate.` : "<b>Sparplan statt Timing:</b> Den perfekten Einstieg kennt niemand. Monatlich automatisch investieren schlägt fast jeden Bauchgefühl-Anleger.",
    "<b>Einmal im Jahr aufräumen:</b> Ist ein Baustein stark gewachsen, verkaufst du etwas davon und füllst die anderen auf (Rebalancing). So verkaufst du automatisch teuer und kaufst günstig.",
    "<b>Finger weg:</b> keine Kredite, keine Hebelprodukte, keine „Geheimtipps“ aus Chatgruppen und keine Plattformen ohne EU-Regulierung.",
  ];
  $("#planOut").innerHTML = `
    ${plan.reserve === "no" ? `<div class="warnbox">⚠️ <b>Zuerst den Notgroschen:</b> Leg 3 Netto-Monatsgehälter aufs Tagesgeld. Erst Geld, das darüber hinausgeht, gehört an die Börse. Sonst musst du im Notfall genau dann verkaufen, wenn die Kurse unten sind.</div>` : ""}
    <div class="plan-head">
      ${donut(plan.weights)}
      <div>
        <div class="plan-type">Dein Typ: <b>${plan.label}</b></div>
        <div class="plan-kpis">
          <div><span>Risiko</span>${riskScale(rc)}</div>
          <div><span>Erwartete Rendite</span><b>≈ ${fmt(plan.mu * 100, 1)} % p. a.</b></div>
          <div><span>Typische Schwankung</span><b>± ${fmt(plan.sigma * 100)} % pro Jahr</b></div>
        </div>
      </div>
    </div>
    ${plan.notes.length ? `<ul class="plan-notes">${plan.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
    <div class="tscroll"><table class="plan-table"><thead><tr><th>Baustein</th><th class="num">Anteil</th><th class="num">Einmal</th><th class="num">pro Monat</th></tr></thead><tbody>${rows}</tbody></table></div>
    <h3>Was könnte daraus werden?</h3>
    <div class="proj-kpis">
      <div><span>Eingezahlt</span><b>${eur(end.paid)}</b></div>
      <div><span>Schlecht gelaufen</span><b>${eur(end.p10)}</b></div>
      <div class="hl"><span>Mittleres Szenario</span><b>${eur(end.p50)}</b></div>
      <div><span>Gut gelaufen</span><b>${eur(end.p90)}</b></div>
    </div>
    <div id="fan" class="fan"></div>
    <p class="fine">2.000 simulierte Zukünfte mit den Annahmen unten. Bereits nach laufenden Kosten von rund 0,2 % pro Jahr. In 8 von 10 Fällen landet das Ergebnis im blauen Band. Die Linie ist das mittlere Szenario (Median: die Hälfte der Fälle liegt darüber, die Hälfte darunter), gestrichelt ist das Eingezahlte.</p>
    <div class="proj-net"><div><span>Nach Steuern bei Verkauf am Ende (grob)</span><b>${eur(afterTax)}</b></div><div><span>In heutiger Kaufkraft (2 % Inflation)</span><b>${eur(afterTax / realF)}</b></div></div>
    <p class="fine">Steuer grob geschätzt: 26,4 % Abgeltungsteuer mit Soli auf den Gewinn, bei Aktien-ETFs 30 % davon steuerfrei (Teilfreistellung). Ohne Kirchensteuer, Sparerpauschbetrag und Vorabpauschale.</p>
    <div class="crash">💥 <b>Crash-Test wie 2008/09:</b> Welt-Aktien fielen damals zeitweise um rund die Hälfte. Angenommen: Aktien −50 %, Schwellenländer −55 %, Themen −65 %, Bitcoin −75 %, Gold und Anleihen leicht im Plus. Dein Depot verlöre dann zeitweise <b>${pct(plan.crash, 0)}</b>. Käme so ein Crash kurz vor deinem Ziel, läge das mittlere Szenario zeitweise bei <b>${eur(crashed)}</b> statt ${eur(end.p50)}. ${plan.crash < -0.2 ? "Kannst du das aushalten, ohne zu verkaufen? Wenn nicht: einen Typ vorsichtiger wählen. Und in den letzten Jahren vor dem Ziel Schritt für Schritt in sichere Bausteine umschichten." : "Das ist überschaubar."}</div>
    <h3>Deine Anti-Hype-Regeln</h3>
    <ol class="rules">${rules.map((r) => `<li>${r}</li>`).join("")}</ol>
    <div class="share-plan">
      <h3>Plan teilen</h3>
      <p class="fine">Zum Beispiel mit deinem Partner oder deiner Partnerin, um gemeinsam zu entscheiden, oder mit jemandem, der dich berät. Der Link öffnet genau diesen Plan mit Grafik, und die andere Person kann ihn selbst anpassen. Es wird nichts gespeichert oder hochgeladen: Alles steckt im Link selbst.</p>
      <label class="chk"><input type="checkbox" id="shareAmounts"> Beträge mitschicken (sonst nur Aufteilung und Anlagedauer)</label>
      <div class="brief-actions"><button class="btn btn-primary" type="button" id="sharePlan">Plan teilen</button><button class="btn btn-ghost" type="button" id="copyPlan">Link kopieren</button></div>
    </div>
    <details class="fine"><summary>Annahmen &amp; Grenzen</summary>
      <p>Langfristige Renditeannahmen pro Jahr (vor Steuern und Kosten): Welt-Aktien 7 %, Schwellenländer 7,5 %, Anleihen 3 %, Gold 4 %, Bitcoin 8 % (bewusst vorsichtig, Schwankung 65 %), Themen 7 % (Schwankung 35 %), Tagesgeld = aktueller EZB-Einlagenzins. Die Zusammenhänge zwischen den Bausteinen sind vereinfacht. Echte Märkte können schlechter laufen als das schlechteste Szenario. Das ist ein Lern- und Orientierungswerkzeug, keine Anlageberatung.</p>
    </details>`;
  fanChart($("#fan"), sim);
  const planLink = () => {
    const withAmounts = $("#shareAmounts").checked;
    const q = new URLSearchParams({ p: inp.profile || "auto", y: inp.years, r: inp.reserve || "" });
    if (withAmounts) { q.set("o", inp.once); q.set("m", inp.monthly); }
    return `${location.href.split("#")[0]}#plan=${q.toString()}`;
  };
  const planText = () => {
    const parts = BUCKETS.filter((b) => plan.weights[b.id] > 0).map((b) => `• ${b.label}: ${plan.weights[b.id]} %`).join("\n");
    const amounts = $("#shareAmounts").checked ? `\n${eur(inp.once)} einmalig, ${eur(inp.monthly)} pro Monat, ${inp.years} Jahre` : `\nAnlagedauer ${inp.years} Jahre`;
    return `📊 Mein Anlage-Plan (${plan.label})${amounts}\n\n${parts}\n\nRisikoklasse ${rc} von 7 · erwartet ≈ ${fmt(plan.mu * 100, 1)} % pro Jahr\nKeine Anlageberatung.`;
  };
  $("#sharePlan").addEventListener("click", async () => {
    const url = planLink(), text = planText();
    if (navigator.share) { try { await navigator.share({ title: "Mein Anlage-Plan", text, url }); return; } catch (e) { if (e?.name === "AbortError") return; } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n👉 Plan ansehen und anpassen: ${url}`)}`, "_blank", "noopener");
  });
  $("#copyPlan").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(`${planText()}\n\n${planLink()}`); toast("Link kopiert"); } catch { toast("Kopieren nicht möglich"); }
  });
}

/** Applies a plan shared via link (#plan=p=…&y=…&o=…&m=…). Returns true if one was applied. */
export function applySharedPlan(form, hash = location.hash) {
  if (!hash.startsWith("#plan=")) return false;
  const q = new URLSearchParams(hash.slice(6));
  const num = (k, lo, hi) => { const v = Number(q.get(k)); return Number.isFinite(v) && v >= lo && v <= hi ? v : null; };
  const p = q.get("p"); if (p && form.profile.querySelector(`option[value="${CSS.escape(p)}"]`)) form.profile.value = p;
  const y = num("y", 1, 60); if (y !== null) form.years.value = y;
  const o = num("o", 0, 1e9); if (o !== null) form.once.value = o;
  const m = num("m", 0, 1e7); if (m !== null) form.monthly.value = m;
  const r = q.get("r"); const el = r && form.querySelector(`input[name="reserve"][value="${CSS.escape(r)}"]`); if (el) el.checked = true;
  return true;
}

export function initPlan() {
  const form = $("#planForm");
  const saved = store.get("plan", null);
  if (saved) {
    form.once.value = saved.once; form.monthly.value = saved.monthly; form.years.value = saved.years; form.profile.value = saved.profile || "auto";
    const setR = (n, v) => { if (v == null) return; const el = form.querySelector(`input[name="${CSS.escape(n)}"][value="${CSS.escape(String(v))}"]`); if (el) el.checked = true; };
    setR("reserve", saved.reserve); saved.q?.forEach((v, i) => setR("q" + (i + 1), v));
  }
  if (applySharedPlan(form)) { setTimeout(() => toast("Geteilter Plan geöffnet. Du kannst alles anpassen."), 600); }
  let t;
  form.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { try { renderPlan(); } catch (e) { console.error(e); } }, 120); });
  form.addEventListener("submit", (e) => { e.preventDefault(); renderPlan(); toast("Plan aktualisiert"); });
}
