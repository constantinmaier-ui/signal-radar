// Personal layer: optional onboarding, interests, smart navigation, menu with everything, portfolio.
// Everything stays in the browser (localStorage) and can be changed at any time.
import { $, $$, esc, fmt, pct, ok, store, state, dirCls, toast } from "./ui.js";
import { TOPICS } from "./trust.js";
import { BUCKETS, buildPlan } from "./plan.js";
import { GOALS } from "./signals.js";

// ---------- Interests ----------
// Which interest topic each "Entdecken" section belongs to (a section can serve several)
export const SECTION_TOPICS = {
  frueh: ["macro"], anlagen: ["stocks", "crypto"], rohstoffe: ["commodities"], weitere: ["stocks"], immobilien: ["realestate"],
  stimmung: ["macro", "stocks", "crypto"], offiziell: ["macro"], trends: ["themes"], karte: ["themes"], themen: ["themes"],
  perlen: ["stocks"], ipo: ["themes"],
};
const ALL = TOPICS.map(([k]) => k);
/** Selected interests; empty or all selected means "everything". */
export const interests = () => {
  const v = store.get("interests", null);
  return Array.isArray(v) ? v.filter((k) => ALL.includes(k)) : ALL;
};
export const isAll = (list) => !list.length || ALL.every((k) => list.includes(k));

/** Splits sections into those matching the interests (in original order) and the rest. Pure. */
export function splitSections(ids, list) {
  if (isAll(list)) return { mine: ids, rest: [] };
  const mine = ids.filter((id) => (SECTION_TOPICS[id] || []).some((t) => list.includes(t)));
  return { mine, rest: ids.filter((id) => !mine.includes(id)) };
}

/** Puts the user's sections first in "Entdecken" and folds the rest behind one button. */
export function applyInterests() {
  const view = $('.view[data-view="entdecken"]'); if (!view) return;
  const secs = $$(":scope > section[id]", view), ids = secs.map((s) => s.id);
  const { mine, rest } = splitSections(ids, interests());
  view.querySelector(".more-sections")?.remove();
  for (const id of mine) view.appendChild(document.getElementById(id));
  if (rest.length) {
    const box = document.createElement("div");
    box.className = "more-sections";
    box.innerHTML = `<button type="button" class="btn btn-ghost btn-wide" id="moreSecBtn">Weitere Bereiche anzeigen (${rest.length})</button><p class="fine">Ausgeblendet, weil sie nicht zu deinen Interessen gehören. Ändern unter Menü → „Persönlich einrichten“.</p>`;
    view.appendChild(box);
  }
  for (const id of rest) { const el = document.getElementById(id); el.classList.add("folded"); view.appendChild(el); }
  for (const id of mine) document.getElementById(id).classList.remove("folded");
  view.classList.remove("show-folded");
}

// ---------- Smart bottom navigation ----------
const NAV_SHORTCUT = { realestate: ["immobilien", "Immobilien"], commodities: ["rohstoffe", "Rohstoffe"], themes: ["trends", "Trends"], macro: ["frueh", "Konjunktur"], crypto: ["anlagen", "Krypto"], stocks: ["anlagen", "Anlagen"] };
/** 4th tab: "Profis & News" when the user cares about it, otherwise a shortcut to their main interest. */
export function smartNav() {
  const slot = $("#navSmart"); if (!slot) return;
  const list = interests();
  if (isAll(list) || list.includes("pros") || list.includes("news")) {
    slot.href = "#profis"; slot.dataset.nav = "profis"; delete slot.dataset.goto; slot.querySelector("span").textContent = "Profis & News";
    return;
  }
  const key = list.find((k) => NAV_SHORTCUT[k]); if (!key) return;
  const [anchor, label] = NAV_SHORTCUT[key];
  slot.href = "#entdecken"; slot.dataset.nav = "entdecken-" + anchor; slot.dataset.goto = `entdecken:${anchor}`; slot.querySelector("span").textContent = label;
  slot.querySelector("svg").innerHTML = '<path d="M12 2l3 6 6 .9-4.5 4.4 1 6.2L12 16.6 6.5 19.5l1-6.2L3 8.9 9 8Z"/>'; // star = "your topic"
}

// ---------- Navigation helper ----------
export function goTo(view, anchor) {
  if (location.hash !== `#${view}`) location.hash = view;
  setTimeout(() => {
    const el = anchor && document.getElementById(anchor); if (!el) return;
    if (el.classList.contains("folded")) el.closest(".view")?.classList.add("show-folded");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600);
  }, 80);
}

// ---------- Menu with everything ----------
const VIEW_TITLES = [["heute", "Heute"], ["plan", "Mein Geld"], ["entdecken", "Entdecken"], ["profis", "Profis & News"], ["wissen", "Wissen"]];
const FALLBACK = { check: "Tages-Check", lage: "Blasen-Meter & Marktlage", stimmung: "Stimmung & Wettmärkte", fitness: "Finanz-Fitness" };
export function openMenu() {
  const mine = interests(), all = isAll(mine);
  const groups = VIEW_TITLES.map(([v, title]) => {
    const items = $$(`.view[data-view="${v}"] > section[id]`).map((s) => {
      const label = FALLBACK[s.id] || s.querySelector("h2")?.textContent.trim(); if (!label) return "";
      const star = !all && (SECTION_TOPICS[s.id] || []).some((t) => mine.includes(t)) ? " ★" : "";
      return `<button type="button" class="menu-item" data-goto="${v}:${esc(s.id)}">${esc(label)}${star}</button>`;
    }).join("");
    return `<div class="menu-group"><h4>${title}</h4>${items}</div>`;
  }).join("");
  $("#sheetBody").innerHTML = `<h2 id="sheetTitle">Alles auf einen Blick</h2><p class="fine">★ = passt zu deinen Interessen. Tipp: Mit der Suche 🔍 findest du alles noch schneller.</p>
    <div class="menu-grid">${groups}
      <div class="menu-group"><h4>Einstellungen</h4>
        <button type="button" class="menu-item" data-act="onboard">Persönlich einrichten</button>
        <button type="button" class="menu-item" data-act="prefs">Interessen &amp; Bereiche anpassen</button>
        <button type="button" class="menu-item" data-goto="plan:depot">Mein Depot bearbeiten</button>
        <button type="button" class="menu-item" data-act="backup">Sicherung &amp; andere Geräte</button>
        <button type="button" class="menu-item" data-goto="wissen:installieren">Als App installieren</button>
      </div></div>`;
  $("#sheet").hidden = false; document.body.style.overflow = "hidden";
}
export const closeSheet = () => { $("#sheet").hidden = true; document.body.style.overflow = ""; };

// ---------- Onboarding ----------
const HORIZON = [["kurz", "unter 3 Jahren", 2], ["mittel", "3 bis 10 Jahre", 7], ["lang", "über 10 Jahre", 15]];
const DROP = [[1, "Alles verkaufen"], [2, "Einen Teil verkaufen"], [3, "Nichts tun, abwarten"], [4, "Nachkaufen"]];
/** Short risk-tolerance estimate (inspired by Grable & Lytton 1999 / MiFID II suitability). Pure. */
export function suggestGoal(drop, horizon) {
  if (horizon === "kurz") return "sicherheit";
  const s = (Number(drop) || 2) + (horizon === "lang" ? 2 : 1);
  return s <= 3 ? "sicherheit" : s === 4 ? "ausgewogen" : s === 5 ? "wachstum" : "mutig";
}
let ob = null;
export function openOnboarding() {
  const plan = store.get("plan", {}) || {};
  ob = { step: 0, interests: interests(), horizon: plan.years ? (plan.years < 3 ? "kurz" : plan.years <= 10 ? "mittel" : "lang") : "lang", drop: 3, goal: store.get("goal", null), mode: store.get("mode", "easy"), depot: depotList() };
  renderOnboarding();
  $("#sheet").hidden = false; document.body.style.overflow = "hidden";
}
function renderOnboarding() {
  const steps = 4, s = ob.step;
  const chip = (attr, val, on, label) => `<button type="button" class="chip-btn ${on ? "on" : ""}" data-${attr}="${esc(val)}">${esc(label)}</button>`;
  const body = [
    () => `<h2 id="sheetTitle">Was interessiert dich?</h2><p class="fine">Danach richtet sich, was oben steht und was eingeklappt wird. Mehrere möglich.</p>
      <div class="chips-wrap">${TOPICS.map(([k, l]) => chip("int", k, ob.interests.includes(k), l)).join("")}</div>`,
    () => { const sug = suggestGoal(ob.drop, ob.horizon), g = ob.goal || sug;
      return `<h2 id="sheetTitle">Dein Ziel</h2>
      <p><b>Wie lange willst du das Geld anlegen?</b></p><div class="chips-wrap">${HORIZON.map(([k, l]) => chip("hor", k, ob.horizon === k, l)).join("")}</div>
      <p><b>Stell dir vor, dein Depot verliert in einem Monat 20 %. Was tust du?</b></p><div class="chips-wrap">${DROP.map(([k, l]) => chip("drop", k, ob.drop === k, l)).join("")}</div>
      <p><b>Vorschlag:</b> ${esc(GOALS[sug].label)}. Du kannst frei wählen:</p><div class="chips-wrap">${Object.entries(GOALS).map(([k, v]) => chip("goal", k, g === k, v.label)).join("")}</div>
      <p class="fine">Kurzfassung typischer Fragen zur Risikobereitschaft (angelehnt an Grable &amp; Lytton 1999 und die Eignungsprüfung nach MiFID II). Kein Ersatz für eine Beratung.</p>`; },
    () => `<h2 id="sheetTitle">Wie viel Detail?</h2><div class="chips-wrap">${chip("mode", "easy", ob.mode !== "pro", "Einsteiger: das Wichtigste, einfach erklärt")}${chip("mode", "pro", ob.mode === "pro", "Profi: alle Kennzahlen und Tabellen")}</div>`,
    () => `<h2 id="sheetTitle">Dein Depot <span class="fine">(freiwillig)</span></h2><p class="fine">Dann sagt dir das Radar, was zu deinen Anlagen passt und wo du vom Plan abweichst. Bleibt nur auf deinem Gerät. Kannst du auch später unter „Mein Geld“ eintragen.</p>${depotEditor(ob.depot)}`,
  ][s]();
  $("#sheetBody").innerHTML = `<div class="ob-dots">${Array.from({ length: steps }, (_, i) => `<i class="${i === s ? "on" : i < s ? "done" : ""}"></i>`).join("")}</div>${body}
    <div class="ob-actions">${s ? '<button type="button" class="btn btn-ghost" data-ob="back">Zurück</button>' : '<button type="button" class="btn btn-ghost" data-ob="skip">Überspringen</button>'}
      <button type="button" class="btn btn-primary" data-ob="${s === steps - 1 ? "done" : "next"}">${s === steps - 1 ? "Fertig" : "Weiter"}</button></div>`;
}
function finishOnboarding() {
  readDepotEditor($("#sheet"), (list) => (ob.depot = list));
  const list = ob.interests.length ? ob.interests : ALL;
  store.set("interests", list);
  store.set("prefs", { ...(store.get("prefs", {}) || {}), off: ALL.filter((k) => !list.includes(k)) });
  const goal = ob.goal || suggestGoal(ob.drop, ob.horizon);
  store.set("goal", goal);
  const plan = store.get("plan", {}) || {};
  store.set("plan", { once: 5000, monthly: 200, ...plan, years: HORIZON.find(([k]) => k === ob.horizon)[2], profile: goal });
  store.set("mode", ob.mode === "pro" ? "pro" : "easy");
  store.set("portfolio", ob.depot);
  store.set("onboarded", true);
  closeSheet(); toast("Eingerichtet. Alles jederzeit änderbar über das Menü.");
  setTimeout(() => location.reload(), 700);
}
function onboardingClick(e) {
  const t = e.target;
  const pick = (sel) => t.closest(sel);
  let b;
  if ((b = pick("[data-int]"))) { const k = b.dataset.int; ob.interests = ob.interests.includes(k) ? ob.interests.filter((x) => x !== k) : [...ob.interests, k]; return renderOnboarding(), true; }
  if ((b = pick("[data-hor]"))) { ob.horizon = b.dataset.hor; ob.goal = null; return renderOnboarding(), true; }
  if ((b = pick("[data-drop]"))) { ob.drop = Number(b.dataset.drop); ob.goal = null; return renderOnboarding(), true; }
  if ((b = pick("[data-goal]"))) { ob.goal = b.dataset.goal; return renderOnboarding(), true; }
  if ((b = pick("[data-mode]")) && b.closest("#sheet")) { ob.mode = b.dataset.mode; return renderOnboarding(), true; }
  if ((b = pick("[data-ob]"))) {
    const a = b.dataset.ob;
    if (a === "skip") { store.set("onboarded", true); closeSheet(); }
    else if (a === "back") { readDepotEditor($("#sheet"), (l) => (ob.depot = l)); ob.step--; renderOnboarding(); }
    else if (a === "next") { ob.step++; renderOnboarding(); }
    else if (a === "done") finishOnboarding();
    return true;
  }
  return false;
}

// ---------- Portfolio ----------
export const CATS = [...BUCKETS.map((b) => [b.id, b.label]), ["stock", "Einzelaktien"], ["other", "Sonstiges (Fonds, Immobilien …)"]];
const CAT_IDS = CATS.map(([k]) => k);
export function depotList() {
  const v = store.get("portfolio", []);
  return Array.isArray(v) ? v.filter((p) => p && CAT_IDS.includes(p.cat) && Number(p.value) > 0).map((p) => ({ cat: p.cat, name: String(p.name || "").slice(0, 60), value: Math.min(1e9, Number(p.value)) })) : [];
}
function depotEditor(list) {
  const rows = (list.length ? list : [{ cat: "world", name: "", value: "" }]).map((p) => `<div class="dp-row">
      <select class="dp-cat" aria-label="Art">${CATS.map(([k, l]) => `<option value="${k}" ${p.cat === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <input class="dp-name" type="text" maxlength="60" placeholder="Name (optional), z. B. Apple" value="${esc(p.name || "")}" aria-label="Name">
      <span class="inp"><input class="dp-val" type="number" inputmode="decimal" min="0" step="100" placeholder="Wert" value="${esc(p.value ?? "")}" aria-label="Wert in Euro"><em>€</em></span>
      <button type="button" class="btn btn-icon dp-del" aria-label="Position entfernen">✕</button></div>`).join("");
  return `<div class="dp-editor"><div class="dp-rows">${rows}</div><button type="button" class="btn btn-ghost" data-dp="add">+ Position</button></div>`;
}
function readDepotEditor(root, cb) {
  const rows = root ? $$(".dp-row", root) : []; if (!rows.length) return;
  cb(rows.map((r) => ({ cat: r.querySelector(".dp-cat").value, name: r.querySelector(".dp-name").value.trim().slice(0, 60), value: Number(r.querySelector(".dp-val").value) }))
    .filter((p) => CAT_IDS.includes(p.cat) && p.value > 0));
}
/** Compares holdings with the plan. Pure: returns shares, deviations and warnings. */
export function analyzeDepot(list, targets = {}) {
  const total = list.reduce((s, p) => s + p.value, 0);
  if (!total) return { total: 0, rows: [], warnings: [] };
  const by = {};
  for (const p of list) { const k = p.cat === "stock" ? "themes" : p.cat; by[k] = (by[k] || 0) + p.value; }
  const keys = [...new Set([...Object.keys(by), ...Object.keys(targets).filter((k) => targets[k] > 0)])];
  const rows = keys.map((k) => ({ cat: k, share: (by[k] || 0) / total, target: (targets[k] ?? 0) / 100 })).sort((a, b) => b.share - a.share);
  const warnings = [];
  for (const p of list) if (["stock", "btc", "themes"].includes(p.cat) && p.value / total > 0.1) warnings.push(`${p.name || CATS.find(([k]) => k === p.cat)[1]} macht ${Math.round((p.value / total) * 100)} % deines Depots aus. Eine einzelne riskante Position über 10 % kann dein Ergebnis allein bestimmen.`);
  const sat = ((by.themes || 0) + (by.btc || 0)) / total, satT = ((targets.themes || 0) + (targets.btc || 0)) / 100;
  if (Object.keys(targets).length && sat > satT + 0.05) warnings.push(`Riskante Beimischungen (Einzelaktien, Themen, Krypto) machen ${Math.round(sat * 100)} % aus, dein Plan sieht ${Math.round(satT * 100)} % vor.`);
  // One combined line for plan deviations instead of one warning each
  const dev = rows.filter((r) => r.target > 0 && Math.abs(r.share - r.target) >= 0.1)
    .map((r) => `${CATS.find(([k]) => k === r.cat)?.[1] || r.cat} ${r.share > r.target ? "+" : "−"}${Math.round(Math.abs(r.share - r.target) * 100)} Punkte`);
  if (dev.length) warnings.push(`Abweichung vom Plan: ${dev.join(", ")}. Am einfachsten über die nächsten Sparplan-Raten angleichen (Rebalancing).`);
  return { total, rows: rows.filter((r) => r.share > 0 || r.target >= 0.05), warnings };
}
const CAT_ASSET = { world: "world", em: "em", bonds: "bonds", gold: "gold", btc: "btc", cash: "moneymarket" };
function radarSays(p, d) {
  const a = CAT_ASSET[p.cat] && (d.assets || []).find((x) => x.id === CAT_ASSET[p.cat]);
  if (a) return `<button type="button" class="rowbtn" data-detail="asset:${esc(a.id)}"><b>${esc(p.name || a.name)}</b><span class="fine">${esc(a.name)}: 1 Monat <span class="${dirCls(a.chg1m)}">${pct(a.chg1m, 0)}</span>, ${a.ext200 >= 0 ? "Trend aufwärts" : "Trend abwärts"}</span></button>`;
  const n = (p.name || "").toLowerCase(); if (n.length < 3) return "";
  // Resolve a company name to its ticker via the analyst list (e.g. "Nvidia" → NVDA)
  const an = (d.analysts || []).find((x) => x.sym.toLowerCase() === n || String(x.name || "").toLowerCase().includes(n));
  const sym = (an?.sym || n).toLowerCase();
  const t = (d.themes || []).find((x) => x.name.toLowerCase().includes(n) || (x.tickers || []).some((k) => k.sym.toLowerCase() === sym));
  const target = an && ok(an.upside) ? ` · ${an.analysts} Analysten sehen im Schnitt ${pct(an.upside, 0)} bis zum Kursziel` : "";
  if (t) return `<button type="button" class="rowbtn" data-open="${esc(t.id)}"><b>${esc(p.name)}</b><span class="fine">Thema ${esc(t.name)}: ${esc({ quiet: "steigt still", hot: "heißes Momentum", noise: "Hype ohne Kurs", forgotten: "vergessen", overheated: "überhitzt" }[t.scores?.quadrant] || "keine Einordnung")}${esc(target)}</span></button>`;
  if (an) return `<div class="rowbtn"><b>${esc(p.name)}</b><span class="fine">${esc(target.slice(3))}</span></div>`;
  const ins = (d.insiders?.buys || []).find((x) => x.sym.toLowerCase() === n || x.name.toLowerCase().includes(n));
  if (ins) return `<div class="rowbtn"><b>${esc(p.name)}</b><span class="fine">Insider haben zuletzt gekauft (${esc(ins.last || "")})</span></div>`;
  return "";
}
export function renderDepot() {
  const el = $("#depotBody"); if (!el) return;
  const list = depotList(), d = state.data || {};
  let targets = {};
  try { targets = buildPlan(store.get("plan", { once: 5000, monthly: 200, years: 15, profile: store.get("goal", "auto") }), d).weights || {}; } catch { /* no plan yet */ }
  const a = analyzeDepot(list, targets);
  if (!list.length) {
    el.innerHTML = `<p>Trag ein, was du schon hast. Dann zeigt dir das Radar, wo du vom Plan abweichst, wo ein Klumpenrisiko steckt und was es zu deinen Anlagen sagt. <b>Freiwillig, bleibt auf deinem Gerät.</b></p>${depotEditor([])}<button type="button" class="btn btn-primary" data-dp="save">Depot speichern</button>`;
    return;
  }
  const label = (k) => CATS.find(([c]) => c === k)?.[1] || k;
  const says = list.map((p) => radarSays(p, d)).filter(Boolean);
  el.innerHTML = `<div class="dp-total">Gesamt <b>${fmt(a.total)} €</b> <span class="fine">in ${list.length} Position${list.length === 1 ? "" : "en"}</span></div>
    <div class="dp-bars">${a.rows.map((r) => `<div class="dp-bar"><span>${esc(label(r.cat))}</span><span class="track"><i style="width:${Math.min(100, r.share * 100)}%"></i>${r.target ? `<em style="left:${Math.min(100, r.target * 100)}%" title="Plan: ${Math.round(r.target * 100)} %"></em>` : ""}</span><b>${Math.round(r.share * 100)} %</b><span class="fine">${r.target ? `Plan ${Math.round(r.target * 100)} %` : "nicht im Plan"}</span></div>`).join("")}</div>
    <p class="fine">Strich = Anteil laut deinem Plan (Ziel ${esc(GOALS[store.get("goal", "ausgewogen")]?.label || "")}).</p>
    ${a.warnings.length ? `<div class="dp-warn"><h3>Das fällt auf</h3><ul>${a.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>` : '<p class="dp-ok">✓ Dein Depot passt gut zu deinem Plan.</p>'}
    ${says.length ? `<h3>Was das Radar zu deinen Anlagen sagt</h3><div class="dp-says">${says.join("")}</div>` : ""}
    <details class="dp-edit"><summary>Depot bearbeiten</summary>${depotEditor(list)}<button type="button" class="btn btn-primary" data-dp="save">Speichern</button></details>`;
}
function depotClick(e) {
  const b = e.target.closest("[data-dp], .dp-del"); if (!b) return false;
  const editor = b.closest(".dp-editor, #depotBody, #sheetBody");
  if (b.classList.contains("dp-del")) { const row = b.closest(".dp-row"); if (row.parentElement.children.length > 1) row.remove(); else row.querySelectorAll("input").forEach((i) => (i.value = "")); return true; }
  if (b.dataset.dp === "add") { const rows = editor.querySelector(".dp-rows"); const tmp = document.createElement("div"); tmp.innerHTML = depotEditor([{ cat: "world", name: "", value: "" }]); rows.appendChild(tmp.querySelector(".dp-row")); return true; }
  if (b.dataset.dp === "save") { readDepotEditor(b.closest("#depotBody"), (l) => store.set("portfolio", l)); renderDepot(); toast("Depot gespeichert (nur auf diesem Gerät)"); return true; }
  return false;
}

// ---------- Wiring ----------
export function initPersonal({ openPrefs, onGoto }) {
  document.addEventListener("click", (e) => {
    if (depotClick(e)) return;
    if (!$("#sheet").hidden && onboardingClick(e)) return;
    const g = e.target.closest("[data-goto]");
    if (g) { e.preventDefault(); closeSheet(); const [v, a] = g.dataset.goto.split(":"); (onGoto || goTo)(v, a); return; }
    const act = e.target.closest("[data-act]");
    if (act) { const a = act.dataset.act; if (a === "onboard") openOnboarding(); else if (a === "prefs") { closeSheet(); openPrefs(); } else if (a === "backup") { closeSheet(); openPrefs(); setTimeout(() => $("#backupBox")?.scrollIntoView(), 100); } return; }
    if (e.target.closest("[data-menu]")) { e.preventDefault(); openMenu(); return; }
    if (e.target.closest("#moreSecBtn")) { const v = e.target.closest(".view"); v.classList.toggle("show-folded"); e.target.textContent = v.classList.contains("show-folded") ? "Weitere Bereiche ausblenden" : e.target.textContent.replace("ausblenden", "anzeigen"); return; }
    if (e.target.closest("[data-sheet-close]") || e.target === $("#sheet")) closeSheet();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
  applyInterests(); smartNav();
  const h = location.hash;
  if (!store.get("onboarded", false) && !h.startsWith("#plan=") && !h.startsWith("#thema=")) setTimeout(openOnboarding, 400);
}
