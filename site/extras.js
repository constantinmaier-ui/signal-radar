// Zusatzbereiche: Markt-Ampel, Anlageklassen, versteckte Perlen, Profis, Lexikon, Bild-Teilen.
import { $, esc, fmt, pct, ok, ago, dirCls, arrow, compact, spark, lineChart, dayLabels, safeUrl, state, priceFmt, toast, limitList, moreBtn } from "./ui.js";
import { riskScale } from "./plan.js";

// ---------- Lexikon ----------
export const LEX = {
  "ETF": "Ein Fonds, der an der Börse gehandelt wird und einfach einen Index nachbildet, z. B. 1.400 Firmen auf einmal. Günstig, breit gestreut, ideal für Einsteiger.",
  "Index": "Eine Liste von Firmen, deren Kurse zusammen gemessen werden, z. B. DAX (40 deutsche Firmen) oder MSCI World (rund 1.400 weltweit).",
  "MSCI World": "Index mit rund 1.400 großen Firmen aus 23 Industrieländern. Der beliebteste Baustein für langfristiges Sparen.",
  "Sparplan": "Du investierst automatisch jeden Monat einen festen Betrag. Fällt der Kurs, bekommst du mehr Anteile. So musst du nie den richtigen Zeitpunkt suchen.",
  "Diversifikation": "Nicht alle Eier in einen Korb. Wer auf viele Firmen, Länder und Anlageklassen verteilt, übersteht den Absturz einzelner.",
  "Rebalancing": "Einmal im Jahr die Aufteilung zurück auf die Zielwerte bringen: Was stark gestiegen ist, wird teilweise verkauft, was gefallen ist, wird nachgekauft.",
  "Volatilität": "Wie stark ein Kurs schwankt. 15 % heißt: In einem normalen Jahr sind ±15 % üblich. Mehr Schwankung = mehr Risiko.",
  "Risikoklasse": "EU-Skala von 1 (sehr sicher, z. B. Tagesgeld) bis 7 (sehr riskant). Sie steht in jedem Fonds-Basisinformationsblatt. Das Radar berechnet sie vereinfacht aus der Schwankung der letzten zwei Jahre.",
  "Drawdown": "Der größte Verlust vom letzten Hoch bis zum Tief. −50 % heißt: Aus 10.000 € wurden zeitweise 5.000 €.",
  "200-Tage-Linie": "Der Durchschnittskurs der letzten 200 Handelstage. Darüber gilt ein Trend als intakt. Liegt der Kurs weit darüber (+30 % und mehr), ist er oft überhitzt.",
  "RSI": "Relative Strength Index von 0 bis 100. Über 70 gilt ein Wert als heißgelaufen, unter 30 als überverkauft.",
  "KGV": "Kurs-Gewinn-Verhältnis: Wie viele Jahresgewinne du für die Aktie bezahlst. 15 ist normal, über 40 ist teuer, und dann muss die Firma stark wachsen.",
  "Kursziel": "Der Preis, den Bank-Analysten in 12 Monaten erwarten. Liegt oft daneben, zeigt aber, wie die Profis die Firma einschätzen.",
  "Analysten-Note": "Durchschnittsurteil der Analysten: 1 = stark kaufen, 2 = kaufen, 3 = halten, 4 = verkaufen, 5 = stark verkaufen.",
  "13F": "Pflichtmeldung an die US-Börsenaufsicht: Jeder Investor mit mehr als 100 Mio. $ in US-Aktien muss vierteljährlich offenlegen, was er besitzt.",
  "Blase": "Wenn Preise weit über den echten Wert steigen, weil alle auf weiter steigende Preise hoffen. Platzt irgendwann, aber niemand weiß, wann.",
  "Hype": "Viel Aufmerksamkeit in Medien und sozialen Netzwerken. Kann Kurse kurzfristig treiben, endet aber oft in Enttäuschung.",
  "Momentum": "Was steigt, steigt oft eine Weile weiter. Das Radar misst es an der Kursentwicklung der letzten 1–3 Monate.",
  "IPO": "Initial Public Offering = Börsengang. Eine private Firma verkauft erstmals Aktien an alle. Viele Hype-IPOs gibt es meist spät im Börsenzyklus.",
  "Tagesgeld": "Sparkonto mit täglicher Verfügbarkeit und Zinsen. Bis 100.000 € pro Bank gesetzlich abgesichert.",
  "Anleihe": "Ein Kredit an einen Staat oder eine Firma, für den du Zinsen bekommst. Meist ruhiger als Aktien.",
  "Inflation": "Geld verliert an Wert. Bei 2 % Inflation kostet heute 100 € Ware in 10 Jahren etwa 122 €.",
  "Zinseszins": "Deine Erträge bringen selbst wieder Erträge. Albert Einstein soll ihn das achte Weltwunder genannt haben. Wer früh anfängt, gewinnt.",
  "VIX": "Das „Angstbarometer“ der Börse. Unter 15 heißt Ruhe (manchmal Sorglosigkeit), über 30 heißt Panik.",
  "Fear & Greed": "Stimmungsindex von 0 (extreme Angst) bis 100 (extreme Gier). Extreme sind oft gute Gegenindikatoren.",
  "Prognosemarkt": "Plattform, auf der Menschen mit echtem Geld auf Ereignisse wetten. Die Quote entspricht der Wahrscheinlichkeit, die die Masse sieht.",
  "Einlagensicherung": "Gesetzlicher Schutz deiner Bankguthaben bis 100.000 € pro Person und Bank in der EU.",
  "TER": "Total Expense Ratio: die jährlichen Kosten eines Fonds. Gute Welt-ETFs kosten 0,1–0,25 % pro Jahr.",
  "UCITS": "EU-Regeln für Fonds. In Deutschland kaufst du meist nur UCITS-ETFs. US-ETFs wie „SMH“ gibt es als europäische Varianten.",
  "Satellit": "Kleiner Depot-Anteil für Themen und Einzelideen neben dem großen, breiten Kern.",
  "Superinvestor": "Investoren mit jahrzehntelanger Erfolgsbilanz wie Warren Buffett. Lohnt sich anzuschauen, aber nicht blind zu kopieren.",
};
export function renderLexikon(filter = "") {
  const f = filter.trim().toLowerCase();
  $("#lexList").innerHTML = Object.entries(LEX).filter(([k, v]) => !f || k.toLowerCase().includes(f) || v.toLowerCase().includes(f))
    .map(([k, v]) => `<div><dt id="lex-${esc(k.replace(/\W+/g, "-"))}">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("") || '<div class="empty">Nichts gefunden.</div>';
}
/** Begriff mit Erklär-Tooltip. */
export const term = (word, label = word) => (LEX[word] ? `<span class="term" tabindex="0" data-tip="${esc(`<b>${esc(word)}</b><br>${esc(LEX[word])}`)}">${esc(label)}</span>` : esc(label));

// ---------- Markt-Ampel ----------
const AMPEL = {
  "grün": { icon: "🟢", title: "Grün: normales Börsenwetter", todo: ["Sparplan ganz normal weiterlaufen lassen.", "Einmalbeträge: sofort anlegen ist rechnerisch meist besser (Vanguard 2012).", "Trotzdem nur breit gestreut, Themen bleiben eine kleine Beimischung."] },
  "gelb": { icon: "🟡", title: "Gelb: aufmerksam bleiben", todo: ["Sparplan läuft weiter. Gerade jetzt nicht aufhören.", "Einmalbeträge: Die Ampel ist kein Timing-Signal. Sofort anlegen ist rechnerisch meist besser; verteilen nur, wenn dich Schwankungen sonst zum Verkaufen bringen.", "Keine überhitzten Themen nachkaufen und keine Hype-Aktien jagen."] },
  "rot": { icon: "🔴", title: "Rot: Vorsicht, Übertreibung oder Stress", todo: ["Sparplan weiter: Wer bei Stress weiterspart, kauft Anteile zu niedrigeren Preisen.", "Keine Kredite, keine Hebel, keine Hype-Käufe.", "Notgroschen prüfen. Bei Euphorie: Anteile von stark gestiegenen Bausteinen beim Rebalancing zurückführen."] },
};
export function renderAmpel() {
  const r = state.data.risk;
  if (!r) { $("#ampel").innerHTML = ""; return; }
  const a = AMPEL[r.level] || AMPEL.gelb;
  $("#ampel").className = `ampel lvl-${r.level === "grün" ? "g" : r.level === "rot" ? "r" : "y"}`;
  $("#ampel").innerHTML = `<div class="ampel-lights" aria-hidden="true"><i class="r"></i><i class="y"></i><i class="g"></i></div>
    <div class="ampel-body"><div class="ampel-title">Markt-Ampel · ${a.icon} ${esc(a.title)}</div>
      <div class="ampel-why">Euphorie ${fmt(r.euphoria)}/100 · Stress ${fmt(r.stress)}/100${ok(r.breadth) ? ` · ${fmt(r.breadth * 100)} % der Aktien über ihrer ${term("200-Tage-Linie")}` : ""}${ok(r.vix) ? ` · ${term("VIX")} ${fmt(r.vix, 1)}` : ""}</div>
      <ul>${a.todo.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
    <a class="btn btn-ghost ampel-cta" href="#plan">Was heißt das für mein Geld? →</a>`;
}

// ---------- Anlageklassen ----------
const trendText = (e) => (!ok(e) ? "" : e > 0.25 ? "🔥 überhitzt" : e > 0.02 ? "↗ Aufwärtstrend" : e < -0.02 ? "↘ Abwärtstrend" : "→ seitwärts");
export function renderAssets() {
  const d = state.data;
  const rates = d.rates || {};
  $("#rates").innerHTML = `
    <div class="rate"><span>EZB-Einlagenzins ≈ ${term("Tagesgeld", "Tagesgeld")}-Niveau</span><b>${ok(rates.ecb) ? fmt(rates.ecb * 100, 2) + " %" : "–"}</b></div>
    <div class="rate"><span>Zins 10-jährige US-Staatsanleihe</span><b>${ok(rates.us10y) ? fmt(rates.us10y * 100, 2) + " %" : "–"}</b></div>
    <div class="rate"><span>Inflationsziel der EZB</span><b>2,00 %</b></div>`;
  const list = d.assets || [];
  $("#assetGrid").innerHTML = list.length ? list.map((a) => a.missing ? "" : `<article class="asset" role="button" tabindex="0" data-detail="asset:${esc(a.id)}">
      <header><div><span class="chip">${esc(a.group)}</span><h3>${esc(a.name)}</h3></div>${riskScale(a.riskClass)}</header>
      <div class="asset-px"><b>${priceFmt({ kind: a.sym.includes("=X") ? "fx" : "" }, a.last)}</b> <span class="${dirCls(a.chg1d)}">${arrow(a.chg1d)}${pct(a.chg1d, 2)} heute</span></div>
      ${spark(a.spark, { w: 300, h: 40, color: a.chg3m >= 0 ? "var(--good)" : "var(--crit)", label: `${a.name} 6 Monate` })}
      <div class="asset-kpis"><div><span>1 Monat</span><b class="${dirCls(a.chg1m)}">${pct(a.chg1m, 0)}</b></div><div><span>1 Jahr</span><b class="${dirCls(a.chg1y)}">${pct(a.chg1y, 0)}</b></div><div><span>${term("Drawdown", "Max. Verlust")}</span><b class="down">${pct(a.maxDD, 0)}</b></div><div><span>Trend</span><b>${trendText(a.ext200)}</b></div></div>
      <p>${esc(a.what)}</p>${a.examples ? `<p class="fine">${esc(a.examples)}</p>` : ""}
    </article>`).join("") : '<div class="empty">Noch keine Daten.</div>';
}

// ---------- Versteckte Perlen ----------
export function renderGems() {
  const g = state.data.gems || [];
  $("#gemGrid").innerHTML = g.length ? g.map((x, i) => `<article class="gem">
      <header><div><span class="rank">#${i + 1}</span><h3>${esc(x.name)}</h3><span class="fine">${esc(x.sym)} · Ideen-Score ${fmt(x.score)}/100</span></div>${riskScale(x.riskClass)}</header>
      ${spark(x.spark, { w: 300, h: 38, color: "var(--s1)", label: `${x.name} 6 Monate` })}
      <div class="gem-kpis"><div><span>Kurs</span><b>${fmt(x.price, 2)} ${esc(x.currency)}</b></div><div><span>${term("Kursziel")}</span><b>${fmt(x.target, 2)}</b></div><div><span>Potenzial</span><b class="up">${pct(x.upside, 0)}</b></div></div>
      <ul class="reasons">${x.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      <p class="fine">Risiko: schwankt ±${fmt(x.vol * 100)} % pro Jahr, größter Rückgang 12 M ${pct(x.maxDD, 0)}.</p>
    </article>`).join("") : '<div class="empty">Gerade erfüllt keine Aktie alle Regeln. Auch das ist eine Information: Der Markt bietet wenig Unentdecktes.</div>';
}

// ---------- Profis ----------
const pretty = (n) => String(n || "").toLowerCase().replace(/\b(inc|corp|co|ltd|plc|n v|nv|sa|ag|cl a|cl b|com|new|del)\b\.?/g, "").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
const MOVE = { neu: ["🆕", "neu gekauft"], aufgestockt: ["⬆", "aufgestockt"], reduziert: ["⬇", "reduziert"], verkauft: ["❌", "komplett verkauft"] };
const quarterLabel = (d) => { if (!d) return ""; const dt = new Date(d); return `Q${Math.floor(dt.getUTCMonth() / 3) + 1} ${dt.getUTCFullYear()}`; };
const RATING = (r) => (!ok(r) ? "–" : r < 1.5 ? "Stark kaufen" : r < 2.5 ? "Kaufen" : r < 3.5 ? "Halten" : r < 4.5 ? "Verkaufen" : "Stark verkaufen");

export function renderProfis() {
  const si = state.data.superinvestors || { investors: [], consensusBuys: [], consensusSells: [] };
  const cb = si.consensusBuys || [], cs = si.consensusSells || [];
  $("#consensus").innerHTML = (cb.length || cs.length) ? `
    <div class="cons-box buy"><h4>🤝 Mehrere Große kaufen</h4>${limitList("cons:buy", cb, 6).map((c) => `<div class="cons-row"><b>${esc(pretty(c.name))}</b><span>${c.buy.length} Investoren: ${esc(c.buy.join(", "))}</span></div>`).join("") || '<div class="empty">–</div>'}${moreBtn("cons:buy", cb.length, 6)}</div>
    <div class="cons-box sell"><h4>🚪 Mehrere Große verkaufen</h4>${limitList("cons:sell", cs, 6).map((c) => `<div class="cons-row"><b>${esc(pretty(c.name))}</b><span>${c.sell.length} Investoren: ${esc(c.sell.join(", "))}</span></div>`).join("") || '<div class="empty">–</div>'}${moreBtn("cons:sell", cs.length, 6)}</div>` : "";
  $("#investorGrid").innerHTML = si.investors.length ? si.investors.map((v) => `<article class="investor">
      <header><div><h3>${esc(v.person)}</h3><span class="fine">${esc(v.fund)} · ${quarterLabel(v.quarter)}, gemeldet ${new Date(v.filed).toLocaleDateString("de-DE")}</span></div><a class="fine" href="${safeUrl(v.url)}" target="_blank" rel="noopener" title="Original bei der SEC">SEC ↗</a></header>
      <p class="style">${esc(v.style)}</p>
      <div class="holdings">${v.top.slice(0, 5).map((h) => `<div class="hold"><span>${esc(pretty(h.name))}</span><span class="bar"><i style="width:${Math.min(100, h.weight * 100 * 2)}%;background:var(--s1)"></i></span><b>${fmt(h.weight * 100, 1)} %</b></div>`).join("")}</div>
      <div class="moves">${v.moves.slice(0, 6).map((m) => `<span class="move ${m.type}" title="${MOVE[m.type][1]}">${MOVE[m.type][0]} ${esc(pretty(m.name))}${m.type === "aufgestockt" ? (m.change >= 1 ? ` ×${fmt(1 + m.change, m.change < 4 ? 1 : 0)}` : ` ${pct(m.change, 0)}`) : m.type === "reduziert" ? ` ${pct(m.change, 0)}` : ""}</span>`).join("") || '<span class="fine">Kaum Veränderungen.</span>'}</div>
      <div class="fine">${v.positions} Positionen · ${compact(v.total)} $ gemeldet</div>
    </article>`).join("") : '<div class="empty">Die SEC-Daten sind gerade nicht abrufbar.</div>';

  const vo = state.data.voices || { items: [], bull: 0, bear: 0 };
  const tot = vo.bull + vo.bear;
  $("#voiceCount").textContent = vo.items.length ? `${vo.items.length} Stimmen, letzte 3 Tage` : "";
  $("#voiceBalance").innerHTML = tot ? `<div class="bal-bar"><i class="bull" style="width:${(vo.bull / tot) * 100}%"></i><i class="bear" style="width:${(vo.bear / tot) * 100}%"></i></div>
    <div class="bal-lbl"><span class="up">📈 optimistisch ${vo.bull}</span><span class="down">vorsichtig ${vo.bear} 📉</span></div>` : "";
  const TONE = { bullish: ["📈", "optimistisch", "up"], bearish: ["📉", "vorsichtig", "down"], neutral: ["💬", "neutral", "flat"] };
  $("#voices").innerHTML = limitList("voices", vo.items, 12).map((v) => {
    const t = TONE[v.tone] || TONE.neutral;
    const text = v.de || v.quote || v.title;
    return `<a class="voice" href="${safeUrl(v.url)}" target="_blank" rel="noopener">
      <div class="q">${v.quote || v.de ? `„${esc(text)}“` : esc(text)}</div>
      <div class="m"><span class="${t[2]}">${t[0]} ${t[1]}</span>${v.who ? `<b>${esc(v.who)}</b>` : ""}<span>${esc(v.source)} · ${ago(v.published)}</span>${v.lang === "en" && !v.de ? '<span class="chip">EN</span>' : ""}</div></a>`;
  }).join("") + moreBtn("voices", vo.items.length, 12, "Stimmen") || '<div class="empty">Gerade keine Stimmen gefunden.</div>';

  const an = (state.data.analysts || []).filter((a) => a.analysts >= 5 && ok(a.upside));
  const show = state.allTargets ? an : an.slice(0, 12);
  $("#targets").innerHTML = an.length ? `<div class="tscroll"><table class="tick-table"><thead><tr><th>Firma</th><th>Kurs</th><th>${term("Kursziel")}</th><th>Potenzial</th><th>${term("Analysten-Note", "Urteil")}</th><th>Analysten</th><th>${term("KGV")}</th></tr></thead><tbody>
    ${show.map((a) => `<tr><td><b>${esc(a.name)}</b><div class="fine">${esc(a.sym)}</div></td><td>${fmt(a.price, 2)}</td><td>${fmt(a.target, 2)}</td><td class="${dirCls(a.upside)}">${pct(a.upside, 0)}</td><td>${RATING(a.rating)}</td><td>${a.analysts}</td><td>${ok(a.fpe ?? a.pe) ? fmt(a.fpe ?? a.pe) : "–"}</td></tr>`).join("")}</tbody></table></div>
    ${an.length > 12 ? `<button class="btn btn-ghost btn-wide" type="button" id="allTargets">${state.allTargets ? "Weniger anzeigen" : `Alle ${an.length} anzeigen`}</button>` : ""}` : '<div class="empty">Kursziele gerade nicht abrufbar.</div>';
}

export function renderCnn() {
  const c = state.data.cnnFearGreed;
  if (!c) { $("#cnn").innerHTML = '<div class="empty">Gerade nicht abrufbar.</div>'; return; }
  const lbl = { "extreme fear": "Extreme Angst", fear: "Angst", neutral: "Neutral", greed: "Gier", "extreme greed": "Extreme Gier" }[String(c.rating).toLowerCase()] || c.rating;
  $("#cnn").innerHTML = `<div class="big">${fmt(c.value)}<small>${esc(lbl)} · vor 1 Woche ${fmt(c.weekAgo)}, vor 1 Monat ${fmt(c.monthAgo)}</small></div><div id="cnnChart"></div>`;
  if (c.spark?.length > 2) lineChart($("#cnnChart"), c.spark, { labels: dayLabels(c.spark.length), fmtV: (v) => `${fmt(v)} Fear & Greed`, color: "var(--s1)", h: 70, mid: 50, axis: false });
}

// ---------- Teilen als Bild (für WhatsApp-Status & Gruppen) ----------
function wrap(ctx, text, maxW) {
  const words = text.split(" "), lines = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
export async function shareImage(lines) {
  const d = state.data, W = 1080, H = 1350;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  c.fillStyle = "#0d0d0d"; c.fillRect(0, 0, W, H);
  const font = (w, s) => `${w} ${s}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  c.fillStyle = "#8f8d86"; c.font = font(700, 30); c.fillText("📡 SIGNAL-RADAR", 70, 100);
  c.fillStyle = "#c3c2b7"; c.font = font(500, 30);
  c.fillText(new Date(d.generatedAt).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }), 70, 145);
  if (d.demo) { c.fillStyle = "#e66767"; c.font = font(800, 30); c.textAlign = "right"; c.fillText("DEMO-DATEN", W - 70, 100); c.textAlign = "left"; }
  // Tacho
  const cx = 250, cy = 400, R = 150, zones = ["#3987e5", "#1c5cab", "#383835", "#8a3a33", "#e66767"];
  c.lineWidth = 34;
  zones.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, R, Math.PI + (i * Math.PI) / 5 + 0.01, Math.PI + ((i + 1) * Math.PI) / 5 - 0.01); c.stroke(); });
  const v = d.bubble.score ?? 50, ang = Math.PI + (v / 100) * Math.PI;
  c.strokeStyle = "#f0efec"; c.lineWidth = 8; c.lineCap = "round"; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + (R - 40) * Math.cos(ang), cy + (R - 40) * Math.sin(ang)); c.stroke();
  c.fillStyle = "#f0efec"; c.beginPath(); c.arc(cx, cy, 14, 0, Math.PI * 2); c.fill();
  c.textAlign = "left"; c.font = font(800, 110); c.fillText(String(d.bubble.score ?? "–"), 470, 360);
  c.font = font(700, 40); c.fillStyle = "#c3c2b7"; c.fillText(`Blasen-Meter · ${d.bubble.zone}`, 470, 415);
  if (d.risk) { c.font = font(700, 36); c.fillStyle = d.risk.level === "rot" ? "#e66767" : d.risk.level === "grün" ? "#0ca30c" : "#fab219"; c.fillText(`Markt-Ampel: ${d.risk.level.toUpperCase()}`, 470, 470); }
  // Briefing
  let y = 560; c.fillStyle = "#f0efec";
  for (const [ico, k, t] of lines.slice(0, 5)) {
    c.font = font(700, 33); const head = `${ico} ${k ? k + ": " : ""}`;
    const rows = wrap(c, head + t, W - 140);
    rows.slice(0, 3).forEach((r, i) => { c.font = font(i === 0 ? 600 : 400, 31); c.fillText(r, 70, y); y += 42; });
    y += 18; if (y > H - 190) break;
  }
  c.fillStyle = "#1aa85b"; c.fillRect(70, H - 160, W - 140, 86);
  c.fillStyle = "#fff"; c.font = font(700, 32); c.textAlign = "center";
  c.fillText("Live & kostenlos, ohne Login: " + location.host + location.pathname.replace(/\/$/, ""), W / 2, H - 106);
  c.fillStyle = "#8f8d86"; c.font = font(400, 24); c.fillText("Keine Anlageberatung", W / 2, H - 40);
  const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
  const file = new File([blob], "signal-radar.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text: `📡 Signal-Radar: ${location.href.split("#")[0]}` }); return; } catch { /* abgebrochen */ }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "signal-radar.png"; a.click();
  toast("Bild gespeichert – in WhatsApp als Foto senden");
}
