// Ansicht „Heute“ (Tages-Check + Signale) und die Bereichs-Navigation.
import { $, $$, esc, fmt, state } from "./ui.js";
import { buildSignals, dailyVerdict } from "./signals.js";

const KIND = {
  chance: { icon: "↗", label: "Chance", cls: "k-chance" },
  warnung: { icon: "!", label: "Warnung", cls: "k-warn" },
  info: { icon: "i", label: "Gut zu wissen", cls: "k-info" },
};
const VIEW_LABEL = { heute: "Heute", plan: "Mein Plan", maerkte: "Märkte", chancen: "Chancen", profis: "Profis", news: "News", wissen: "Wissen" };

export function renderCheck() {
  const d = state.data, v = dailyVerdict(d), r = d.risk || {};
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
    <div class="dodont">
      <div class="do"><h3>✓ Sinnvoll jetzt</h3><ul>${v.doList.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="dont"><h3>✕ Lieber lassen</h3><ul>${v.dontList.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>
    <div class="check-cta"><a class="btn btn-primary" href="#plan">Was heißt das für mein Geld? Plan berechnen</a></div>`;
}

let sigFilter = "all", sigAll = false;
export function renderSignals() {
  const all = buildSignals(state.data, state.history);
  const list = all.filter((s) => sigFilter === "all" || s.kind === sigFilter);
  const show = sigAll ? list : list.slice(0, 5);
  $("#sigList").innerHTML = show.length ? show.map((s) => {
    const k = KIND[s.kind];
    return `<article class="sig ${k.cls}">
      <div class="sig-ico" aria-hidden="true">${k.icon}</div>
      <div class="sig-body">
        <div class="sig-meta"><span class="sig-kind">${k.label}</span><span>${esc(s.source)}</span></div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
        <p class="sig-todo"><b>Was du tun kannst:</b> ${esc(s.todo)}</p>
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
