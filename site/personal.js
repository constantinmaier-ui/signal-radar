// Personal layer: optional onboarding, interests, smart navigation, menu with everything, portfolio.
// Everything stays in the browser (localStorage) and can be changed at any time.
import { $, $$, esc, fmt, pct, ok, store, state, dirCls, toast, cleanTopics, myTopics } from "./ui.js";
import { TOPICS } from "./trust.js";
import { BUCKETS, buildPlan, profileFacts } from "./plan.js";
import { GOALS, buildSignals, dailyVerdict } from "./signals.js";
import { topicOf } from "./heute.js";
import { PERSONAS, personas } from "./personas.js";
import { hashFor, applySub, anchorOf } from "./subnav.js";
import { validRef, quoteOf, positionValue, ensureDatalist, matchAny, suggestCoins, loadCoins, refreshCoinPrices, fmtEur } from "./holdings.js";
import { saveDraft, loadDraft, clearDraft, draftAge } from "./drafts.js";
import { FAMILY, HOME, LEARN, GOAL_TYPES, ageOf, situation, cleanSituation, readinessLine, goalsOf } from "./situation.js";

// ---------- Interests ----------
// Which interest topic each "Entdecken" section belongs to (a section can serve several)
export const SECTION_TOPICS = {
  frueh: ["macro"], anlagen: ["stocks", "crypto"], rohstoffe: ["commodities"], weitere: ["stocks"], immobilien: ["realestate"],
  stimmung: ["macro", "stocks", "crypto"], offiziell: ["macro"], fruehsignale: ["themes", "stocks", "pros"], trends: ["themes"], karte: ["themes"], themen: ["themes"],
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

/** Interests now order the sub-pages (see subnav.js); old folding state is cleared. */
export function applyInterests() {
  const view = $('.view[data-view="entdecken"]'); if (!view) return;
  view.querySelector(".more-sections")?.remove();
  for (const el of view.querySelectorAll(".folded")) el.classList.remove("folded");
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
  // a section only shown in the Profi view: switch it on instead of landing on an empty spot
  const t = anchor && document.getElementById(anchor);
  if (t?.closest(".pro-only") && document.body.classList.contains("mode-easy")) document.querySelector('#modeSeg [data-mode="pro"]')?.click();
  const target = hashFor(view, anchor);
  if (location.hash !== target) location.hash = target.slice(1); else applySub(view);
  setTimeout(() => {
    const el = anchor && document.getElementById(anchor); if (!el) return;
    if (el.tagName === "DETAILS") el.open = true;
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
      const pro = s.classList.contains("pro-only") ? ' <span class="fine">(Profi)</span>' : "";
      return `<button type="button" class="menu-item" data-goto="${v}:${esc(s.id)}">${esc(label)}${star}${pro}</button>`;
    }).join("");
    return `<div class="menu-group"><h4>${title}</h4>${items}</div>`;
  }).join("");
  $("#sheetBody").innerHTML = `<h2 id="sheetTitle">Alles auf einen Blick</h2><p class="fine">★ = passt zu deinen Interessen. Tipp: Mit der Suche 🔍 findest du alles noch schneller.</p>
    <div class="menu-grid">${groups}
      <div class="menu-group"><h4>Einstellungen</h4>
        <button type="button" class="menu-item" data-act="profile">👤 Mein Profil: alles ansehen &amp; ändern</button>
        <button type="button" class="menu-item" data-act="onboard">🔁 Einrichtung wiederholen (vorausgefüllt)</button>
        <button type="button" class="menu-item" data-act="prefs">Interessen &amp; Bereiche anpassen</button>
        <button type="button" class="menu-item" data-goto="plan:depot">Mein Depot bearbeiten</button>
        <button type="button" class="menu-item" data-act="backup">Sicherung &amp; andere Geräte</button>
        <button type="button" class="menu-item" data-goto="wissen:installieren">Als App installieren</button>
      </div></div>`;
  $("#sheet").hidden = false;
}
export const closeSheet = () => { $("#sheet").hidden = true; setTimeout(() => renderNextSteps(), 50); };

// ---------- "Mein Profil": everything entered, in one place, each part editable ----------
export function openProfile(openPrefs) {
  const sit = situation(), plan = store.get("plan", {}) || {}, goal = store.get("goal", "ausgewogen");
  const pers = personas().map((k) => PERSONAS.find((p) => p.id === k)?.label).filter(Boolean);
  const ints = interests(), themes = (state.data?.themes || []).filter((t) => state.watch.has(t.id)).map((t) => t.short), topics = myTopics();
  const dep = liveDepot(), total = dep.reduce((a, p) => a + p.value, 0), age = ageOf(sit);
  const goalLabel = goalsOf(sit).map((x) => (x.type === "eigenes" ? x.name || "Eigenes Ziel" : GOAL_TYPES.find(([k]) => k === x.type)?.[1])).join(", ");
  const row = (title, value, act) => `<div class="pf-row"><div><b>${title}</b><span class="fine">${value || "noch nichts eingetragen"}</span></div>${act}</div>`;
  const edit = (step) => `<button type="button" class="btn btn-ghost btn-sm" data-edit="${step}">Ändern</button>`;
  $("#sheetBody").innerHTML = `<h2 id="sheetTitle">👤 Mein Profil</h2><p class="fine">Alles, was du eingegeben hast. Jeder Teil lässt sich einzeln ändern. Bleibt nur auf diesem Gerät.</p>
    ${row("Wofür du das Radar nutzt", esc(pers.join(", ")), edit(0))}
    ${row("Interessen &amp; Themen", esc([isAll(ints) ? "alle Bereiche" : ints.map((k) => TOPICS.find(([x]) => x === k)?.[1]).filter(Boolean).join(", "), themes.length ? `Trends: ${themes.join(", ")}` : "", topics.length ? `eigene: ${topics.join(", ")}` : ""].filter(Boolean).join(" · ")), edit(0))}
    ${row("Risikoprofil &amp; Anlagedauer", `${esc(GOALS[goal]?.label || "")}${plan.years ? `, ${plan.years} Jahre` : ""}<br>${profileText(goal)}`, edit(1))}
    ${row("Deine Situation &amp; Ziel", esc([age ? `${age} Jahre` : "", sit.retireAge || age ? `Rente mit ${sit.retireAge || 67}` : "", goalLabel || "", sit.spend ? `Ausgaben ${fmt(sit.spend)} €/Mon.` : ""].filter(Boolean).join(" · ")), edit(2))}
    ${row("Detailgrad &amp; Lernen", esc(store.get("mode", "easy") === "pro" ? "Profi" : "Einsteiger"), edit(3))}
    ${row("Dein Depot", dep.length ? esc(`${dep.length} Positionen, ${fmt(total)} €`) : "", edit(4))}
    ${row("Bereiche ausblenden", "einzelne Abschnitte ein- oder ausschalten", '<button type="button" class="btn btn-ghost btn-sm" data-act="prefs">Öffnen</button>')}
    ${row("Sicherung &amp; andere Geräte", "verschlüsselt sichern, auf Handy oder Computer übertragen", '<button type="button" class="btn btn-ghost btn-sm" data-act="backup">Öffnen</button>')}
    <div class="bk-btns"><button type="button" class="btn btn-primary" data-act="onboard">🔁 Einrichtung wiederholen</button></div>
    <p class="fine">Deine bisherigen Angaben sind dabei vorausgefüllt. Du änderst nur, was nicht mehr stimmt.</p>`;
  $("#sheet").hidden = false;
}

// ---------- Onboarding ----------
const HORIZON = [["kurz", "unter 3 Jahren", 2], ["mittel", "3 bis 10 Jahre", 7], ["lang", "über 10 Jahre", 15]];
const DROP = [[1, "Alles verkaufen"], [2, "Einen Teil verkaufen"], [3, "Nichts tun, abwarten"], [4, "Nachkaufen"]];
/** Short risk-tolerance estimate (inspired by Grable & Lytton 1999 / MiFID II suitability). Pure. */
export function suggestGoal(drop, horizon) {
  if (horizon === "kurz") return "sicherheit";
  const s = (Number(drop) || 2) + (horizon === "lang" ? 2 : 1);
  return s <= 3 ? "sicherheit" : s === 4 ? "ausgewogen" : s === 5 ? "wachstum" : "mutig";
}
// Value proposition and data freshness, shown at the start and in "Über das Radar"
export const VALUE_HTML = `<ul>
  <li><b>Alles an einem Ort:</b> Börse, Notenbanken, Forschung, Immobilien, Rohstoffe, Krypto und Profis. Sonst braucht man dafür viele Apps und Portale.</li>
  <li><b>Übersetzt statt nur Zahlen:</b> Portale zeigen Kurse, das Radar sagt, was sie für <i>dein</i> Ziel und <i>dein</i> Depot bedeuten.</li>
  <li><b>Ehrlich:</b> Bei jeder Zahl stehen Quelle und Beweislage, Studien aus Top-Fachzeitschriften, Hype wird als Hype markiert.</li>
  <li><b>Früher dran:</b> Insider-Käufe, was Entwickler gerade herunterladen, Wettmärkte und Aufmerksamkeit zeigen Trends oft vor den Schlagzeilen.</li>
  <li><b>Unabhängig:</b> kein Broker, keine Provision, keine Werbung, kein Konto, offener Code.</li>
  <li><b>Was es nicht ist:</b> keine Anlageberatung, keine Kursprognose, kein Echtzeit-Werkzeug für Daytrader.</li></ul>`;
export const SOURCES_HTML = `<ul>
  <li><b>Jede Minute live, solange die App offen ist:</b> Bitcoin und Ethereum (CoinGecko, Binance), Tech-News (Hacker News)</li>
  <li><b>Alle 15 Minuten:</b> Kurse von Indizes, ETFs, Aktien und 18 Rohstoffen (Yahoo Finance), Analysten-Konsens, 28 Nachrichtenportale und Pressemitteilungen von EZB und Fed, plus Google News zu jedem der 18 Themen, Stimmung (CNN, Krypto), Wettmärkte (Polymarket), KI-Trends (GitHub, Hugging Face, PyPI, npm), Krypto-Geldflüsse, Strompreis</li>
  <li><b>Stündlich:</b> Insider-Käufe (US-Börsenaufsicht SEC), weltweite Berichterstattung über „Blase“ (GDELT)</li>
  <li><b>Alle 6 Stunden:</b> Studien aus Top-Fachzeitschriften (OpenAlex)</li>
  <li><b>Täglich bis monatlich (amtlich):</b> EZB-Zinsen, Hauspreise (Eurostat), Konjunktur und Stimmung (US-Notenbank, EU-Kommission), Wikipedia-Aufrufe, KI-Stellenanzeigen (Indeed Hiring Lab)</li>
  <li><b>Vierteljährlich:</b> Depots der Top-Investoren (SEC 13F)</li></ul>
  <p class="fine">Komplette Liste mit allen Quellen: Menü → Wissen → Unsere Quellen.</p>`;

// What each risk profile means, in numbers from the plan's real allocation
const PROFILE_FOR = { sicherheit: "Für Geld, das sicher bleiben soll, oder wenn Schwankungen dich nervös machen.", ausgewogen: "Für mittlere Zeiträume (5–10 Jahre) oder wenn du Schwankungen nur begrenzt aushältst.", wachstum: "Für 10+ Jahre, wenn du Rückgänge aussitzen kannst, ohne zu verkaufen.", mutig: "Für 15+ Jahre und starke Nerven: mehr Trends und Krypto, größere Ausschläge." };
export function profileText(k) {
  const f = profileFacts(k); if (!f || !GOALS[k]) return "";
  return `<b>${esc(GOALS[k].label)}:</b> etwa ${f.risky} % Aktien, Trends und Krypto, ${f.safe} % sichere Anlagen. Bei einem Börsencrash (Aktien −50 %) etwa ${String(f.crash).replace("-", "−")} % auf das ganze Depot. ${esc(PROFILE_FOR[k] || "")}`;
}
export function profileTable() {
  return `<table class="pf-table"><thead><tr><th>Profil</th><th>Aktien &amp; Co.</th><th>Sicher</th><th>Crash</th></tr></thead><tbody>${Object.keys(GOALS).map((k) => { const f = profileFacts(k); return f ? `<tr><td>${esc(GOALS[k].label)}</td><td>${f.risky} %</td><td>${f.safe} %</td><td>${String(f.crash).replace("-", "−")} %</td></tr>` : ""; }).join("")}</tbody></table>
    <p class="fine">„Crash“ = Rückgang des ganzen Depots, wenn Aktien um die Hälfte fallen (wie 2008/09). Es ist eine Faustrechnung mit der Aufteilung im Plan, keine Prognose.</p>`;
}

let ob = null;
export function openOnboarding(step = 0, single = false) {
  const plan = store.get("plan", {}) || {};
  ob = { step, single, interests: interests(), horizon: plan.years ? (plan.years < 3 ? "kurz" : plan.years <= 10 ? "mittel" : "lang") : "lang", drop: 3, horizon0: null, goal: store.get("goal", null), personas: personas(), watch: [...state.watch], topics: myTopics(), sit: situation(), learn: (store.get("learn", []) || []).filter((k) => LEARN.some(([x]) => x === k)), mode: store.get("mode", "easy"), depot: depotList() };
  ob.horizon0 = ob.horizon;
  // Half-finished setup? Continue where the user left off, with everything entered so far
  const dr = loadDraft(obKey(step, single));
  if (dr && dr.value && typeof dr.value === "object") ob = { ...ob, ...dr.value, single, restored: dr.at, ...(single ? { step } : {}) };
  renderOnboarding();
  $("#sheet").hidden = false;
}
const obKey = (step, single) => (single ? `onboarding-${step}` : "onboarding");
/** Reads everything typed on the current step into the setup state (also unfinished rows). */
function captureStep() {
  readSituation(); readTopics();
  const root = $("#sheet");
  if (root && root.querySelector(".dp-row")) { ob.depotRaw = rawDepotRows(root); readDepotEditor(root, (l) => (ob.depot = l)); }
}
/** Keeps the setup as a draft on this device (step and everything entered so far). */
/** Only once the user changed something, so merely opening and closing leaves no draft. */
function saveObDraft() { if (!ob || !ob.touched) return; const { restored, ...rest } = ob; saveDraft(obKey(ob.step, ob.single), rest); }
function renderOnboarding() {
  const steps = 6, s = ob.step;
  const chip = (attr, val, on, label) => `<button type="button" class="chip-btn ${on ? "on" : ""}" data-${attr}="${esc(val)}">${esc(label)}</button>`;
  const body = [
    () => `${!ob.single && store.get("onboarded", false) ? `<div class="ob-again">🔁 <b>Einrichtung wiederholen.</b> Deine bisherigen Angaben sind vorausgefüllt. Ändere nur, was nicht mehr stimmt, und tippe dich mit „Weiter“ durch.</div>` : ""}${ob.single || store.get("onboarded", false) ? "" : `<div class="ob-intro"><b>Willkommen beim Signal-Radar.</b> Es liest alle 15 Minuten über 100 Quellen (Börsen, Notenbanken, Studien, Nachrichten) und sagt dir in einfachen Worten:<ul><li>was heute an den Märkten los ist,</li><li>was zu deinem Ziel und deinem Depot passt,</li><li>wo Hype ist und wo echte Chancen,</li></ul>jeweils mit Quelle und wie gut das belegt ist. Kostenlos, ohne Anmeldung, deine Daten bleiben auf deinem Gerät.
        <details class="ob-more"><summary>Was macht es besser als Finanzportale und Apps?</summary>${VALUE_HTML}</details>
        <details class="ob-more"><summary>Welche Quellen, wie oft?</summary>${SOURCES_HTML}</details></div>`}
      <h2 id="sheetTitle">Wofür nutzt du das Radar?</h2><p class="fine">Dann bekommst du unter „Dein Radar“ eigene Live-Infos. Mehrere möglich, freiwillig.</p>
      <div class="chips-wrap">${PERSONAS.map((p) => chip("pers", p.id, ob.personas.includes(p.id), `${p.icon} ${p.label}`)).join("")}</div>
      <p><b>Welche Bereiche interessieren dich?</b> <span class="fine">Danach richtet sich, was oben steht und was eingeklappt wird.</span></p>
      <div class="chips-wrap">${TOPICS.map(([k, l]) => chip("int", k, ob.interests.includes(k), l)).join("")}</div>
      ${(state.data?.themes || []).length ? `<p><b>Welche Trends willst du verfolgen?</b> <span class="fine">(landen auf deiner Merkliste)</span></p>
      <div class="chips-wrap">${state.data.themes.map((t) => chip("wt", t.id, ob.watch.includes(t.id), t.short)).join("")}</div>` : ""}
      <label class="ob-topics"><b>Eigene Themen</b> <span class="fine">mit Komma trennen, z. B. Wasserstoff, Rheinmetall, Indien</span>
        <input id="obTopics" type="text" maxlength="300" value="${esc(ob.topics.join(", "))}" placeholder="Was dich sonst interessiert"></label>`,
    () => { const sug = suggestGoal(ob.drop, ob.horizon), g = ob.goal || sug;
      return `<h2 id="sheetTitle">Dein Ziel</h2>
      <p><b>Wie lange willst du das Geld anlegen?</b></p><div class="chips-wrap">${HORIZON.map(([k, l]) => chip("hor", k, ob.horizon === k, l)).join("")}</div>
      <p><b>Stell dir vor, dein Depot verliert in einem Monat 20 %. Was tust du?</b></p><div class="chips-wrap">${DROP.map(([k, l]) => chip("drop", k, ob.drop === k, l)).join("")}</div>
      <p><b>Vorschlag:</b> ${esc(GOALS[sug].label)}. Du kannst frei wählen:</p><div class="chips-wrap">${Object.entries(GOALS).map(([k, v]) => chip("goal", k, g === k, v.label)).join("")}</div>
      <p class="pf-now">${profileText(g)}</p>
      <details class="ob-more"><summary>Alle Profile im Vergleich</summary>${profileTable()}</details>
      <p class="fine">Kurzfassung typischer Fragen zur Risikobereitschaft (angelehnt an Grable &amp; Lytton 1999 und die Eignungsprüfung nach MiFID II). Kein Ersatz für eine Beratung.</p>`; },
    () => { const t = ob.sit, val = (x) => (x === null || x === undefined ? "" : esc(x));
      return `<h2 id="sheetTitle">Deine Situation <span class="fine">(freiwillig)</span></h2>
      <p class="fine">Damit das Radar sagt, ob du bereit bist zu investieren. Alles optional, bleibt auf deinem Gerät.</p>
      <div class="sit-grid">
        <label>Dein Alter<span class="inp"><input id="sitAge" type="number" inputmode="numeric" min="14" max="100" step="1" value="${val(ageOf(t))}"><em>Jahre</em></span></label>
        <label>Rente mit<span class="inp"><input id="sitRetire" type="number" inputmode="numeric" min="50" max="80" step="1" value="${val(t.retireAge)}" placeholder="67"><em>Jahren</em></span></label>
      </div>
      <p><b>Deine Ziele</b> <span class="fine">(mehrere möglich)</span></p><div class="chips-wrap">${GOAL_TYPES.map(([k, l]) => chip("gtype", k, goalsOf(t).some((x) => x.type === k), l)).join("")}</div>
      ${goalsOf(t).filter((x) => x.type !== "rente" && x.type !== "vermoegen").map((x) => `<div class="sit-grid goal-row"><b class="fine">${esc(x.type === "eigenes" ? "Eigenes Ziel" : GOAL_TYPES.find(([k]) => k === x.type)?.[1])}</b>
        ${x.type === "eigenes" ? `<label>Wofür?<input data-ob-g="${x.type}" data-k="name" type="text" maxlength="40" value="${val(x.name)}" placeholder="z. B. Weltreise"></label>` : ""}
        <label>Wie viel?<span class="inp"><input data-ob-g="${x.type}" data-k="amount" type="number" inputmode="decimal" min="0" step="1000" value="${val(x.amount)}"><em>€</em></span></label>
        <label>Bis wann?<span class="inp"><input data-ob-g="${x.type}" data-k="year" type="number" inputmode="numeric" min="${new Date().getFullYear()}" step="1" value="${val(x.year)}"><em>Jahr</em></span></label></div>`).join("")}
      ${goalsOf(t).some((x) => x.type === "rente") ? `<div class="sit-grid">
        <label>Netto-Einkommen heute<span class="inp"><input id="sitNet" type="number" inputmode="decimal" min="0" step="100" value="${val(t.net)}"><em>€/Mon.</em></span></label>
        <label>Gesetzliche Rente laut Renteninformation<span class="inp"><input id="sitPension" type="number" inputmode="decimal" min="0" step="50" value="${val(t.pension)}"><em>€/Mon.</em></span></label>
        <label>So viel möchte ich im Alter haben<span class="inp"><input id="sitWant" type="number" inputmode="decimal" min="0" step="100" value="${val(t.want)}" placeholder="${t.net ? Math.round(t.net * 0.8) : "z. B. 2.500"}"><em>€/Mon.</em></span></label>
      </div><p class="fine">Netto zählt, nicht Brutto: Im Alter zählt, was du ausgeben kannst. Die Renteninformation kommt jährlich per Post von der Deutschen Rentenversicherung. Ohne Wunschbetrag rechnet das Radar mit 80 % deines Nettos.</p>` : ""}
      <p><b>Teure Kredite (Dispo, Ratenkredit)?</b></p><div class="chips-wrap">${chip("debt", "1", t.debt === true, "Ja")}${chip("debt", "0", t.debt === false, "Nein")}</div>
      <div class="sit-grid">
        <label>Ausgaben pro Monat (inkl. Miete)<span class="inp"><input id="sitSpend" type="number" inputmode="decimal" min="0" step="50" value="${val(t.spend)}"><em>€</em></span></label>
        <label>Auf Tagesgeld / Konto<span class="inp"><input id="sitCash" type="number" inputmode="decimal" min="0" step="500" value="${val(t.cash)}"><em>€</em></span></label>
        <label>Davon sparbar pro Monat<span class="inp"><input id="sitSave" type="number" inputmode="decimal" min="0" step="25" value="${val(t.save)}"><em>€</em></span></label>
      </div>`; },
    () => `<h2 id="sheetTitle">Wie viel Detail?</h2><div class="chips-wrap">${chip("mode", "easy", ob.mode !== "pro", "Einsteiger: das Wichtigste, einfach erklärt")}${chip("mode", "pro", ob.mode === "pro", "Profi: alle Kennzahlen und Tabellen")}</div>
      <p><b>Was möchtest du lernen?</b> <span class="fine">(freiwillig, mehrere möglich)</span></p><div class="chips-wrap">${LEARN.map(([k, l]) => chip("learn", k, ob.learn.includes(k), l)).join("")}</div>`,
    () => `<h2 id="sheetTitle">Dein Depot <span class="fine">(freiwillig)</span></h2><p class="fine">Dann sagt dir das Radar, was zu deinen Anlagen passt und wo du vom Plan abweichst. Bleibt nur auf deinem Gerät. Kannst du auch später unter „Mein Geld“ eintragen.</p>${depotEditor(ob.depotRaw?.length ? ob.depotRaw : ob.depot)}`,
    () => `<h2 id="sheetTitle">🔒 Sichern &amp; Geräte <span class="fine">(empfohlen)</span></h2>
      <p>Deine Eingaben liegen nur auf diesem Gerät, nicht bei uns. Das ist sicher, aber sie können verloren gehen. Wähle, wie du sie schützen willst:</p>
      <div class="bk-choose">
        <details class="ob-more"><summary>📱 Nur auf diesem Gerät (Standard)</summary><p>Nichts zu tun. <b>Risiko:</b> Löschst du die Browserdaten, sind die Eingaben weg. Am iPhone löscht Safari Daten von Webseiten nach 7 Tagen ohne Besuch, außer das Radar ist als App auf dem Home-Bildschirm installiert.</p><p><button type="button" class="link-btn" data-goto="wissen:installieren">So installierst du das Radar als App →</button></p></details>
        <details class="ob-more"><summary>💾 Verschlüsselte Datei (empfohlen)</summary><p>Das Radar verschlüsselt deine Eingaben mit deinem Passwort (AES-256) und legt sie als Datei ab, am Handy über das Teilen-Menü in „Dateien“, iCloud, Dropbox oder Google Drive. <b>Sicher</b>, weil die Datei ohne Passwort unlesbar ist, auch für Apple, Google oder Dropbox.</p></details>
        <details class="ob-more"><summary>🔗 Link fürs andere Gerät</summary><p>Ein Link mit deinen verschlüsselten Eingaben. Schick ihn dir selbst, öffne ihn am anderen Gerät, gib das Passwort ein. <b>Nie Link und Passwort in derselben Nachricht verschicken.</b></p></details>
        <details class="ob-more"><summary>⏱️ Automatisch sichern (Computer)</summary><p>In Chrome oder Edge am Computer: einmal eine Datei im Dropbox-, OneDrive- oder iCloud-Ordner wählen, danach sichert das Radar nach jeder Änderung von selbst, verschlüsselt.</p></details>
        <details class="ob-more"><summary>☁️ Sync über alle Geräte (Dropbox, in Vorbereitung)</summary><p>Automatisch abgeglichen zwischen Handy und Computer, Ende-zu-Ende-verschlüsselt. Kommt, sobald die Dropbox-Verbindung freigeschaltet ist.</p></details>
        <details class="ob-more"><summary>🛡️ Was ist ein sicheres Passwort?</summary><p>Lang schlägt kompliziert: ein Satz aus 4–5 Wörtern, den nur du kennst. Am besten im Passwort-Manager speichern (z. B. im iPhone-Schlüsselbund oder Google Passwortmanager). Ohne Passwort kann niemand die Sicherung öffnen, auch wir nicht. Geht es verloren, ist auch die Sicherung verloren.</p>
          <p><a href="https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/Informationen-und-Empfehlungen/Cyber-Sicherheitsempfehlungen/Accountschutz/Sichere-Passwoerter-erstellen/sichere-passwoerter-erstellen_node.html" target="_blank" rel="noopener">BSI: Sichere Passwörter erstellen ↗</a></p></details>
      </div>
      <p><b>Jetzt einrichten?</b></p>
      <div class="chips-wrap">${chip("bk", "now", ob.backup === "now", "Ja, gleich nach dem Einrichten")}${chip("bk", "later", ob.backup !== "now", "Später (unter 👤 Mein Profil)")}</div>`,
  ][s]();
  const restoredNote = ob.restored ? `<div class="ob-draft">📝 <b>Weiter, wo du aufgehört hast.</b> Deine Eingaben (${esc(draftAge(ob.restored))}) sind noch da. <button type="button" class="link-btn" data-ob="fresh">Neu beginnen</button></div>` : "";
  saveObDraft();
  $("#sheetBody").innerHTML = `${restoredNote}<div class="ob-dots" ${ob.single ? "hidden" : ""}>${Array.from({ length: steps }, (_, i) => `<i class="${i === s ? "on" : i < s ? "done" : ""}"></i>`).join("")}</div>${body}
    <div class="ob-actions">${ob.single ? '<button type="button" class="btn btn-ghost" data-ob="cancel">Abbrechen</button><button type="button" class="btn btn-primary" data-ob="done">Speichern</button>'
      : `${s ? '<button type="button" class="btn btn-ghost" data-ob="back">Zurück</button>' : '<button type="button" class="btn btn-ghost" data-ob="skip">Überspringen</button>'}
      <button type="button" class="btn btn-primary" data-ob="${s === steps - 1 ? "done" : "next"}">${s === steps - 1 ? "Fertig" : "Weiter"}</button>`}</div>`;
}
function readTopics() { const el = $("#obTopics"); if (el) ob.topics = cleanTopics(el.value.split(",")); }
function readSituation() {
  const n = (id) => { const el = $(id); if (!el) return undefined; const v = el.value.trim(); return v === "" ? null : Number(v); };
  for (const [k, id] of [["spend", "#sitSpend"], ["cash", "#sitCash"], ["save", "#sitSave"], ["retireAge", "#sitRetire"], ["net", "#sitNet"], ["pension", "#sitPension"], ["want", "#sitWant"]]) { const v = n(id); if (v !== undefined) ob.sit[k] = v; }
  const goals = goalsOf(ob.sit);
  for (const el of document.querySelectorAll("#sheet [data-ob-g]")) { const g = goals.find((x) => x.type === el.dataset.obG); if (g) g[el.dataset.k] = el.dataset.k === "name" ? el.value.trim() || null : el.value === "" ? null : Number(el.value); }
  ob.sit.goals = goals; ob.sit.goal = goals[0]?.type || null;
  const age = n("#sitAge"); if (age !== undefined) ob.sit.birthYear = age ? new Date().getFullYear() - age : null;
}
function finishOnboarding() {
  captureStep();
  clearDraft(obKey(ob.step, ob.single));
  if (!ob.single) for (let i = 0; i < 6; i++) clearDraft(obKey(i, true));
  const list = ob.interests.length ? ob.interests : ALL;
  store.set("interests", list);
  store.set("personas", ob.personas);
  readTopics(); store.set("mytopics", ob.topics);
  state.watch = new Set(ob.watch); store.set("watch", ob.watch);
  store.set("situation", cleanSituation(ob.sit));
  store.set("learn", ob.learn);
  store.set("prefs", { ...(store.get("prefs", {}) || {}), off: ALL.filter((k) => !list.includes(k)) });
  const goal = ob.goal || suggestGoal(ob.drop, ob.horizon);
  store.set("goal", goal);
  const plan = store.get("plan", {}) || {};
  const years = ob.horizon !== ob.horizon0 || !plan.years ? HORIZON.find(([k]) => k === ob.horizon)[2] : plan.years;
  store.set("plan", { once: 5000, monthly: 200, ...plan, years, profile: goal });
  store.set("mode", ob.mode === "pro" ? "pro" : "easy");
  store.set("portfolio", ob.depot);
  store.set("onboarded", true);
  if (ob.backup === "now") store.set("openBackup", true);
  navigator.storage?.persist?.().catch(() => {}); // ask the browser not to clear these settings when space runs low
  closeSheet(); toast(ob.single ? "Gespeichert" : "Eingerichtet. Alles jederzeit änderbar unter 👤 Mein Profil.");
  setTimeout(() => location.reload(), 700);
}
function onboardingClick(e) {
  const t = e.target;
  if (ob && t.closest?.("#sheet button") && !t.closest("[data-sheet-close], [data-ob='skip'], [data-ob='fresh'], [data-ob='cancel']")) ob.touched = true;
  const pick = (sel) => t.closest(sel);
  let b;
  if ((b = pick("[data-pers]"))) { readTopics();
    const k = b.dataset.pers, on = !ob.personas.includes(k);
    ob.personas = on ? [...ob.personas, k] : ob.personas.filter((x) => x !== k);
    if (on) { const add = PERSONAS.find((p) => p.id === k)?.interests || []; ob.interests = [...new Set([...(isAll(ob.interests) ? [] : ob.interests), ...add])]; }
    return renderOnboarding(), true;
  }
  const toggle = (k) => (ob.sit[k] = ob.sit[k] === b.dataset[k === "family" ? "fam" : k] ? null : b.dataset[k === "family" ? "fam" : k]);
  if ((b = pick("[data-wt]"))) { readTopics(); const k = b.dataset.wt; ob.watch = ob.watch.includes(k) ? ob.watch.filter((x) => x !== k) : [...ob.watch, k]; return renderOnboarding(), true; }
  if ((b = pick("[data-bk]"))) { ob.backup = b.dataset.bk; return renderOnboarding(), true; }
  if ((b = pick("[data-gtype]"))) { readSituation(); const k = b.dataset.gtype, list = goalsOf(ob.sit); ob.sit.goals = list.some((x) => x.type === k) ? list.filter((x) => x.type !== k) : [...list, { type: k }]; ob.sit.goal = ob.sit.goals[0]?.type || null; return renderOnboarding(), true; }
  if ((b = pick("[data-fam]"))) { readSituation(); toggle("family"); return renderOnboarding(), true; }
  if ((b = pick("[data-home]"))) { readSituation(); toggle("home"); return renderOnboarding(), true; }
  if ((b = pick("[data-debt]"))) { readSituation(); const v = b.dataset.debt === "1"; ob.sit.debt = ob.sit.debt === v ? null : v; return renderOnboarding(), true; }
  if ((b = pick("[data-learn]"))) { const k = b.dataset.learn; ob.learn = ob.learn.includes(k) ? ob.learn.filter((x) => x !== k) : [...ob.learn, k]; return renderOnboarding(), true; }
  if ((b = pick("[data-int]"))) { readTopics(); const k = b.dataset.int; ob.interests = ob.interests.includes(k) ? ob.interests.filter((x) => x !== k) : [...ob.interests, k]; return renderOnboarding(), true; }
  if ((b = pick("[data-hor]"))) { ob.horizon = b.dataset.hor; ob.goal = null; return renderOnboarding(), true; }
  if ((b = pick("[data-drop]"))) { ob.drop = Number(b.dataset.drop); ob.goal = null; return renderOnboarding(), true; }
  if ((b = pick("[data-goal]"))) { ob.goal = b.dataset.goal; return renderOnboarding(), true; }
  if ((b = pick("[data-mode]")) && b.closest("#sheet")) { ob.mode = b.dataset.mode; return renderOnboarding(), true; }
  if ((b = pick("[data-ob]"))) {
    const a = b.dataset.ob;
    if (a === "skip") { store.set("onboarded", true); clearDraft("onboarding"); closeSheet(); }
    else if (a === "back") { captureStep(); ob.step--; renderOnboarding(); }
    else if (a === "next") { captureStep(); ob.step++; renderOnboarding(); }
    else if (a === "cancel") { clearDraft(obKey(ob.step, ob.single)); closeSheet(); }
    else if (a === "fresh") { clearDraft(obKey(ob.step, ob.single)); const { step, single } = ob; openOnboarding(single ? step : 0, single); }
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
  return Array.isArray(v) ? v.filter((p) => p && CAT_IDS.includes(p.cat) && (Number(p.value) > 0 || Number(p.qty) > 0))
    .map((p) => ({ cat: p.cat, name: String(p.name || "").slice(0, 60), value: Math.min(1e9, Number(p.value) || 0), ...(validRef(p.ref) ? { ref: p.ref } : {}), ...(Number(p.qty) > 0 ? { qty: Math.min(1e12, Number(p.qty)) } : {}) })) : [];
}
/** Positions with their live euro value (units × price where known). */
export function liveDepot(list = depotList()) {
  return list.map((p) => { const q = quoteOf(p.ref); return { ...p, quote: q, value: positionValue(p, q) || 0 }; }).filter((p) => p.value > 0);
}
function depotEditor(list) {
  const rows = (list.length ? list : [{ cat: "world", name: "", value: "" }]).map((p) => `<div class="dp-row">
      <select class="dp-cat" aria-label="Art">${CATS.map(([k, l]) => `<option value="${k}" ${p.cat === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <input class="dp-name" type="text" maxlength="90" list="dpInstr" placeholder="Name, Kürzel oder ISIN, z. B. MSCI World, SAP, Bitcoin" value="${esc(p.name || "")}" data-ref="${esc(p.ref || "")}" aria-label="Welche Anlage">
      <span class="inp"><input class="dp-qty" type="number" inputmode="decimal" min="0" step="any" placeholder="Stück" value="${esc(p.qty ?? "")}" aria-label="Anzahl Stück (optional)"></span>
      <span class="inp"><input class="dp-val" type="number" inputmode="decimal" min="0" step="100" placeholder="Wert" value="${esc(p.qty && p.ref ? "" : p.value || "")}" aria-label="Wert in Euro"><em>€</em></span>
      <button type="button" class="btn btn-icon dp-del" aria-label="Position entfernen">✕</button></div>`).join("");
  return `<div class="dp-editor"><div class="dp-rows">${rows}</div><button type="button" class="btn btn-ghost" data-dp="add">+ Position</button></div>`;
}
function readDepotEditor(root, cb) {
  const rows = root ? $$(".dp-row", root) : []; if (!rows.length) return;
  cb(rows.map((r) => {
    const nameEl = r.querySelector(".dp-name"), m = matchAny(nameEl.value), ref = m?.ref || (validRef(nameEl.dataset.ref) && nameEl.value.trim() ? nameEl.dataset.ref : "");
    const qty = Number(r.querySelector(".dp-qty")?.value) || 0, value = Number(r.querySelector(".dp-val").value) || 0;
    const q = ref ? quoteOf(ref) : null;
    return { cat: r.querySelector(".dp-cat").value, name: (m?.name || nameEl.value.trim()).slice(0, 60), ...(ref ? { ref } : {}), ...(qty > 0 ? { qty } : {}), value: value || (q && qty ? qty * q.last : 0) };
  }).filter((p) => CAT_IDS.includes(p.cat) && (p.value > 0 || (p.qty > 0 && p.ref))));
}
/** Every editor row as typed, also unfinished ones (for drafts). Pure given the DOM. */
function rawDepotRows(root) {
  return $$(".dp-row", root).map((r) => ({ cat: r.querySelector(".dp-cat")?.value || "world", name: r.querySelector(".dp-name")?.value || "", ref: r.querySelector(".dp-name")?.dataset.ref || "", qty: r.querySelector(".dp-qty")?.value || "", value: r.querySelector(".dp-val")?.value || "" }))
    .filter((r) => r.name.trim() || r.qty || r.value);
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
  const raw = depotList(), list = liveDepot(raw), d = state.data || {};
  // crypto prices come live from CoinGecko; re-render once they are there
  if (raw.some((p) => p.ref?.startsWith("cg:"))) refreshCoinPrices(raw.map((p) => p.ref)).then((changed) => changed && renderDepot());
  let targets = {};
  try { targets = buildPlan(store.get("plan", { once: 5000, monthly: 200, years: 15, profile: store.get("goal", "auto") }), d).weights || {}; } catch { /* no plan yet */ }
  const a = analyzeDepot(list, targets);
  // Unsaved changes from last time come back, clearly marked
  const dd = loadDraft("depot"), draft = dd?.value?.length ? dd.value : null;
  const draftNote = draft ? `<div class="ob-draft">📝 <b>Noch nicht gespeichert:</b> deine Eingaben (${esc(draftAge(dd.at))}) sind noch da. <button type="button" class="link-btn" data-dp="discard">Verwerfen</button></div>` : "";
  if (!raw.length) {
    el.innerHTML = `<p>Trag ein, was du schon hast. Dann zeigt dir das Radar, wo du vom Plan abweichst, wo ein Klumpenrisiko steckt und was es zu deinen Anlagen sagt. <b>Freiwillig, bleibt auf deinem Gerät.</b></p>${draftNote}${depotEditor(draft || [])}<button type="button" class="btn btn-primary" data-dp="save">Depot speichern</button>`;
    return;
  }
  const label = (k) => CATS.find(([c]) => c === k)?.[1] || k;
  const says = list.map((p) => radarSays(p, d)).filter(Boolean);
  const day = list.reduce((sum, p) => sum + (p.quote && ok(p.quote.chg1d) ? p.value - p.value / (1 + p.quote.chg1d) : 0), 0);
  const positions = list.map((p) => `<div class="dp-pos"><b>${esc(p.name || label(p.cat))}</b><b>${fmtEur(p.value)}</b>
    <span class="fine">${esc(label(p.cat))}${p.qty ? ` · ${fmt(p.qty, Number.isInteger(p.qty) ? 0 : p.qty < 10 ? 4 : 2)} Stück` : ""}${p.quote ? ` · Kurs ${fmtEur(p.quote.last)}${ok(p.quote.chg1d) ? ` · heute <span class="${dirCls(p.quote.chg1d)}">${pct(p.quote.chg1d)}</span>` : ""}` : " · Wert von dir eingetragen"}</span></div>`).join("");
  el.innerHTML = `<div class="dp-total">Gesamt <b>${fmt(a.total)} €</b> <span class="fine">in ${list.length} Position${list.length === 1 ? "" : "en"}${day ? ` · heute <span class="${dirCls(day)}">${day > 0 ? "+" : "−"}${fmt(Math.abs(day))} €</span>` : ""}</span></div>
    <details class="dp-list"><summary>Alle Positionen mit Live-Kurs</summary>${positions}<p class="fine">Kurse: ETFs und Aktien alle 15 Min. (Yahoo Finance, Dollar-Werte in Euro umgerechnet), Krypto live (CoinGecko). Ohne Stückzahl zählt der Wert, den du eingetragen hast.</p></details>
    <div class="dp-bars">${a.rows.map((r) => `<div class="dp-bar"><span>${esc(label(r.cat))}</span><span class="track"><i style="width:${Math.min(100, r.share * 100)}%"></i>${r.target ? `<em style="left:${Math.min(100, r.target * 100)}%" title="Plan: ${Math.round(r.target * 100)} %"></em>` : ""}</span><b>${Math.round(r.share * 100)} %</b><span class="fine">${r.target ? `Plan ${Math.round(r.target * 100)} %` : "nicht im Plan"}</span></div>`).join("")}</div>
    <p class="fine">Strich = Anteil laut deinem Plan (Ziel ${esc(GOALS[store.get("goal", "ausgewogen")]?.label || "")}).</p>
    ${a.warnings.length ? `<div class="dp-warn"><h3>Das fällt auf</h3><ul>${a.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>` : '<p class="dp-ok">✓ Dein Depot passt gut zu deinem Plan.</p>'}
    ${says.length ? `<h3>Was das Radar zu deinen Anlagen sagt</h3><div class="dp-says">${says.join("")}</div>` : ""}
    <details class="dp-edit" ${draft ? "open" : ""}><summary>Depot bearbeiten</summary>${draftNote}${depotEditor(draft || raw)}<button type="button" class="btn btn-primary" data-dp="save">Speichern</button></details>`;
}
function depotClick(e) {
  const b = e.target.closest("[data-dp], .dp-del"); if (!b) return false;
  const editor = b.closest(".dp-editor, #depotBody, #sheetBody");
  if (b.classList.contains("dp-del")) { const row = b.closest(".dp-row"); if (row.parentElement.children.length > 1) row.remove(); else row.querySelectorAll("input").forEach((i) => (i.value = "")); return true; }
  if (b.dataset.dp === "add") { const rows = editor.querySelector(".dp-rows"); const tmp = document.createElement("div"); tmp.innerHTML = depotEditor([{ cat: "world", name: "", value: "" }]); rows.appendChild(tmp.querySelector(".dp-row")); return true; }
  if (b.dataset.dp === "save") { readDepotEditor(b.closest("#depotBody"), (l) => store.set("portfolio", l)); clearDraft("depot"); renderDepot(); toast("Depot gespeichert (nur auf diesem Gerät)"); return true; }
  if (b.dataset.dp === "discard") { clearDraft("depot"); renderDepot(); toast("Entwurf verworfen"); return true; }
  return false;
}

// ---------- Executive summary + quick access ----------
export { anchorOf } from "./subnav.js";
const QUICK = [["realestate", "🏡 Immobilien-Rechner", "entdecken:immobilien"], ["themes", "🚀 Trend-Radar", "entdecken:trends"], ["commodities", "🛢️ Rohstoffe", "entdecken:rohstoffe"],
  ["stocks", "📈 Anlageklassen", "entdecken:anlagen"], ["crypto", "₿ Krypto", "entdecken:anlagen"], ["macro", "🌡️ Konjunktur", "entdecken:frueh"], ["pros", "👔 Profis & Insider", "profis:profis"],
  ["news", "📰 Nachrichten", "profis:feed"], [null, "🫧 Blasen-Meter", "heute:lage"], [null, "💰 Mein Depot", "plan:depot"], [null, "🧮 Plan-Rechner", "plan:plan"], [null, "📚 Lexikon", "wissen:lexikon"]];
export function renderSummary() {
  const el = $("#summaryList"); if (!el) return;
  const d = state.data || {}, mine = interests(), all = isAll(mine);
  const off = ALL.filter((k) => !mine.includes(k));
  const sig = buildSignals(d, state.history || []).filter((s) => !off.includes(topicOf(s.id)));
  const plan = store.get("plan", {}) || {}, goal = store.get("goal", "ausgewogen");
  const v = dailyVerdict(d, GOALS[goal] ? goal : "ausgewogen", plan.years || 15);
  const word = { "grün": "🟢 Grün", gelb: "🟡 Gelb", rot: "🔴 Rot" }[v.level] || "🟡 Gelb";
  // Basics first: if the personal check says "not yet", that line leads and no "invest now" line follows
  const ready = readinessLine();
  const lines = ready ? [["⛔", "Für dich zuerst", ready, "plan:bereit"], ["🚦", "Markt", `${word}`, "heute:check"]] : [["🚦", "Lage", `${word}: ${v.head}`, "heute:check"]];
  const dep = liveDepot();
  if (dep.length) {
    let targets = {}; try { targets = buildPlan({ once: 5000, monthly: 200, years: 15, profile: goal, ...plan }, d).weights || {}; } catch { /* ignore */ }
    const a = analyzeDepot(dep, targets);
    lines.push(["💰", "Dein Depot", a.warnings.length ? a.warnings[0] : `${fmt(a.total)} €, passt gut zu deinem Plan (${GOALS[goal]?.label || ""}).`, "plan:depot"]);
  } else if (!ready) lines.push(["🎯", `Für dich (${GOALS[goal]?.label || "Ausgewogen"})`, v.doList[0], "plan:plan"]);
  const chance = sig.find((s) => s.kind === "chance"), risk = sig.find((s) => s.kind === "warnung");
  if (chance) lines.push(["🚀", "Chance", chance.title, `detail:sig:${chance.id}`]);
  if (risk) lines.push(["⚠️", "Risiko", risk.title, `detail:sig:${risk.id}`]);
  const ev = [...(d.events || [])].filter((e) => e.n48h > 0).sort((x, y) => y.n48h - x.n48h)[0];
  if (ev && (all || mine.includes("news") || mine.includes("macro"))) lines.push([ev.icon || "📰", "Nachrichtenlage", `${ev.name}: ${ev.n48h} Meldungen in 48 Stunden`, "profis:eventsSec"]);
  const pill = $("#profilePill");
  if (pill) pill.innerHTML = `<button type="button" class="pp-btn" data-pp-toggle aria-expanded="false">🎯 Dein Profil: <b>${esc(GOALS[goal]?.label || "Ausgewogen")}</b> <span class="fine">ändern</span></button>
    <div class="pp-choices" hidden>${Object.keys(GOALS).map((k) => `<button type="button" class="chip-btn ${k === goal ? "on" : ""}" data-pp="${k}">${esc(GOALS[k].label)}</button>`).join("")}
      <p class="fine pp-why">${profileText(goal)}</p></div>`;
  el.innerHTML = lines.slice(0, 5).map(([i, k, t, g]) => `<li><button type="button" class="sum-item" ${g.startsWith("detail:") ? `data-detail="${esc(g.slice(7))}"` : `data-goto="${esc(g)}"`}><span class="ico">${esc(i)}</span><span><b>${esc(k)}:</b> ${esc(t)}</span><span class="go">›</span></button></li>`).join("");
  const chips = [...QUICK.filter(([t]) => t && !all && mine.includes(t)), ...QUICK.filter(([t]) => !t), ...QUICK.filter(([t]) => t && (all || !mine.includes(t)))];
  const seen = new Set();
  $("#quickChips").innerHTML = `<span class="fine">Schnell zu:</span>${chips.filter(([, , g]) => !seen.has(g) && seen.add(g)).slice(0, 9).map(([, l, g]) => `<button type="button" class="chip-btn" data-goto="${esc(g)}">${esc(l)}</button>`).join("")}`;
}

// ---------- "Dein nächster Schritt": what is missing and where to go next ----------
/** Open setup steps, most useful first. Pure given the inputs. */
export function nextSteps({ personas: pers = [], goalSet = false, age = null, depot = 0, backupAt = null, installed = false, draftStep = null } = {}) {
  const all = [
    ...(draftStep !== null ? [{ id: "draft", done: false, title: "Einrichtung fertig machen", why: `Du warst bei Schritt ${draftStep + 1} von 6. Alles, was du eingegeben hast, ist noch da.`, time: "1 Min.", act: 'data-act="onboard"' }] : []),
    { id: "use", done: pers.length > 0, title: "Sag dem Radar, wofür du es nutzt", why: "Dann siehst du oben deine eigenen Live-Infos.", time: "30 Sek.", act: 'data-edit="0"' },
    { id: "risk", done: goalSet, title: "Risikoprofil wählen", why: "Alle Hinweise richten sich danach, wie mutig du anlegen willst.", time: "1 Min.", act: 'data-edit="1"' },
    { id: "age", done: age !== null, title: "Alter und Ziel eintragen", why: "Dann rechnet das Radar deine Rentenlücke und ob du bereit bist zu investieren.", time: "1 Min.", act: 'data-edit="2"' },
    { id: "depot", done: depot > 0, title: "Depot eintragen", why: "Dann siehst du Live-Wert, Klumpenrisiken und Abweichungen vom Plan.", time: "2 Min.", act: 'data-edit="4"' },
    { id: "backup", done: !!backupAt, title: "Sicherung einrichten", why: "Deine Eingaben liegen nur auf diesem Gerät. Eine Sicherung schützt sie und bringt sie aufs Handy oder den Computer.", time: "1 Min.", act: 'data-act="backup"' },
    { id: "install", done: installed, title: "Als App installieren", why: "Öffnet schneller, auch offline. Am iPhone bleiben deine Daten nur so dauerhaft gespeichert.", time: "30 Sek.", act: 'data-goto="wissen:installieren"' },
  ];
  return { open: all.filter((x) => !x.done), done: all.filter((x) => x.done).length, total: all.length };
}
export function renderNextSteps() {
  const box = $("#nextSteps"); if (!box) return;
  const installed = typeof matchMedia === "function" && (matchMedia("(display-mode: standalone)").matches || navigator.standalone === true);
  const dr = loadDraft("onboarding"), draftStep = dr && Number.isInteger(dr.value?.step) && !($("#sheet") && !$("#sheet").hidden) ? dr.value.step : null;
  const n = nextSteps({ personas: personas(), goalSet: !!store.get("goal", null), age: ageOf(situation()), depot: depotList().length, backupAt: store.get("backupAt", null) || store.get("autoAt", null), installed, draftStep });
  if (!n.open.length) { box.hidden = true; return; }
  box.hidden = false;
  const pctDone = Math.round((n.done / n.total) * 100);
  box.innerHTML = `<div class="ns-head"><b>Dein nächster Schritt</b><span class="fine">Profil zu ${pctDone} % fertig</span></div>
    <div class="ns-bar" role="progressbar" aria-valuenow="${pctDone}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pctDone}%"></i></div>
    ${n.open.slice(0, 2).map((x, i) => `<button type="button" class="ns-item ${i === 0 ? "first" : ""}" ${x.act}><span><b>${esc(x.title)}</b> <span class="fine">· ${esc(x.time)}</span><br><span class="fine">${esc(x.why)}</span></span><span class="go">›</span></button>`).join("")}
    ${n.open.length > 2 ? `<p class="fine">Danach noch ${n.open.length - 2} weitere Schritt${n.open.length - 2 === 1 ? "" : "e"}. Alles freiwillig.</p>` : ""}`;
}

// ---------- Install guide for the device in use ----------
/** Which device/browser this is, for the right install steps. Pure given the user agent. */
export function deviceOf(ua = "", standalone = false) {
  if (standalone) return "installed";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Edg\/|Chrome\//i.test(ua) && !/Mobile/i.test(ua)) return "desktop-chromium";
  if (/Firefox\//i.test(ua)) return "firefox";
  if (/Safari\//i.test(ua)) return "mac-safari";
  return "other";
}
const INSTALL = {
  installed: ["✓ Du nutzt das Radar schon als App.", ["Deine Eingaben bleiben so dauerhaft gespeichert.", "Für ein zweites Gerät: 👤 Mein Profil → Sicherung → „Link fürs andere Gerät“."]],
  ios: ["iPhone / iPad: so installierst du das Radar", ["In <b>Safari</b> unten auf das Teilen-Symbol tippen (Quadrat mit Pfeil nach oben).", "Nach unten scrollen und „<b>Zum Home-Bildschirm</b>“ wählen.", "Oben rechts „<b>Hinzufügen</b>“. Fertig, das Radar-Symbol liegt jetzt bei deinen Apps.", "Wichtig: Nur so bleiben deine Eingaben am iPhone dauerhaft gespeichert."]],
  android: ["Android: so installierst du das Radar", ["In <b>Chrome</b> oben rechts auf ⋮ tippen.", "„<b>App installieren</b>“ oder „Zum Startbildschirm hinzufügen“ wählen.", "Bestätigen. Fertig, das Radar liegt bei deinen Apps."]],
  "desktop-chromium": ["Computer (Chrome / Edge): so installierst du das Radar", ["Oben in der Adresszeile rechts auf das Symbol mit dem Bildschirm und Pfeil klicken (oder oben im Radar auf „App installieren“, falls sichtbar).", "„<b>Installieren</b>“ klicken. Fertig, das Radar öffnet sich wie ein eigenes Programm."]],
  "mac-safari": ["Mac (Safari): so installierst du das Radar", ["Oben im Menü <b>Ablage</b> → „<b>Zum Dock hinzufügen</b>“.", "Fertig, das Radar liegt im Dock."]],
  firefox: ["Firefox: Installieren geht hier leider nicht", ["Am Computer: das Radar in Chrome oder Edge öffnen und dort installieren.", "Als Lesezeichen funktioniert es aber auch in Firefox."]],
  other: ["So installierst du das Radar", ["Im Browser-Menü nach „App installieren“ oder „Zum Startbildschirm“ suchen."]],
};
export function renderInstallMine() {
  const box = $("#installMine"); if (!box) return;
  const standalone = typeof matchMedia === "function" && (matchMedia("(display-mode: standalone)").matches || navigator.standalone === true);
  const [title, steps] = INSTALL[deviceOf(navigator.userAgent, standalone)];
  box.innerHTML = `<div class="install-box"><b>${esc(title)}</b><ol>${steps.map((x) => `<li>${x}</li>`).join("")}</ol>
    <p class="fine">Danach: <button type="button" class="link-btn" data-act="backup">Sicherung einrichten →</button> (schützt deine Eingaben und bringt sie auf andere Geräte). Anleitungen für alle Geräte stehen darunter.</p></div>`;
}

// ---------- Wiring ----------
let typeTimer = 0;
function onDraftInput(e) {
  const inSheet = e.target.closest?.("#sheet"), inDepot = e.target.closest?.("#depotBody .dp-editor");
  if (!inSheet && !inDepot) return;
  clearTimeout(typeTimer);
  typeTimer = setTimeout(() => {
    if (inSheet && ob && !$("#sheet").hidden) { ob.touched = true; captureStep(); saveObDraft(); }
    if (inDepot) saveDraft("depot", rawDepotRows($("#depotBody .dp-editor")));
  }, 400);
}
export function initPersonal({ openPrefs, onGoto }) {
  document.addEventListener("input", onDraftInput);
  document.addEventListener("change", onDraftInput);
  for (const el of document.querySelectorAll("[data-fill]")) el.innerHTML = { value: VALUE_HTML, sources: SOURCES_HTML }[el.dataset.fill] || "";
  document.addEventListener("click", (e) => {
    if (depotClick(e)) return;
    if (!$("#sheet").hidden && onboardingClick(e)) return;
    const g = e.target.closest("[data-goto]");
    if (g) { e.preventDefault(); closeSheet(); const dr = $("#drawer"); if (dr && !dr.hidden) { dr.hidden = true; } const [v, a] = g.dataset.goto.split(":"); (onGoto || goTo)(v, a); return; }
    const act = e.target.closest("[data-act]");
    // quick risk-profile switch on "Heute": one tap, everything follows
    if (e.target.closest("[data-pp-toggle]")) { const c = $("#profilePill .pp-choices"); c.hidden = !c.hidden; e.target.closest("[data-pp-toggle]").setAttribute("aria-expanded", String(!c.hidden)); return; }
    const pp = e.target.closest("[data-pp]");
    if (pp) {
      const k = pp.dataset.pp; store.set("goal", k);
      const plan = store.get("plan", {}) || {}; store.set("plan", { ...plan, profile: k });
      document.dispatchEvent(new CustomEvent("radar:goal", { detail: k }));
      renderSummary(); const c = $("#profilePill .pp-choices"); if (c) c.hidden = false;
      toast(`Profil „${GOALS[k].label}“: Hinweise, Plan und Erklärungen sind angepasst.`); return;
    }
    const kt = e.target.closest("#drawer [data-keep-topic]");
    if (kt) { store.set("mytopics", cleanTopics([...myTopics(), kt.dataset.keepTopic])); kt.textContent = "★ Gemerkt"; kt.disabled = true; toast(`„${kt.dataset.keepTopic}“ gemerkt: erscheint unter „Dein Radar“ und im Feed`); window.dispatchEvent(new Event("radar:topics")); return; }
    const ed = e.target.closest("[data-edit]");
    if (ed && !$("#drawer").hidden) { $("#drawer").hidden = true; }
    if (ed) { openOnboarding(Number(ed.dataset.edit) || 0, true); return; }
    if (e.target.closest("#profileBtn, [data-act='profile']")) { openProfile(openPrefs); return; }
    if (act) { const a = act.dataset.act; if (a === "onboard") openOnboarding(); else if (a === "prefs") { closeSheet(); openPrefs(); } else if (a === "backup") { closeSheet(); openPrefs(); setTimeout(() => $("#backupBox")?.scrollIntoView(), 100); } return; }
    if (e.target.closest("[data-menu]")) { e.preventDefault(); openMenu(); return; }
    if (e.target.closest("#moreSecBtn")) { const v = e.target.closest(".view"); v.classList.toggle("show-folded"); e.target.textContent = v.classList.contains("show-folded") ? "Weitere Bereiche ausblenden" : e.target.textContent.replace("ausblenden", "anzeigen"); return; }
    if (e.target.closest("[data-sheet-close]") || e.target === $("#sheet")) closeSheet();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
  // Portfolio editor: list of instruments on focus, fill in the kind automatically, search all crypto coins
  document.addEventListener("focusin", (e) => { if (e.target.matches?.(".dp-name")) { ensureDatalist(); loadCoins().then(ensureDatalist); } });
  let coinT;
  document.addEventListener("input", (e) => {
    const inp = e.target.closest?.(".dp-name, .dp-qty"); if (!inp) return;
    const row = inp.closest(".dp-row"), nameEl = row.querySelector(".dp-name"), m = matchAny(nameEl.value);
    if (inp === nameEl) {
      nameEl.dataset.ref = m?.ref || "";
      if (m) row.querySelector(".dp-cat").value = m.kind === "crypto" ? "btc" : m.kind === "stock" ? "stock" : CAT_IDS.includes(m.cat) ? m.cat : "other";
      else { clearTimeout(coinT); coinT = setTimeout(() => suggestCoins(nameEl), 350); }
    }
    const q = m && quoteOf(m.ref), qty = Number(row.querySelector(".dp-qty")?.value) || 0;
    let hint = row.querySelector(".dp-hint");
    const text = m ? (q ? `${m.name}: Kurs ${fmtEur(q.last)}${qty ? ` → ${fmtEur(qty * q.last)}` : " · Stück eintragen, dann rechnet das Radar den Wert live"}` : `${m.name}: Kurs wird geladen …`) : "";
    if (!hint && text) { hint = document.createElement("div"); hint.className = "dp-hint"; row.appendChild(hint); }
    if (hint) hint.textContent = text;
  });
  applyInterests(); smartNav();
  if (store.get("openBackup", false)) { store.set("openBackup", false); setTimeout(() => { openPrefs?.(); setTimeout(() => $("#backupBox")?.scrollIntoView({ block: "start" }), 150); }, 900); }
  const h = location.hash;
  if (!store.get("onboarded", false) && !h.startsWith("#plan=") && !h.startsWith("#thema=") && !h.startsWith("#import=")) setTimeout(openOnboarding, 400);
}
