// App-wide search: sections, themes, prices, signals, news, studies, glossary, rent indices, investors.
import { $, $$, esc, fold, pct, ago, safeUrl, state, store, myTopics, cleanTopics, toast } from "./ui.js";
import { LEX } from "./extras.js";
import { MIETSPIEGEL } from "./mietspiegel.js";
import { buildSignals } from "./signals.js";
import { PERSONAS, FACTS } from "./personas.js";
import { aiPrompt } from "./trust.js";

const VIEW_LABEL = { heute: "Heute", plan: "Mein Geld", entdecken: "Entdecken", profis: "Profis & News", wissen: "Wissen" };
const GROUPS = [
  ["sec", "Bereiche"], ["fact", "Was die wenigsten wissen"], ["lex", "Begriffe erklärt"], ["theme", "Themen"], ["price", "Kurse & Anlagen"], ["sig", "Signale heute"],
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
  for (const f of FACTS) add("fact", f.title, f.text, { view: "wissen", anchor: "wenige", open: `fakt-${f.id}` }, `${f.cite} ${f.so} forschung studie`);
  for (const p of PERSONAS) add("sec", `Dein Radar: ${p.label}`, "Heute · eigene Live-Infos", { view: "heute", anchor: "meinradar" });
  if (d.aiJobs?.DE) add("price", "KI-Stellenanzeigen Deutschland", `${(d.aiJobs.DE.share * 100).toFixed(1)} % aller Anzeigen · Indeed Hiring Lab`, { view: "heute", anchor: "meinradar" }, "jobs stellen arbeitsmarkt ki frühsignal");
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

// Words that mean the same thing (German/English, everyday words → finance words). All folded (lower case, ä → ae).
export const SYNONYMS = [
  ["ki", "ai", "kuenstliche intelligenz", "artificial intelligence"], ["krypto", "crypto", "kryptowaehrung"], ["bitcoin", "btc"], ["ethereum", "eth"],
  ["rohstoff", "rohstoffe", "commodity", "commodities"], ["oel", "oil", "rohoel", "erdoel", "brent", "wti"], ["gas", "erdgas", "ttf", "natgas"],
  ["strom", "power", "strompreis"], ["kupfer", "copper"], ["silber", "silver"], ["weizen", "wheat"], ["kakao", "cocoa"], ["kaffee", "coffee"],
  ["immobilie", "immobilien", "real estate", "reit", "haus", "wohnung"], ["bauzins", "bauzinsen", "baufinanzierung", "hypothek", "mortgage"],
  ["zins", "zinsen", "rate", "rates", "leitzins"], ["anleihe", "anleihen", "bond", "bonds"], ["aktie", "aktien", "stock", "stocks"],
  ["etf", "indexfonds", "sparplan"], ["welt", "world", "msci"], ["blase", "bubble", "hype", "ueberhitzt", "ueberhitzung"], ["crash", "absturz", "einbruch"],
  ["stimmung", "sentiment", "angst", "gier", "fear", "greed"], ["insider", "vorstand", "director"], ["investor", "investoren", "superinvestor", "profi", "profis", "13f"],
  ["studie", "studien", "forschung", "research", "paper", "wissenschaft"], ["ipo", "boersengang"], ["inflation", "teuerung"], ["kosten", "gebuehren", "ter"],
  ["miete", "mieten", "mietspiegel"], ["job", "jobs", "stellen", "stellenanzeigen"],
];
// A category word also finds its members (one direction only: "gold" does not find oil).
const CATEGORY = { ki: ["chatgpt", "llm", "openai", "anthropic", "nvidia", "github", "hugging"], krypto: ["bitcoin", "ethereum", "stablecoin"],
  rohstoff: ["oel", "gold", "silber", "kupfer", "gas", "weizen", "kakao", "kaffee", "aluminium"], immobilie: ["miete", "bauzins", "hauspreis"] };
const SYN = new Map();
for (const group of SYNONYMS.map((g) => g.map(fold))) for (const w of group) SYN.set(w, group);
for (const [cat, members] of Object.entries(CATEGORY)) for (const w of SYN.get(fold(cat)) || [fold(cat)]) SYN.set(w, [...new Set([...(SYN.get(w) || [w]), ...members.map(fold)])]);
// Filler words in questions like "lohnt sich gold gerade?" → "gold"
const STOP = new Set("was wie wo wer ist sind lohnt lohnen sich der die das den dem des ein eine einen mit gerade aktuell heute jetzt soll sollte ich kaufen verkaufen gibt es zu zum zur in im fuer und oder von bei auf noch mal bitte mir mein meine meinen wann warum mich dich uns man kann koennen wird gut besser sinnvoll sinn macht".split(" ").map(fold));
/** Query → list of word alternatives: filler words dropped (unless nothing would be left), synonyms added. Pure. */
export function expandQuery(q) {
  const words = fold(q).replace(/[?!.,;:]/g, " ").split(" ").filter(Boolean);
  const core = words.filter((w) => !STOP.has(w));
  return (core.length ? core : words).map((w) => { const alt = SYN.get(w) || [w]; return [w, ...alt.filter((x) => x !== w)]; });
}
/** At most one typo (insert, delete, replace, swap) between a and b? */
export function oneEdit(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length; if (Math.abs(la - lb) > 1) return false;
  let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
const wordIn = (str, w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(str);
const tokens = (it) => (it.tok ||= [...new Set(it.hay.split(/[^a-z0-9&]+/).filter((x) => x.length >= 4))]);
/** Every query word (or a synonym, or the word with one typo) must appear; title hits rank higher. */
export function search(index, q) {
  const groups = expandQuery(q);
  if (!groups.length) return [];
  const hits = [];
  for (const it of index) {
    let s = 0, all = true;
    for (const alts of groups) {
      let best = 0;
      for (const w of alts) {
        const exact = alts[0] === w ? 1 : 0.8; // the typed word counts more than a synonym
        // short words ("ki", "oel", "eth") only as whole words, otherwise "ol" would match "Volatilität"
        const v = w.length < 4 ? (wordIn(it.t, w) ? (it.t.startsWith(w) ? 4 : 3) : wordIn(it.hay, w) ? 1 : 0)
          : it.t.startsWith(w) ? 4 : it.t.includes(` ${w}`) ? 3 : it.t.includes(w) ? 2 : it.hay.includes(w) ? 1 : 0;
        best = Math.max(best, v * exact);
      }
      if (!best && alts[0].length >= 5 && tokens(it).some((t) => oneEdit(alts[0], t) || (t.length > alts[0].length && oneEdit(alts[0], t.slice(0, alts[0].length))))) best = 0.5;
      if (!best) { all = false; break; }
      s += best;
    }
    if (all) hits.push({ ...it, s });
  }
  return hits.sort((a, b) => b.s - a.s);
}

/** Prompt for the user's own AI: their question plus what the radar knows about it. */
export function askAiPrompt(q, hits, d = state.data || {}) {
  const ctx = hits.slice(0, 8).map((h) => `- ${h.title}: ${h.sub.slice(0, 160)}`);
  return [`Meine Frage: ${q.trim()}`, "", ...(ctx.length ? ["Das sagt mein Signal-Radar dazu:", ...ctx, ""] : []),
    d.generatedAt ? aiPrompt(d, []) : "Ich bin Privatanleger. Erkläre in einfachen Worten, mache Vorschläge statt Empfehlungen, nenne Risiken und sage, was gut belegt ist und was nicht."].join("\n");
}

let index = [], built = 0;
const SUGGEST = ["Lohnt sich Gold gerade?", "KI-Blase", "Bitcoin", "Bauzinsen", "Kupfer in Euro", "ETF Kosten", "Mietspiegel München", "Insider", "Buffett"];

function render(q) {
  const box = $("#searchResults");
  if (!q.trim()) {
    box.innerHTML = `<p class="fine">Probier zum Beispiel:</p><div class="chips">${SUGGEST.map((s) => `<button type="button" class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <p class="fine">Tipp: Taste <kbd>/</kbd> öffnet die Suche von überall.</p>`;
    return;
  }
  const hits = search(index, q);
  const enc = encodeURIComponent(askAiPrompt(q, hits));
  const canKeep = cleanTopics([q]).length && !myTopics().some((t) => fold(t) === fold(q));
  const keep = canKeep ? `<button type="button" class="btn btn-ghost btn-sm" data-keep-topic="${esc(q.trim())}">＋ „${esc(q.trim())}“ als eigenes Thema merken</button>` : "";
  const ai = `${keep}<div class="sr-ai">🤖 <b>Frag deine KI:</b> „${esc(q)}“, zusammen mit dem, was das Radar dazu weiß. Öffnet dein eigenes Konto, das Radar sieht nichts davon.
    <div class="bk-btns"><a class="btn btn-ghost" href="https://claude.ai/new?q=${enc}" target="_blank" rel="noopener">Claude fragen ↗</a><a class="btn btn-ghost" href="https://chatgpt.com/?q=${enc}" target="_blank" rel="noopener">ChatGPT fragen ↗</a></div></div>`;
  if (!hits.length) { box.innerHTML = `<div class="empty">Nichts gefunden für „${esc(q)}“. Versuch ein kürzeres Wort oder frag die KI.</div>${ai}`; return; }
  box.innerHTML = GROUPS.map(([g, label]) => {
    const list = hits.filter((h) => h.g === g); if (!list.length) return "";
    return `<div class="sr-group"><h4>${label} <span class="fine">${list.length}</span></h4>${list.slice(0, g === "news" ? 6 : 5).map((h) => {
      const body = `<b>${esc(h.title)}</b><span class="fine">${esc(h.g === "lex" ? h.sub : h.sub.slice(0, 140))}</span>`;
      return h.go.url ? `<a class="sr-item" href="${safeUrl(h.go.url)}" target="_blank" rel="noopener">${body}</a>` : `<button type="button" class="sr-item" data-sr="${h.i}">${body}</button>`;
    }).join("")}</div>`;
  }).join("") + ai;
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
    if (g.open) { const det = document.getElementById(g.open); if (det) det.open = true; }
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
    const kt = e.target.closest("[data-keep-topic]");
    if (kt) { store.set("mytopics", cleanTopics([...myTopics(), kt.dataset.keepTopic])); kt.remove(); toast(`„${kt.dataset.keepTopic}“ gemerkt: erscheint unter „Dein Radar“ und im Feed`); window.dispatchEvent(new Event("radar:topics")); return; }
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
