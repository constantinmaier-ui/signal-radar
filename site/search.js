// App-wide search: sections, themes, prices, signals, news, studies, glossary, rent indices, investors.
import { $, $$, esc, fold, pct, ago, safeUrl, state } from "./ui.js";
import { LEX } from "./extras.js";
import { MIETSPIEGEL } from "./mietspiegel.js";
import { buildSignals } from "./signals.js";

const VIEW_LABEL = { heute: "Heute", plan: "Mein Geld", entdecken: "Entdecken", profis: "Profis & News", wissen: "Wissen" };
const GROUPS = [
  ["sec", "Bereiche"], ["lex", "Begriffe erklärt"], ["theme", "Themen"], ["price", "Kurse & Anlagen"], ["sig", "Signale heute"],
  ["city", "Mietspiegel"], ["pro", "Profis & Insider"], ["tech", "KI-Software"], ["paper", "Forschung"], ["news", "Nachrichten"],
];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Builds the search index from the current data and the page's sections. */
export function buildIndex(d = state.data || {}, doc = typeof document !== "undefined" ? document : null) {
  const out = [];
  const add = (g, title, sub, go, extra = "") => out.push({ i: out.length, g, title: String(title || ""), sub: String(sub || ""), go, hay: fold(`${title} ${sub} ${extra}`), t: fold(title) });
  if (doc) for (const sec of doc.querySelectorAll("section[id]")) {
    const h = sec.querySelector("h2"); const v = sec.closest(".view")?.dataset.view;
    if (h && v) add("sec", h.textContent.trim(), VIEW_LABEL[v] || "", { view: v, anchor: sec.id }, sec.querySelector(".sub")?.textContent || "");
  }
  for (const [k, v] of Object.entries(LEX)) add("lex", k, v, { view: "wissen", anchor: "lexikon" });
  for (const t of d.themes || []) add("theme", t.name, `Thema · ${t.etf || ""}`, { theme: t.id }, `${t.short || ""} ${(t.tickers || []).map((x) => x.sym).join(" ")}`);
  for (const m of d.market || []) add("price", m.name, `Markt-Überblick · ${pct(m.chg1d)} heute`, { view: "heute", anchor: "market" }, m.sym);
  for (const a of d.assets || []) add("price", a.name, `${a.group || "Anlage"} · ${pct(a.chg1m)} 1 Monat`, { detail: `asset:${a.id}` }, `${a.sym} ${a.alt || ""} ${a.examples || ""}`);
  for (const c of d.commodities || []) add("price", c.name, `Rohstoff · ${pct(c.chg1m)} 1 Monat`, { detail: `com:${c.id}` }, `${c.sym} ${c.group || ""}`);
  for (const a of d.analysts || []) add("price", a.name, `${a.sym} · Kursziel-Potenzial ${pct(a.upside, 0)}`, { view: "profis", anchor: "profis" }, a.sym);
  for (const w of d.ipoWatch || []) add("theme", w.name, "Börsengang-Radar", { view: "entdecken", anchor: "ipo" }, "ipo börsengang");
  try { for (const s of buildSignals(d, state.history || [])) add("sig", s.title, s.text, { view: s.view || "heute", anchor: "signals" }); } catch { /* data incomplete */ }
  for (const [k, v] of Object.entries(MIETSPIEGEL)) add("city", `Mietspiegel ${cap(k)}`, v.ed || v.pub || "", { city: k }, "miete mieten wohnung");
  for (const i of d.superinvestors?.investors || []) add("pro", i.person || i.fund, `${i.fund || ""} · ${i.style || ""}`, { view: "profis", anchor: "profis" }, (i.top || []).map((h) => h.name).join(" "));
  for (const b of d.insiders?.buys || []) add("pro", `${b.sym} ${b.name}`, "Insider-Kauf (Vorstand/Aufsichtsrat)", { view: "profis", anchor: "insiders" });
  (d.tech?.repos || []).forEach((r, i) => add("tech", r.name, `GitHub-Projekt · ${r.desc || ""}`, { detail: `repo:${i}` }, r.ticker || ""));
  (d.tech?.models || []).forEach((m, i) => add("tech", m.name, `KI-Modell · ${m.task || ""}`, { detail: `model:${i}` }, m.ticker || ""));
  for (const list of ["top", "recent"]) (d.papers?.[list] || []).forEach((p, i) => add("paper", p.de || p.title, `${p.journal} · ${p.date || ""} · begutachtet`, { detail: `paper:${list}:${i}` }, `${p.title} ${p.summary || ""}`));
  (d.research || []).forEach((p, i) => add("paper", p.de || p.title, `${p.source} · Arbeitspapier`, { detail: `study:${i}` }, p.title));
  for (const n of [...(state.live || []), ...(d.news || [])]) add("news", n.title, `${n.source || ""} · ${ago(n.published)}`, { url: n.url });
  return out;
}

/** Every query word must appear; title hits rank higher. */
export function search(index, q) {
  const words = fold(q).split(" ").filter(Boolean);
  if (!words.length) return [];
  const hits = [];
  for (const it of index) {
    if (!words.every((w) => it.hay.includes(w))) continue;
    let s = 0;
    for (const w of words) s += it.t.startsWith(w) ? 4 : it.t.includes(` ${w}`) ? 3 : it.t.includes(w) ? 2 : 1;
    hits.push({ ...it, s });
  }
  return hits.sort((a, b) => b.s - a.s);
}

let index = [], built = 0;
const SUGGEST = ["DAX", "Gold", "KI", "Bitcoin", "ETF", "Mietspiegel München", "Zinsen", "Insider", "Studie"];

function render(q) {
  const box = $("#searchResults");
  if (!q.trim()) {
    box.innerHTML = `<p class="fine">Probier zum Beispiel:</p><div class="chips">${SUGGEST.map((s) => `<button type="button" class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <p class="fine">Tipp: Taste <kbd>/</kbd> öffnet die Suche von überall.</p>`;
    return;
  }
  const hits = search(index, q);
  if (!hits.length) { box.innerHTML = `<div class="empty">Nichts gefunden für „${esc(q)}“. Versuch ein kürzeres Wort.</div>`; return; }
  box.innerHTML = GROUPS.map(([g, label]) => {
    const list = hits.filter((h) => h.g === g); if (!list.length) return "";
    return `<div class="sr-group"><h4>${label} <span class="fine">${list.length}</span></h4>${list.slice(0, g === "news" ? 6 : 5).map((h) => {
      const body = `<b>${esc(h.title)}</b><span class="fine">${esc(h.g === "lex" ? h.sub : h.sub.slice(0, 140))}</span>`;
      return h.go.url ? `<a class="sr-item" href="${safeUrl(h.go.url)}" target="_blank" rel="noopener">${body}</a>` : `<button type="button" class="sr-item" data-sr="${h.i}">${body}</button>`;
    }).join("")}</div>`;
  }).join("");
}

function go(it, openDetailFor) {
  close();
  const g = it.go;
  if (g.theme) { location.hash = `thema=${g.theme}`; return; }
  if (g.detail) { openDetailFor(g.detail); return; }
  const view = g.city ? "entdecken" : ({ maerkte: "entdecken", chancen: "entdecken", news: "profis" }[g.view] || g.view), anchor = g.city ? "immobilien" : g.anchor;
  if (location.hash !== `#${view}`) location.hash = view;
  setTimeout(() => {
    if (g.city) { const inp = $("#msCity"); if (inp) { inp.value = cap(g.city); inp.dispatchEvent(new Event("input", { bubbles: true })); } }
    const el = document.getElementById(anchor); if (!el) return;
    if (el.classList.contains("folded")) el.closest(".view")?.classList.add("show-folded");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600);
  }, 80);
}

function open() {
  if (Date.now() - built > 30000) { index = buildIndex(); built = Date.now(); }
  $("#searchBox").hidden = false; document.body.style.overflow = "hidden";
  const inp = $("#searchInput"); inp.focus(); inp.select(); render(inp.value);
}
function close() { $("#searchBox").hidden = true; document.body.style.overflow = ""; }

export function initSearch(openDetailFor) {
  $("#searchBtn").addEventListener("click", open);
  $("#searchClose").addEventListener("click", close);
  $("#searchBox").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) { close(); return; }
    const s = e.target.closest("[data-suggest]"); if (s) { $("#searchInput").value = s.dataset.suggest; render(s.dataset.suggest); return; }
    const r = e.target.closest("[data-sr]"); if (r) { go(index[+r.dataset.sr], openDetailFor); return; }
    if (e.target.closest("a.sr-item")) close();
  });
  let t; $("#searchInput").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => render(e.target.value), 80); });
  $("#searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = $("#searchResults .sr-item"); if (first) first.click(); }
    if (e.key === "ArrowDown") { e.preventDefault(); $("#searchResults .sr-item")?.focus(); }
  });
  $("#searchResults").addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const items = $$("#searchResults .sr-item"), i = items.indexOf(document.activeElement);
    (e.key === "ArrowDown" ? items[i + 1] : i <= 0 ? $("#searchInput") : items[i - 1])?.focus();
  });
  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest?.("input, textarea, select, [contenteditable]");
    if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); open(); }
    if (e.key === "Escape" && !$("#searchBox").hidden) close();
  });
}
