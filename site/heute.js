// Ansicht „Heute“ (Tages-Check + Signale) und die Bereichs-Navigation.
import { $, $$, esc, fmt, state, store } from "./ui.js";
import { buildSignals, dailyVerdict, ideasFor, GOALS } from "./signals.js";
import { renderPlan } from "./plan.js";
import { prefs, renderAskAi } from "./trust.js";

const KIND = {
  chance: { icon: "↗", label: "Chance", cls: "k-chance" },
  warnung: { icon: "!", label: "Warnung", cls: "k-warn" },
  info: { icon: "i", label: "Gut zu wissen", cls: "k-info" },
};
const VIEW_LABEL = { heute: "Heute", plan: "Mein Plan", maerkte: "Märkte", chancen: "Chancen", profis: "Profis", news: "News", wissen: "Wissen" };

export function renderCheck() {
  const d = state.data, r = d.risk || {};
  const plan = store.get("plan", {});
  const goal = store.get("goal", plan.profile && GOALS[plan.profile] ? plan.profile : "ausgewogen");
  const years = plan.years || 15;
  const v = dailyVerdict(d, goal, years), ideas = ideasFor(d, goal);
  const lv = v.level === "grün" ? "g" : v.level === "rot" ? "r" : "y";
  const word = { g: "Grün", y: "Gelb", r: "Rot" }[lv];
  $("#check").className = `check lvl-${lv}`;
  $("#check").innerHTML = `
    <div class="check-top">
      <div class="lamp" aria-hidden="true"><i class="r"></i><i class="y"></i><i class="g"></i></div>
      <div>
        <div class="eyebrow">Dein Tages-Check · Markt-Ampel <b>${word}</b></div>
        <h1 class="verdict">${esc(v.head)}</h1>
        <div class="meters">
          <span title="0 = Angst, 100 = Blasen-Alarm">Euphorie <b>${fmt(d.bubble?.score)}</b>/100</span>
          <span title="Wie nervös der Markt ist">Stress <b>${fmt(r.stress)}</b>/100</span>
          ${Number.isFinite(r.breadth) ? `<span title="Anteil großer Aktien im Aufwärtstrend">Aufwärtstrend <b>${fmt(r.breadth * 100)} %</b> der Aktien</span>` : ""}
        </div>
      </div>
    </div>
    <div class="goal-pick" role="group" aria-label="Dein Ziel">
      <span class="eyebrow">Dein Ziel</span>
      ${Object.entries(GOALS).map(([k, g]) => `<button type="button" class="goal ${k === goal ? "on" : ""}" data-goal="${k}" title="${esc(g.short)}">${esc(g.label)}</button>`).join("")}
      <span class="fine">${esc(GOALS[goal].short)} · Anlagedauer ${years} Jahre (im Plan änderbar)</span>
    </div>
    <div class="dodont">
      <div class="do"><h3>✓ Sinnvoll jetzt</h3><ul>${v.doList.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="dont"><h3>✕ Lieber lassen</h3><ul>${v.dontList.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>
    ${ideas.length ? `<div class="ideas"><h3>💡 Ideen, die zu deinem Ziel passen</h3><div class="idea-list">${ideas.map((i) => `<div class="idea"><span class="chip">${esc(i.tag)}</span><b>${esc(i.title)}</b><span>${esc(i.why)}</span></div>`).join("")}</div></div>` : ""}
    <div class="check-cta"><span class="fine">Vorschläge auf Basis fester Regeln, keine Empfehlung. Du entscheidest.</span><a class="btn btn-primary" href="#plan">Was heißt das für mein Geld? Plan berechnen</a></div>`;
}

let sigFilter = "all", sigAll = false;
export function renderSignals() {
  const off = prefs().off;
  const all = buildSignals(state.data, state.history).filter((s) => !off.includes(topicOf(s.id)));
  renderAskAi(all);
  const list = all.filter((s) => sigFilter === "all" || s.kind === sigFilter);
  const show = sigAll ? list : list.slice(0, 5);
  $("#sigList").innerHTML = show.length ? show.map((s) => {
    const k = KIND[s.kind];
    return `<article class="sig ${k.cls}">
      <div class="sig-ico" aria-hidden="true">${k.icon}</div>
      <div class="sig-body">
        <div class="sig-meta"><span class="sig-kind">${k.label}</span><span>${esc(s.source)}</span></div>
        <h3>${esc(s.title)}${s.hype ? ' <span class="hype">⚡ Hype</span>' : ""}</h3>
        ${s.hype ? `<p class="hype-why"><b>Warum Hype:</b> ${esc(s.hype)}</p>` : ""}
        <p>${esc(s.text)}</p>
        <p class="sig-todo"><b>Möglicher nächster Schritt:</b> ${esc(s.todo)}</p>
        ${s.view && s.view !== "heute" ? `<a class="sig-link" href="#${s.view}">Details in „${VIEW_LABEL[s.view]}“ →</a>` : ""}
      </div></article>`;
  }).join("") : '<div class="empty">Gerade keine auffälligen Signale. Das ist ein gutes Zeichen: einfach beim Plan bleiben.</div>';
  const more = $("#sigMore");
  more.hidden = list.length <= 5;
  more.textContent = sigAll ? "Weniger anzeigen" : `Alle ${list.length} Signale anzeigen`;
}

export function initSignalControls() {
  $("#sigFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    sigFilter = b.dataset.k; $$("#sigFilter button").forEach((x) => x.classList.toggle("on", x === b)); renderSignals();
  });
  $("#sigMore").addEventListener("click", () => { sigAll = !sigAll; renderSignals(); });
}

// ---------- Bereiche (Hash-Navigation) ----------
const VIEWS = ["heute", "plan", "maerkte", "chancen", "profis", "news", "wissen"];
export function currentView() {
  const h = location.hash.replace("#", "");
  if (h.startsWith("thema=")) return "chancen";
  if (h.startsWith("plan=")) return "plan";
  return VIEWS.includes(h) ? h : "heute";
}
export function showView(onShow) {
  const v = currentView();
  $$(".view").forEach((el) => (el.hidden = el.dataset.view !== v));
  $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === v));
  document.title = v === "heute" ? "Signal-Radar" : `${VIEW_LABEL[v]} · Signal-Radar`;
  if (!location.hash.startsWith("#thema=")) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  onShow?.(v);
}

// Welchem Interessen-Thema gehört ein Signal an? (für „Anpassen“)
export function topicOf(id) {
  if (/^(quiet|hot|noise|ipo)-/.test(id)) return "themes";
  if (/^crypto-|^move-(btc|eth)$|^stablecoin-/.test(id)) return "crypto";
  if (/^com-|^power-|^move-(gold|silver|oil|commodities)$/.test(id)) return "commodities";
  if (/^mortgage-|^move-realestate$/.test(id)) return "realestate";
  if (/^(curve|credit|sahm)/.test(id)) return "macro";
  if (/^event-/.test(id)) return "news";
  if (/^(cons|insider|voices)-/.test(id)) return "pros";
  if (/^(gem|move)-/.test(id)) return "stocks";
  return null; // Gesamtmarkt-Signale werden nie ausgeblendet
}

// Choosing a goal on "Heute" also updates the plan (same profile everywhere)
export function initGoalPicker(onChange) {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-goal]"); if (!b) return;
    const g = b.dataset.goal;
    store.set("goal", g);
    const plan = store.get("plan", {}); plan.profile = g; store.set("plan", plan);
    const sel = document.querySelector('#planForm select[name="profile"]'); if (sel) sel.value = g;
    try { renderPlan(); } catch { /* plan view not ready */ }
    onChange?.();
  });
}
