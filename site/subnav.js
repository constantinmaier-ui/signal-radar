// Sub-pages inside a tab: each tab is split into clear areas, and only one area is shown at a time.
// URL: #entdecken/immobilien. Tapping "Immobilien" shows real estate only, nothing else mixed in.
import { $, $$, esc, store } from "./ui.js";

export const SUBS = {
  entdecken: [
    ["anlagen", "📈 Anlagen", ["anlagen", "weitere"]],
    ["trends", "🚀 Trends & Chancen", ["fruehsignale", "trends", "karte", "themen", "perlen", "ipo"]],
    ["rohstoffe", "🛢️ Rohstoffe", ["rohstoffe"]],
    ["immobilien", "🏡 Immobilien", ["immobilien"]],
    ["konjunktur", "🌡️ Konjunktur & Stimmung", ["frueh", "offiziell", "stimmung"]],
  ],
  plan: [
    ["start", "🎯 Ziel & Start", ["bereit", "ziel"]],
    ["depot", "💼 Depot", ["depot", "depotCheck"]],
    ["plan", "🧮 Plan", ["plan", "hebel", "howto"]],
    ["fitness", "💪 Fitness", ["fitness"]],
  ],
  profis: [
    ["news", "📰 Nachrichten", ["feed"]],
    ["profis", "👔 Profis & Insider", ["profis"]],
    ["ereignisse", "⚡ Ereignisse", ["eventsSec"]],
  ],
  wissen: [
    ["lernen", "📚 Lernen", ["wenige", "forschung", "lexikon"]],
    ["zahlen", "🔍 So rechnet das Radar", ["kennzahlen", "methodik"]],
    ["ueber", "ℹ️ Über & App", ["about", "installieren"]],
  ],
};
// Which interest topic puts a sub-page first (ordering only, nothing is hidden)
const SUB_TOPIC = { anlagen: ["stocks", "crypto"], trends: ["themes"], rohstoffe: ["commodities"], immobilien: ["realestate"], konjunktur: ["macro"], news: ["news"], profis: ["pros"] };

/** "#entdecken/immobilien" → ["entdecken", "immobilien"]. Pure. */
export const parseHash = (h) => { const [v, s] = String(h || "").replace(/^#/, "").split("/"); return [v || "", s || ""]; };
/** The sub-page of a view that contains a section. Pure. */
export function subFor(view, anchor) { return (SUBS[view] || []).find(([, , ids]) => ids.includes(anchor))?.[0] || ""; }
/** Sub-pages in display order: those matching the user's interests first. Pure. */
export function orderedSubs(view, interests = []) {
  const list = SUBS[view] || [];
  if (!interests.length) return list;
  const mine = list.filter(([k]) => (SUB_TOPIC[k] || []).some((t) => interests.includes(t)));
  return [...mine, ...list.filter((x) => !mine.includes(x))];
}

let interestsFn = () => [];
/** Shows the chosen sub-page of a view (or the last one used, or the first) and renders the sub-navigation. */
export function applySub(view) {
  const subs = orderedSubs(view, interestsFn()), viewEl = $(`.view[data-view="${view}"]`);
  if (!subs.length || !viewEl) return null;
  const h = location.hash;
  const fromHash = h.startsWith("#plan=") ? "plan" : h.startsWith("#thema=") ? "trends" : parseHash(h)[1];
  let last = null; try { last = sessionStorage.getItem(`radar:sub:${view}`); } catch { /* private mode */ }
  const cur = subs.find(([k]) => k === fromHash) || subs.find(([k]) => k === last) || subs[0];
  try { sessionStorage.setItem(`radar:sub:${view}`, cur[0]); } catch { /* ignore */ }
  let nav = viewEl.querySelector(":scope > .subnav");
  if (!nav) { nav = document.createElement("nav"); nav.className = "subnav"; nav.setAttribute("aria-label", "Bereiche"); viewEl.prepend(nav); }
  nav.innerHTML = subs.map(([k, label]) => `<a href="#${view}/${k}" class="${k === cur[0] ? "on" : ""}" ${k === cur[0] ? 'aria-current="page"' : ""}>${esc(label)}</a>`).join("");
  const all = new Set(subs.flatMap(([, , ids]) => ids));
  for (const sec of $$(":scope > section[id]", viewEl)) sec.hidden = all.has(sec.id) ? !cur[2].includes(sec.id) : false;
  // keep the sections of the sub-page in their defined order
  for (const id of cur[2]) { const el = document.getElementById(id); if (el?.parentElement === viewEl) viewEl.appendChild(el); }
  viewEl.querySelector(".more-sections")?.remove();
  const bar = document.querySelector(".topbar"); if (bar) document.documentElement.style.setProperty("--subnav-top", `${bar.offsetHeight}px`);
  nav.querySelector(".on")?.scrollIntoView?.({ block: "nearest", inline: "center" });
  return cur[0];
}
export function initSubnav(getInterests) { interestsFn = getInterests || interestsFn; }

/** Hash that shows the sub-page containing `anchor` (a section id or any element inside a section). */
export function hashFor(view, anchor) {
  const el = anchor && typeof document !== "undefined" ? document.getElementById(anchor) : null;
  const secId = el?.closest?.("section[id]")?.id || anchor;
  const sub = subFor(view, secId);
  return sub ? `#${view}/${sub}` : `#${view}`;
}

/** Where a signal's details live (view:anchor). */
export function anchorOf(id = "") {
  const map = [[/^(quiet|hot|noise)-/, "entdecken:karte"], [/^ipo-/, "entdecken:ipo"], [/^gem-/, "entdecken:perlen"], [/^com-|^power-/, "entdecken:rohstoffe"],
    [/^mortgage-/, "entdecken:immobilien"], [/^move-|^world-|^crypto-|^stablecoin-/, "entdecken:anlagen"], [/^(curve|credit|sahm)/, "entdecken:frueh"],
    [/^(cons|insider|voices)-/, "profis:profis"], [/^event-/, "profis:eventsSec"]];
  return map.find(([re]) => re.test(id))?.[1] || "heute:signals";
}

/** Readable name of the place a "view:anchor" target lives, e.g. "Entdecken → Trends & Chancen". */
const VIEW_NAMES = { heute: "Heute", plan: "Mein Geld", entdecken: "Entdecken", profis: "Profis & News", wissen: "Wissen" };
export function placeName(goto) {
  const [v, a] = String(goto || "").split(":"), sub = (SUBS[v] || []).find(([k]) => k === subFor(v, a));
  return sub ? `${VIEW_NAMES[v] || v} → ${sub[1].replace(/^\S+\s/, "")}` : VIEW_NAMES[v] || v;
}
