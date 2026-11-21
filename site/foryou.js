// "Für dich": the app checks every holding and goal against the user's own situation,
// shows where the plan has gaps, and makes clear what each input changes.
// Rule checks, not advice: every line names its rule and source and ends with "what you can do".
import { $, esc, fmt, pct, ok, store, state, fold } from "./ui.js";
import { buildPlan, profileWeight } from "./plan.js";
import { GOALS } from "./signals.js";
import { liveDepot, analyzeDepot, CATS } from "./personal.js";
import { situation, goalsOf, readiness, pensionGap, monthlyNeeded, REAL_RETURN, GOAL_TYPES, ageOf } from "./situation.js";
import { personas } from "./personas.js";
import { earlySignals, currentMine } from "./early.js";

const BROAD = new Set(["world", "em", "bonds", "cash"]);
const RISKY = new Set(["stock", "btc", "themes"]);
const CAT_ASSET = { world: "world", em: "em", bonds: "bonds", gold: "gold", btc: "btc" };
const catLabel = (k) => CATS.find(([c]) => c === k)?.[1] || k;
const eur = (x) => `${fmt(Math.round(x))} €`;

/** Market data that belongs to a holding: its own quote, else its category's asset; plus a matching theme. Pure. */
export function marketOf(p, d = {}) {
  const q = p.quote || {}, sym = q.sym || (p.ref?.startsWith("y:") ? p.ref.slice(2) : null);
  const asset = CAT_ASSET[p.cat] ? (d.assets || []).find((a) => a.id === CAT_ASSET[p.cat]) : null;
  const n = fold(p.name || "");
  const theme = (d.themes || []).find((t) => (sym && (t.etf === sym || (t.tickers || []).some((k) => k.sym === sym))) || (n.length >= 4 && fold(t.name).includes(n)));
  const ext200 = ok(q.ext200) ? q.ext200 : ok(asset?.ext200) ? asset.ext200 : theme && !sym ? theme.price?.ext200 : null;
  const chg3m = ok(q.chg3m) ? q.chg3m : ok(asset?.chg3m) ? asset.chg3m : null;
  return { sym, asset, theme, ext200, chg3m };
}

/**
 * Rule check of one holding. state: "ok" (fits), "watch" (keep an eye on it), "check" (take a closer look).
 * Never "buy" or "sell": each note names the rule, its source and what you can do. Pure.
 */
export function checkPosition(p, ctx = {}) {
  const { total = 0, d = {}, goal = "ausgewogen", cashTodo = false, insiders = [] } = ctx;
  const share = total ? p.value / total : 0, risky = RISKY.has(p.cat), m = marketOf(p, d), notes = [];
  const add = (state, text, rule, todo) => notes.push({ state, text, rule, todo });
  if (cashTodo && risky) add("check", "Dein Notgroschen ist noch nicht voll.", "Erst 3 Monatsausgaben auf Tagesgeld, dann Risiko (Verbraucherzentrale).", "Neues Geld zuerst in den Notgroschen statt in diese Position.");
  if (p.cat === "btc" && profileWeight(goal, "btc") === 0) add("check", `Krypto passt nicht zu deinem Profil „${GOALS[goal]?.label || goal}“.`, "Dein Profil sieht 0 % Krypto vor, weil es um Sicherheit geht.", "Profil prüfen oder den Anteil bewusst klein halten.");
  if (risky && share > 0.1) add("check", `Macht ${Math.round(share * 100)} % deines Depots aus (Klumpenrisiko).`, "Streuung (Markowitz 1952). Faustregel: Eine einzelne riskante Position über 10 % kann dein Ergebnis allein bestimmen.", "Neues Geld woanders anlegen. Oder einen Teil umschichten, wenn du ruhiger schlafen willst.");
  if ((ok(m.ext200) && m.ext200 > 0.3) || m.theme?.scores?.quadrant === "overheated") add("watch", `Stark gelaufen${ok(m.ext200) ? `: ${pct(m.ext200, 0)} über dem 200-Tage-Schnitt` : ""}.`, "Nach starken Anstiegen werden Rücksetzer wahrscheinlicher (Greenwood, Shleifer & You 2019).", "Regel „Rebalancing“: Liegt die Position deutlich über deinem Plan, einen Teil der Gewinne sichern. Kein Muss.");
  if (ok(m.ext200) && m.ext200 < -0.1) {
    if (BROAD.has(p.cat)) add("ok", `Unter dem 200-Tage-Schnitt (${pct(m.ext200, 0)}).`, "Für lange Sparer: Die besten Börsentage folgen oft kurz auf die schlechtesten. Wer in Schwächephasen verkauft, verpasst sie leicht (Auswertungen z. B. von J.P. Morgan Asset Management).", "Sparplan weiterlaufen lassen: Du kaufst gerade günstiger ein.");
    else add("check", `Im Abwärtstrend: ${pct(m.ext200, 0)} unter dem 200-Tage-Schnitt.`, "Trendfolge-Regel (Faber 2007, untersucht für Anlageklassen): Unter dem langfristigen Durchschnitt zu reduzieren, begrenzte historisch große Verluste.", "Prüfe, ob dein Kaufgrund noch gilt. Wer nach Regel handelt, reduziert hier oder setzt sich eine Verlustgrenze.");
  }
  if (["quiet", "hot"].includes(m.theme?.scores?.quadrant) && !notes.some((n) => n.state !== "ok")) add("ok", `Thema ${m.theme.name} hat Rückenwind (${m.theme.scores.quadrant === "quiet" ? "steigt still" : "im Trend"}).`, "Momentum: Was gut läuft, lief im Schnitt noch eine Weile weiter (Jegadeesh & Titman 1993).", "Halten und beobachten. Nicht nachkaufen, nur weil es läuft.");
  const ins = m.sym && insiders.find((b) => b.sym === m.sym);
  if (ins) add("ok", "Manager der Firma kaufen gerade eigene Aktien.", "Insider-Käufe sagten im Schnitt bessere Kurse voraus (Lakonishok & Lee 2001).", "Ein Hinweis, kein Beweis. Im Profi-Bereich ansehen.");
  const order = { check: 2, watch: 1, ok: 0 };
  const worst = notes.reduce((w, n) => (order[n.state] > order[w] ? n.state : w), "ok");
  if (!notes.length) add("ok", BROAD.has(p.cat) || p.cat === "gold" ? "Baustein deines Plans, nichts Auffälliges." : "Nichts Auffälliges in den Daten.", "Keine der Prüfregeln schlägt an.", "Nichts tun. Einmal im Jahr mit dem Plan abgleichen.");
  return { name: p.name || catLabel(p.cat), cat: p.cat, value: p.value, share, state: worst, notes, theme: m.theme?.id || null, asset: m.asset?.id || null };
}

/** Where the plan has room: buckets clearly under their target share. Pure. */
export function planGaps(rows = []) {
  return rows.filter((r) => r.target - r.share >= 0.05).map((r) => ({ cat: r.cat, share: r.share, target: r.target, text: `${catLabel(r.cat)}: ${Math.round(r.share * 100)} % statt ${Math.round(r.target * 100)} %` }));
}

/** Monthly saving all goals need, compared with what the user saves. Pure. */
export function goalStatus(s, goal = "ausgewogen", depotTotal = 0, year = new Date().getFullYear()) {
  const r = REAL_RETURN[goal] ?? 0.025, goals = goalsOf(s), lines = [];
  let need = 0, open = 0;
  for (const x of goals) {
    const label = x.type === "eigenes" ? x.name || "Eigenes Ziel" : GOAL_TYPES.find(([k]) => k === x.type)?.[1] || x.type;
    if (x.type === "rente") {
      const g = pensionGap(s, r, depotTotal);
      if (g?.monthly) { need += g.monthly; lines.push({ label, monthly: g.monthly, years: g.years }); } else if (!g) open++;
    } else if (x.amount && x.year) {
      const m = monthlyNeeded(x.amount, x.year - year, r, 0);
      if (m) { need += m; lines.push({ label, monthly: m, years: x.year - year, short: x.year - year < 5 }); }
    } else if (x.type !== "vermoegen" && x.type !== "freiheit") open++;
  }
  const save = s.save || 0;
  return { goals: goals.length, need, save, lines, open, reach: need > 0 && save > 0 ? save / need : null, short: lines.filter((l) => l.short) };
}

/** What each input changes in the app, and whether it is there. Pure given the inputs. */
export function inputImpact({ goalSet = false, personas: pers = 0, age = false, net = false, goals = 0, cash = false, depot = 0, depotQty = 0, topics = 0 } = {}) {
  return [
    { done: goalSet, label: "Risikoprofil", gives: "Plan-Aufteilung, Ampel, Kurzantworten und die Prüfregeln für Krypto passen zu deinem Mut.", step: 1 },
    { done: pers > 0 || topics > 0, label: "Wofür du das Radar nutzt", gives: "Deine Themen kommen zuerst: Seiten, Frühsignale, Nachrichten.", step: 0 },
    { done: age && net, label: "Alter, Netto, gesetzliche Rente", gives: "Deine Rentenlücke in Euro pro Monat und wie viel du dafür sparen müsstest.", step: 2 },
    { done: goals > 0, label: "Ziele mit Betrag und Jahr", gives: "Sparrate je Ziel und eine Warnung, wenn Geld für kurze Ziele in Aktien steckt.", step: 2 },
    { done: cash, label: "Ausgaben und Tagesgeld", gives: "Prüfung, ob dein Notgroschen reicht, bevor du Risiko eingehst.", step: 2 },
    { done: depot > 0, label: "Depot", gives: "Jede Position wird geprüft: Klumpen, überhitzt, Abwärtstrend, Lücken im Plan. Signale zu deinen Anlagen kommen zuerst.", step: 4 },
    { done: depotQty > 0, label: "Stückzahlen im Depot", gives: "Live-Wert und Tagesgewinn statt geschätzter Werte.", step: 4 },
  ];
}

/** Keys of everything the user holds or follows, for "betrifft dich" on signals. */
export function myKeys(d = state.data || {}) {
  const keys = new Set(currentMine(d));
  for (const p of liveDepot()) {
    const m = marketOf(p, d);
    if (m.sym) keys.add(m.sym); if (m.asset) keys.add(m.asset.id); if (m.theme) keys.add(m.theme.id);
    if (p.cat === "btc") keys.add("btc");
  }
  return keys;
}
/** Does a signal (by id) touch one of these keys? Pure. */
export function touches(sigId = "", keys = new Set()) {
  if (/^crypto-/.test(sigId)) return keys.has("btc") || keys.has("crypto");
  const rest = sigId.replace(/^[a-z]+-/, "");
  return keys.has(rest) || keys.has(rest.toUpperCase());
}

// ---------- Rendering ----------
const ICON = { ok: "✅", watch: "👀", check: "⚠️" };
const WORD = { ok: "Passt", watch: "Beobachten", check: "Prüfen" };
function context() {
  const d = state.data || {}, s = situation(), goal = GOALS[store.get("goal", "ausgewogen")] ? store.get("goal", "ausgewogen") : "ausgewogen";
  const list = liveDepot(), total = list.reduce((a, p) => a + p.value, 0);
  const plan = store.get("plan", {}) || {};
  const rd = readiness(s, Number(plan.years) || 15);
  let targets = {}; try { targets = buildPlan({ once: 5000, monthly: 200, years: 15, q: [1, 1, 1], ...plan, profile: goal }, d).weights || {}; } catch { /* no plan */ }
  const checks = list.map((p) => checkPosition(p, { total, d, goal, cashTodo: rd.items.some((i) => i.id === "cash" && i.state === "todo"), insiders: d.insiders?.buys || [] }));
  return { d, s, goal, list, total, checks, gaps: planGaps(analyzeDepot(list, targets).rows), gs: goalStatus(s, goal, total), rd };
}
function checkRows(checks, limit = 99) {
  const order = { check: 0, watch: 1, ok: 2 };
  return [...checks].sort((a, b) => order[a.state] - order[b.state] || b.value - a.value).slice(0, limit).map((c) => `<details class="pc pc-${c.state}">
    <summary><span class="pc-ico">${ICON[c.state]}</span><b>${esc(c.name)}</b><span class="pc-word">${WORD[c.state]}</span><span class="fine">${eur(c.value)} · ${Math.round(c.share * 100)} %</span></summary>
    <ul>${c.notes.map((n) => `<li>${ICON[n.state]} ${esc(n.text)}<br><span class="fine">Regel: ${esc(n.rule)}</span><br><b>Was kannst du tun?</b> ${esc(n.todo)}</li>`).join("")}</ul>
    <div class="act-row">${c.asset ? `<button type="button" class="act-btn" data-detail="asset:${esc(c.asset)}">Kurs & Details →</button>` : ""}${c.theme ? `<button type="button" class="act-btn" data-open="${esc(c.theme)}">Thema im Detail →</button>` : ""}<button type="button" class="act-btn" data-edit="4">Position ändern</button></div></details>`).join("");
}
function goalHtml(gs) {
  if (!gs.goals) return `<p>Noch kein Ziel eingetragen. <button type="button" class="link-btn" data-edit="2">Ziel eintragen →</button> Dann siehst du hier, ob du es erreichst.</p>`;
  if (!gs.need) return `<p>Für deine Ziele fehlen noch Betrag/Jahr oder Alter und Netto. <button type="button" class="link-btn" data-goto="plan:ziel">Ergänzen →</button></p>`;
  const pctReach = gs.reach === null ? null : Math.min(100, Math.round(gs.reach * 100));
  return `<div class="reach"><div class="reach-bar"><i style="width:${pctReach ?? 0}%"></i></div>
    <p>${gs.save ? (gs.reach >= 1 ? `✅ <b>Du erreichst deine Ziele</b> nach heutigen Annahmen: Du sparst ${eur(gs.save)}, nötig sind ${eur(gs.need)} im Monat.` : `⚠️ <b>${pctReach} % geschafft:</b> Du sparst ${eur(gs.save)}, nötig wären ${eur(gs.need)} im Monat. Es fehlen ${eur(gs.need - gs.save)}.`) : `Nötig sind ${eur(gs.need)} im Monat. <button type="button" class="link-btn" data-goto="plan:ziel">Sparrate eintragen →</button>`}</p></div>
    ${gs.reach !== null && gs.reach < 1 ? `<p class="fine"><b>Was kannst du tun?</b> Sparrate erhöhen, ein Ziel später legen oder priorisieren. Ein mutigeres Profil rechnet mit mehr Rendite, schwankt aber stärker.</p>` : ""}
    ${gs.short.length ? `<p class="fine">⏳ ${gs.short.map((l) => esc(l.label)).join(", ")}: weniger als 5 Jahre. Dieses Geld lieber nicht in Aktien.</p>` : ""}`;
}
export function renderForYou() {
  const box = $("#fuerdichBody"); if (!box) return;
  const c = context(), mine = currentMine(c.d), early = earlySignals(c.d, state.history || [], mine).filter((x) => x.mine).slice(0, 2);
  const counts = { check: 0, watch: 0, ok: 0 }; for (const x of c.checks) counts[x.state]++;
  const depot = c.list.length ? `<p><b>${c.list.length} Position${c.list.length === 1 ? "" : "en"}, ${eur(c.total)}:</b> ${counts.check ? `⚠️ ${counts.check} prüfen ` : ""}${counts.watch ? `👀 ${counts.watch} beobachten ` : ""}${counts.ok ? `✅ ${counts.ok} passen` : ""}</p>${checkRows(c.checks.filter((x) => x.state !== "ok"), 3)}
      <button type="button" class="link-btn" data-goto="plan:depotCheck">Alle Positionen geprüft ansehen →</button>`
    : `<p>Trag dein Depot ein, dann prüft das Radar jede Position: Klumpen, überhitzt, Abwärtstrend, passt zum Profil? <button type="button" class="link-btn" data-edit="4">Depot eintragen →</button></p>`;
  const gaps = c.gaps.length ? `<p>Laut deinem Plan fehlt noch: <b>${c.gaps.map((g) => esc(g.text)).join(" · ")}</b>.</p><p class="fine"><b>Was kannst du tun?</b> Die nächsten Sparraten dorthin lenken, statt etwas zu verkaufen. <button type="button" class="link-btn" data-goto="plan:plan">Zum Plan →</button></p>` : "";
  const earlyHtml = early.length ? early.map((x) => `<button type="button" class="sum-item" data-goto="entdecken:fruehsignale"><span class="ico">🌱</span><span><b>Frühsignal zu deinem Thema:</b> ${esc(x.title)}</span><span class="go">›</span></button>`).join("") : "";
  box.innerHTML = `<h3>🎯 Erreichst du deine Ziele?</h3>${goalHtml(c.gs)}
    <h3>💼 Deine Anlagen, geprüft</h3>${depot}
    ${gaps ? `<h3>➕ Wo dein Plan Platz hat</h3>${gaps}` : ""}
    ${earlyHtml ? `<h3>🌱 Früh dran</h3>${earlyHtml}` : ""}
    ${impactHtml(c)}
    <p class="fine">Regel-Prüfungen, keine Anlageberatung. Jede Zeile nennt Regel und Quelle.</p>`;
  const full = $("#depotCheckBody");
  if (full) full.innerHTML = c.list.length ? `${checkRows(c.checks)}${c.gaps.length ? `<p><b>Unter Plan:</b> ${c.gaps.map((g) => esc(g.text)).join(" · ")}. Am einfachsten über die nächsten Sparraten auffüllen.</p>` : ""}` : `<p>Noch kein Depot eingetragen. <button type="button" class="link-btn" data-edit="4">Depot eintragen →</button></p>`;
}
function impactHtml(c) {
  const list = inputImpact({
    goalSet: store.get("goal", null) !== null, personas: personas().length, age: ageOf(c.s) !== null, net: !!c.s.net, goals: c.gs.goals,
    cash: c.s.spend > 0 && c.s.cash !== null, depot: c.list.length, depotQty: c.list.filter((p) => p.qty).length, topics: (store.get("mytopics", []) || []).length,
  });
  const done = list.filter((x) => x.done).length;
  return `<details class="impact"><summary>⚙️ So passt sich das Radar an dich an: <b>${done} von ${list.length}</b> Angaben</summary>
    <div class="impact-bar"><i style="width:${Math.round((done / list.length) * 100)}%"></i></div>
    <ul>${list.map((x) => `<li>${x.done ? "✅" : "➕"} <b>${esc(x.label)}</b>: ${esc(x.gives)}${x.done ? "" : ` <button type="button" class="link-btn" data-edit="${x.step}">Jetzt eintragen →</button>`}</li>`).join("")}</ul>
    <p class="fine">Alles bleibt auf deinem Gerät und ist jederzeit änderbar.</p></details>`;
}
