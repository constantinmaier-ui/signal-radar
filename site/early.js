// Early signals: what only a few have noticed yet, and where each theme stands in its life cycle.
// Pure functions first (tested), rendering at the end.
import { $, esc, fmt, pct, ok, store, state, myTopics, fold, safeUrl } from "./ui.js";

const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const DAY = 864e5;

/** Hype score of a theme about a week ago, from the daily archive. Pure. */
export function hypeWeekAgo(history = [], id, now = Date.now()) {
  const h = [...history].reverse().find((x) => Date.parse(x.date) <= now - 6.5 * DAY && Array.isArray(x.themes?.[id]));
  return h && ok(h.themes[id][0]) ? h.themes[id][0] : null;
}

/**
 * How well known a theme already is, 0–100: half attention (hype score), half how far the price
 * has already run (distance to the 200-day average, −5 % → 0, +35 % → 100). Pure.
 */
export function awareness(t) {
  const sc = t.scores || {}, pr = t.price || {};
  const run = ok(pr.ext200) ? clamp(((pr.ext200 + 0.05) / 0.4) * 100) : 50;
  return Math.round(0.5 * (ok(sc.hype) ? sc.hype : 50) + 0.5 * run);
}
export const awarenessLabel = (a) => (a < 40 ? "Kaum bekannt" : a < 65 ? "Wird bekannter" : "Schon bekannt");

/** Why attention is rising now. Returns plain-language reasons; empty = no rise. Pure. */
export function attentionRise(t, prevHype = null) {
  const why = [], sc = t.scores || {};
  if (ok(prevHype) && ok(sc.hype) && sc.hype - prevHype >= 12) why.push(`Aufmerksamkeit in einer Woche von ${Math.round(prevHype)} auf ${Math.round(sc.hype)} von 100 gestiegen`);
  if (ok(t.attention?.mom) && t.attention.mom >= 0.3) why.push(`Wikipedia-Aufrufe ${pct(t.attention.mom, 0)} gegenüber dem Vormonat`);
  if (ok(t.newsAccel) && t.newsAccel >= 1.8) why.push(`Nachrichten der letzten 48 Stunden: ${fmt(t.newsAccel, 1)}-mal so viele wie in den Tagen davor`);
  if (ok(t.hn?.ratio) && t.hn.ratio >= 1.8) why.push(`Entwickler-Forum Hacker News: ${fmt(t.hn.ratio, 1)}-mal so viele Beiträge wie sonst`);
  return why;
}

/** Stages of a theme, ordered from "few know it" to "everybody is in". */
export const STAGES = [
  { id: "vergessen", icon: "😴", label: "Vergessen", text: "Keiner redet darüber, der Kurs ist schwach. Manchmal der Boden, manchmal einfach vorbei." },
  { id: "frueh", icon: "🌱", label: "Frühphase", text: "Aufmerksamkeit steigt gerade, der Kurs hat sich noch kaum bewegt." },
  { id: "still", icon: "📈", label: "Steigt still", text: "Der Kurs steigt, aber kaum jemand redet darüber." },
  { id: "trend", icon: "🔥", label: "Im Trend", text: "Kurs und Aufmerksamkeit hoch: Viele sind schon dabei." },
  { id: "heiss", icon: "🫧", label: "Überhitzt", text: "Weit über dem Durchschnitt gelaufen. Rücksetzer werden wahrscheinlicher." },
];
/** Stage of one theme (or null when nothing stands out). Pure. */
export function themeStage(t, prevHype = null) {
  const q = t.scores?.quadrant, pr = t.price || {};
  if (q === "overheated") return "heiss";
  // Early = price still flat (not already running, not falling on bad news) and attention rising
  // for at least two independent reasons, or a clear jump of the attention score within a week
  const flat = (pr.chg1m ?? 0) < 0.06 && (pr.chg1m ?? 0) > -0.05 && (pr.ext200 ?? 0) < 0.12;
  const why = attentionRise(t, prevHype), jump = ok(prevHype) && ok(t.scores?.hype) && t.scores.hype - prevHype >= 12;
  if (flat && (why.length >= 2 || jump)) return "frueh";
  if (q === "quiet") return "still";
  if (q === "hot") return "trend";
  if (q === "forgotten") return "vergessen";
  return null;
}

// Personas → the themes they care about (for "dein Thema" and sorting)
const PERSONA_THEMES = {
  ki: ["ai", "chips", "power", "quantum", "robotics", "cyber", "space"],
  krypto: ["crypto"],
  rohstoffe: ["gold", "rareearth", "battery", "nuclear"],
  einkauf: ["rareearth", "battery", "power", "gold"],
  etf: ["india"],
};
/** Theme ids that matter to this user: personas, own topics and watchlist. Pure given the inputs. */
export function myThemeIds({ personas = [], topics = [], watch = [], keywords = {}, themes = [] } = {}) {
  const ids = new Set(personas.flatMap((p) => PERSONA_THEMES[p] || []));
  for (const w of watch) if (themes.some((t) => t.id === w)) ids.add(w);
  for (const tp of topics) {
    const f = fold(tp);
    for (const t of themes) if (fold(t.name).includes(f) || (keywords[t.id] || []).some((k) => fold(k) === f || (f.length >= 4 && fold(k).includes(f)))) ids.add(t.id);
  }
  return ids;
}

/**
 * Early signals from independent sources, least known first. Every item says why it is early,
 * how well known it already is and how good the evidence is. Pure.
 */
export function earlySignals(d = {}, history = [], mine = new Set(), now = Date.now()) {
  const out = [];
  for (const t of d.themes || []) {
    const prev = hypeWeekAgo(history, t.id, now), stage = themeStage(t, prev), pr = t.price || {};
    if (stage === "frueh") out.push({
      id: `early-${t.id}`, kind: "theme", theme: t.id, mine: mine.has(t.id), awareness: awareness(t),
      title: `${t.name}: Aufmerksamkeit steigt, Kurs noch nicht`,
      why: [...attentionRise(t, prev), `Kurs des Themen-ETF ${t.etf}: 1 Monat ${pct(pr.chg1m, 0)}`],
      evidence: "schwach bis mittel", src: "Da, Engelberg & Gao (2011): Mehr Suchinteresse ging kurzfristig steigenden Kursen voraus, später gab es einen Teil wieder ab.",
      todo: "Beobachten und auf die Merkliste setzen. Nicht sofort kaufen: Viele Frühsignale verpuffen.",
    });
    if (stage === "still") out.push({
      id: `still-${t.id}`, kind: "theme", theme: t.id, mine: mine.has(t.id), awareness: awareness(t),
      title: `${t.name}: Kurs steigt, kaum jemand redet darüber`,
      why: [`Themen-ETF ${t.etf}: 3 Monate ${pct(pr.chg3m, 0)}`, `Aufmerksamkeit nur ${Math.round(t.scores?.hype ?? 0)} von 100`],
      evidence: "mittel", src: "Momentum-Forschung: Jegadeesh & Titman (1993); Moskowitz & Grinblatt (1999) für Branchen.",
      todo: "Passt das Thema zu dir, ist eine kleine Beimischung im Themen-Anteil deines Plans denkbar. Vorher Kurs und Risiko im Detail ansehen.",
    });
  }
  // Only specialist outlets report it so far, not the big media
  for (const n of d.news || []) {
    if (n.reach !== "specialist" || !(n.echo >= 2)) continue;
    const th = (n.themes || [])[0];
    out.push({
      id: `fach-${fold(n.title).slice(0, 40)}`, kind: "news", theme: th || null, mine: (n.themes || []).some((x) => mine.has(x)), awareness: 25,
      title: n.title, url: n.url,
      why: [`${n.echo} Fachmedien berichten (${(n.outlets || []).slice(0, 3).join(", ")}), große Medien noch nicht`],
      evidence: "schwach", src: "Huberman & Regev (2001): Eine Nachricht bewegte den Kurs erst, als große Medien sie Monate später aufgriffen.",
      todo: "Lesen und einordnen. Wenn große Medien es später aufgreifen, kann sich das Thema bewegen, muss aber nicht.",
    });
  }
  // Several managers buy their own company's shares
  for (const b of d.insiders?.buys || []) {
    if (!b.cluster) continue;
    out.push({
      id: `ins-${b.sym}`, kind: "insider", sym: b.sym, mine: mine.has(b.sym), awareness: 30,
      title: `${b.buyers?.length || "Mehrere"} Manager kaufen eigene Aktien: ${b.name} (${b.sym})`,
      why: [`Gemeldet bei der US-Börsenaufsicht (Formular 4), zuletzt ${b.last || "kürzlich"}`, `Zusammen rund ${fmt(b.total)} $`, "Steht selten in den Nachrichten"],
      evidence: "mittel", src: "Lakonishok & Lee (2001); Cohen, Malloy & Pomorski (2012): Käufe mehrerer Insider sagten im Schnitt bessere Kurse voraus.",
      todo: "Im Profi-Bereich ansehen. Ein Insider-Kauf ist ein Hinweis, kein Beweis.",
    });
  }
  // New position of a single top investor (before others follow)
  const cons = new Set((d.superinvestors?.consensusBuys || []).map((c) => fold(c.name)));
  for (const inv of d.superinvestors?.investors || []) {
    const m = (inv.moves || []).find((x) => x.type === "neu" && !cons.has(fold(x.name)) && !/\b(ETF|TRUST|INDEX|FUND)\b/i.test(x.name));
    if (!m) continue;
    out.push({
      id: `neu-${inv.id}`, kind: "investor", mine: false, awareness: 45,
      title: `Neu bei ${inv.person}: ${m.name}`,
      why: [`Pflichtmeldung (13F) zum Quartal bis ${inv.quarter || "–"}, eingereicht ${inv.filed || "–"}`, "Noch kein anderer Top-Investor hat nachgezogen"],
      evidence: "schwach", src: "Die Meldungen kommen bis zu 45 Tage nach Quartalsende. Der Investor kann längst wieder verkauft haben.",
      todo: "Als Idee notieren, nicht blind nachkaufen.",
    });
  }
  return out.sort((a, b) => (b.mine - a.mine) || (a.awareness - b.awareness));
}

/** Themes per stage for the life-cycle strip. Pure. */
export function stageMap(d = {}, history = [], now = Date.now()) {
  const map = Object.fromEntries(STAGES.map((s) => [s.id, []]));
  for (const t of d.themes || []) { const s = themeStage(t, hypeWeekAgo(history, t.id, now)); if (s) map[s].push(t); }
  return map;
}

// ---------- Rendering ----------
export function currentMine(d = state.data || {}) {
  let pers = []; try { pers = store.get("personas", []) || []; } catch { /* ignore */ }
  return myThemeIds({ personas: Array.isArray(pers) ? pers : [], topics: myTopics(), watch: [...(state.watch || [])], keywords: d.keywords?.themes || {}, themes: d.themes || [] });
}
const dots = (a) => { const n = a < 40 ? 1 : a < 65 ? 2 : 3; return `<span class="aw aw-${n}" title="Bekanntheit ${a} von 100">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`; };
let showAll = false;
export function renderEarly() {
  const box = $("#earlyBody"); if (!box) return;
  const d = state.data || {}, mine = currentMine(d);
  const list = earlySignals(d, state.history || [], mine), map = stageMap(d, state.history || []);
  const strip = `<div class="cycle" role="list" aria-label="Lebenszyklus der Themen">${STAGES.map((s) => `<div class="cyc cyc-${s.id}" role="listitem">
      <b>${s.icon} ${esc(s.label)}</b><span class="fine">${esc(s.text)}</span>
      <div class="cyc-names">${map[s.id].map((t) => `<button type="button" class="chip-btn ${mine.has(t.id) ? "on" : ""}" data-open="${esc(t.id)}">${mine.has(t.id) ? "★ " : ""}${esc(t.short || t.name)}</button>`).join("") || '<span class="fine">–</span>'}</div></div>`).join("")}</div>
    <p class="fine cyc-legend"><span class="lg-wide">← wenige wissen davon · viele sind schon drin →</span><span class="lg-narrow">Oben: wenige wissen davon. Unten: viele sind schon drin.</span>${mine.size ? " ★ = dein Thema." : ""}</p>`;
  const shown = showAll ? list : list.slice(0, 5);
  const cards = shown.map((x) => `<article class="early">
      <div class="early-head">${dots(x.awareness)}<span class="fine">${esc(awarenessLabel(x.awareness))}${x.mine ? " · 🎯 dein Thema" : ""}</span></div>
      <h3>${x.url ? `<a href="${safeUrl(x.url)}" target="_blank" rel="noopener">${esc(x.title)} ↗</a>` : esc(x.title)}</h3>
      <ul>${x.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
      <p class="sig-todo"><b>Was kannst du tun?</b> ${esc(x.todo)}</p>
      <div class="act-row">${x.theme ? `<button type="button" class="act-btn" data-open="${esc(x.theme)}">Thema im Detail →</button>` : ""}${x.kind === "insider" || x.kind === "investor" ? '<button type="button" class="act-btn" data-goto="profis:profis">Zu Profis & Insider →</button>' : ""}${x.theme ? `<button type="button" class="act-btn" data-keep-early="${esc(x.theme)}">★ Merken</button>` : ""}</div>
      <p class="fine">Beweislage: <b>${esc(x.evidence)}</b>. ${esc(x.src)}</p></article>`).join("");
  box.innerHTML = `${strip}
    <h3 class="sec-h">Frühsignale${mine.size ? ": deine Themen zuerst" : ""}</h3>
    ${cards || '<div class="empty">Gerade kein Frühsignal. Das Radar prüft alle 15 Minuten: steigende Aufmerksamkeit bei ruhigem Kurs, Meldungen nur in Fachmedien, Käufe mehrerer Insider, neue Positionen einzelner Top-Investoren.</div>'}
    ${list.length > 5 ? `<button type="button" class="btn btn-ghost" data-early-more>${showAll ? "Weniger anzeigen" : `Alle ${list.length} Frühsignale anzeigen`}</button>` : ""}
    <details class="evid"><summary>Wie erkennt das Radar Frühsignale?</summary>
      <p>Es sucht nach Dingen, die sich bewegen, <b>bevor</b> sie im Kurs und in den großen Medien stehen: Aufmerksamkeit (Wikipedia-Aufrufe, Nachrichtenmenge, Entwickler-Forum) steigt, der Kurs aber noch nicht; nur Fachmedien berichten; mehrere Manager kaufen eigene Aktien; ein einzelner Top-Investor steigt neu ein. Die Bekanntheit (●○○ bis ●●●) mischt Aufmerksamkeit und wie weit der Kurs schon gelaufen ist.</p>
      <p><b>Ehrlich:</b> Frühsignale sind unsicherer als Trends. Viele verpuffen. Sie sind Hinweise zum Beobachten, keine Kaufempfehlung.</p></details>`;
}
export function initEarly(onChange) {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-early-more]")) { showAll = !showAll; renderEarly(); return; }
    const k = e.target.closest("[data-keep-early]"); if (!k) return;
    state.watch?.add?.(k.dataset.keepEarly);
    try { store.set("watch", [...state.watch]); } catch { /* ignore */ }
    k.textContent = "★ Gemerkt"; k.disabled = true; onChange?.();
  });
}
